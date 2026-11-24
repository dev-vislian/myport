import { site } from './data.js'
import './style.css'

/* =========================================================
   Helper
   ========================================================= */
const $ = (sel, el = document) => el.querySelector(sel)
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel))

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v))
const lerp = (a, b, t) => a + (b - a) * t
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt))

/* =========================================================
   Theme
   ========================================================= */
function initTheme() {
  const stored = localStorage.getItem('theme')
  if (stored) {
    document.documentElement.dataset.theme = stored
  }
  $('.theme-toggle')?.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme
    const next = cur === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
  })
}

/* =========================================================
   Navbar / mobile menu
   ========================================================= */
function initNav() {
  const burger = $('.hamburger')
  const links = $('.nav-links')
  burger?.addEventListener('click', () => links?.classList.toggle('open'))
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => links?.classList.remove('open')))
}

/* =========================================================
   Video stage
   ========================================================= */
function initStage() {
  const wrap = $('.stage-wrap')
  const pin = $('.stage-pin')
  const vids = $$('.video-stack video')
  if (!wrap || vids.length === 0) return

  const tl = site.timeline
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isSmall = window.matchMedia('(max-width: 768px)').matches

  // poster fallback
  const poster = $('.fallback-poster')
  if (isReduced || isSmall) {
    if (poster) poster.style.display = 'block'
    wrap.style.height = 'auto'
    pin.style.position = 'relative'
    pin.style.height = '100vh'
    // hide video
    vids.forEach(v => { v.style.display = 'none' })
    // overlay progress-based opacity for project cards etc. use scroll position vs page
    return
  }

  // setup videos
  vids.forEach((v, i) => {
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.loop = false
    if (i === 0) {
      v.classList.add('v1')
    } else {
      v.classList.add('v2')
      v.style.opacity = '0'
    }
    // preload second from start (load a bit)
    v.load()
  })

  // force poster
  wrap.style.setProperty('--stage-vh', `${site.stageScrollVh}vh`)

  const v1 = vids[0]
  const v2 = vids[1]

  // layer refs
  const nearLayer = $('.layer-near')
  const midLayer = $('.layer-mid')
  const farLayer = $('.layer-far')

  // state
  let targetP = 0
  let smoothP = 0
  let raf = 0
  let lastTs = 0
  let energy = 0
  let rawEnergy = 0
  const frameReady = [true, true]
  const v2Primed = { done: false }
  let lastProgress = 0
  let flashEl = null

  // durations (filled on metadata)
  const dur = { d1: 1, d2: 1, total: 2 }
  function refreshDur() {
    dur.d1 = Math.max(0.1, v1.duration || 1)
    dur.d2 = Math.max(0.1, v2.duration || 1)
    dur.total = dur.d1 + dur.d2
  }
  v1.addEventListener('loadedmetadata', refreshDur)
  v2.addEventListener('loadedmetadata', refreshDur)

  function updateProgress() {
    const rect = wrap.getBoundingClientRect()
    const totalScroll = Math.max(1, wrap.offsetHeight - window.innerHeight)
    const scrollY = -rect.top
    return clamp(scrollY / totalScroll)
  }

  function crossfade(raw) {
    const fw = 0.28
    let a = 1, b = 0
    if (raw > dur.d1 - fw && raw < dur.d1 + fw) {
      const blend = (raw - (dur.d1 - fw)) / (fw * 2)
      a = 1 - blend
      b = blend
    } else if (raw >= dur.d1 + fw) {
      a = 0; b = 1
    }
    v1.style.opacity = a
    v2.style.opacity = b
  }

  function seekToProgress(p) {
    const raw = p * dur.total
    const onV2 = raw >= dur.d1
    const v = onV2 ? v2 : v1
    const maxLocal = onV2 ? dur.d2 : dur.d1
    const localT = clamp(onV2 ? raw - dur.d1 : raw, 0, maxLocal - 0.03)
    crossfade(raw)

    // pre-roll video 2 near the boundary
    if (raw > dur.d1 - 0.7 && !v2Primed.done) {
      try { v2.currentTime = 0.01 } catch (_) {}
      v2Primed.done = true
    }

    const idx = onV2 ? 1 : 0
    if (!frameReady[idx]) return
    if (v.readyState < 2) return
    if (Math.abs(v.currentTime - localT) < 0.024) return
    v.currentTime = localT
    frameReady[idx] = false
    if (typeof v.requestVideoFrameCallback === 'function') {
      v.requestVideoFrameCallback(() => { frameReady[idx] = true })
    } else {
      setTimeout(() => { frameReady[idx] = true }, 24)
    }
  }

  function checkLightning(p) {
    const points = site.timeline.lightningAt || []
    points.forEach(pt => {
      if (lastProgress < pt && p >= pt) flash()
      if (lastProgress > pt && p <= pt) flash()
    })
    lastProgress = p
  }

  function flash() {
    if (isReduced) return
    flashEl = flashEl || $('.lightning-flash')
    if (!flashEl) return
    flashEl.style.transition = 'none'
    flashEl.style.opacity = '0.9'
    requestAnimationFrame(() => {
      flashEl.style.transition = 'opacity .28s ease-out'
      flashEl.style.opacity = '0'
    })
  }

  function updateOverlay(p) {
    const hero = $('.hero-text')
    const pTitle = $('.project-title-overlay')
    const cards = $('.stage-cards')

    const heroOpacity = p < tl.heroFadeStart ? 1 : (p < tl.heroFadeEnd ? 1 - (p - tl.heroFadeStart) / (tl.heroFadeEnd - tl.heroFadeStart) : 0)
    if (hero) hero.style.opacity = heroOpacity

    const pTitleOpacity = p < tl.projectTitleStart ? 0 : (p < tl.projectTitleEnd ? (p - tl.projectTitleStart) / (tl.projectTitleEnd - tl.projectTitleStart) : 1)
    if (pTitle) pTitle.style.opacity = pTitleOpacity

    const cardsOpacity = p < tl.cardsStart ? 0 : (p < tl.cardsEnd ? (p - tl.cardsStart) / (tl.cardsEnd - tl.cardsStart) : 1)
    if (cards) {
      cards.style.opacity = cardsOpacity
      cards.style.pointerEvents = cardsOpacity > 0.5 ? 'auto' : 'none'
      const cp = clamp((p - tl.cardsStart) / (tl.cardsEnd - tl.cardsStart))
      const inv = 1 - cp
      cards.style.transform = `translate3d(0, ${inv * 70}px, ${inv * -180}px) rotateX(${inv * 14}deg)`
    }
  }

  /* ---------- parallax ---------- */
  function scatterDebris(container, count) {
    if (!container) return
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div')
      d.className = 'debris'
      const size = Math.random() * 4 + 1
      d.style.width = size + 'px'
      d.style.height = size + 'px'
      d.style.left = Math.random() * 100 + '%'
      d.style.top = Math.random() * 100 + '%'
      d.style.opacity = 0.4
      d.dataset.speed = (Math.random() * 1.5 + 0.5).toFixed(3)
      d.dataset.baseOpacity = (Math.random() * 0.35 + 0.25).toFixed(3)
      container.appendChild(d)
    }
    for (let i = 0; i < 8; i++) {
      const line = document.createElement('i')
      line.className = 'speedline'
      line.style.left = Math.random() > 0.5 ? '2%' : '98%'
      line.style.top = (Math.random() * 100) + '%'
      line.style.height = (Math.random() * 60 + 20) + 'px'
      line.dataset.speed = (Math.random() * 2 + 0.8).toFixed(3)
      container.appendChild(line)
    }
  }

  function scatterShapes(container, count) {
    if (!container) return
    const shapes = ['door', 'stair', 'beam', 'shard']
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div')
      s.className = 'shape ' + shapes[i % shapes.length]
      s.style.left = Math.random() * 100 + '%'
      s.style.top = Math.random() * 100 + '%'
      s.dataset.speed = (Math.random() * 1.2 + 0.3).toFixed(3)
      s.dataset.baseRotate = (Math.random() * 40 - 20).toFixed(2)
      s.dataset.baseZ = (Math.random() * 100 - 50).toFixed(1)
      s.dataset.dir = Math.random() > 0.5 ? '1' : '-1'
      s.style.transform = `translateZ(${s.dataset.baseZ}px) rotate(${s.dataset.baseRotate}deg)`
      container.appendChild(s)
    }
  }

  scatterDebris(nearLayer, 60)
  scatterShapes(midLayer, 14)

  const nearItems = $$('.debris, .speedline', nearLayer)
  const midItems = $$('.shape', midLayer)
  const chips = $$('.chip')

  function updateParallax(p, e) {
    // dynamic perspective on the pinned container
    const persp = Math.round(1700 - p * 900)
    pin.style.perspective = `${persp}px`
    pin.style.setProperty('--energy', e.toFixed(3))

    // stage chips (figma-style UI elements)
    chips.forEach(chip => {
      const d = parseFloat(chip.dataset.depth) || 0.5
      const z = parseFloat(chip.dataset.z) || 50
      const ty = -p * d * 350
      const tx = Math.sin(p * Math.PI * 2 * d) * 15
      chip.style.transform = `translate3d(${tx}px, ${ty}px, ${z}px) scale(${1 + p * 0.15})`
      chip.style.opacity = clamp(1 - p * 1.2 + 0.3).toFixed(2)
    })

    // near layer - fast, scale up as fall progresses
    const nearScale = 1 + p * 0.32
    const nearY = -p * 420
    const nearZ = p * 120
    if (nearLayer) {
      nearLayer.style.transform = `translate3d(0, ${nearY}px, ${nearZ}px) scale(${nearScale})`
    }
    nearItems.forEach((el, i) => {
      const sp = parseFloat(el.dataset.speed) || 1
      const isLine = el.classList.contains('speedline')
      const x = (isLine ? 0 : (i % 2 ? 1 : -1)) * p * sp * 180
      const y = -p * sp * 300
      const rot = isLine ? 0 : p * sp * 170
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`
      if (isLine) {
        el.style.opacity = clamp(e * sp * 0.95).toFixed(3)
      } else {
        const base = parseFloat(el.dataset.baseOpacity) || 0.3
        el.style.opacity = clamp(base + e * 0.55).toFixed(3)
      }
    })

    // mid layer - slower, slight z
    if (midLayer) {
      midLayer.style.transform = `translate3d(0, ${-p * 350}px, ${p * 80}px)`
    }
    midItems.forEach(el => {
      const sp = parseFloat(el.dataset.speed) || 1
      const dir = parseFloat(el.dataset.dir) || 1
      const baseRot = parseFloat(el.dataset.baseRotate) || 0
      const baseZ = parseFloat(el.dataset.baseZ) || 0
      const rot = baseRot + p * sp * 140
      const z = baseZ + p * 80
      const x = dir * p * sp * 100
      const y = -p * sp * 350
      el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotate(${rot}deg)`
    })

    // far layer - slow
    if (farLayer) {
      farLayer.style.transform = `translate3d(0, ${-p * 110}px, ${p * 12}px) scale(${1 + p * 0.12})`
    }
  }

  function frame(ts) {
    if (!raf) return
    if (!lastTs) lastTs = ts
    const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000))
    lastTs = ts

    const prevSmooth = smoothP
    smoothP = damp(smoothP, targetP, 7.5, dt)
    if (Math.abs(targetP - smoothP) < 0.0002) smoothP = targetP

    const step = Math.abs(smoothP - prevSmooth)
    rawEnergy = Math.max(0, rawEnergy - dt * 2.4)
    const inst = clamp(rawEnergy + step * 16, 0, 1)
    energy = damp(energy, inst, 5, dt)

    seekToProgress(smoothP)
    updateParallax(smoothP, energy)
    updateOverlay(smoothP)
    checkLightning(smoothP)

    raf = requestAnimationFrame(frame)
  }

  function onScroll() {
    const p = updateProgress()
    const delta = Math.abs(p - targetP)
    // Guard micro-pixel scroll to avoid jitter & redundant rAF updates.
    if (delta > 0.001) {
      targetP = p
      rawEnergy = Math.min(1, rawEnergy + delta * 8)
    }
    if (!raf) {
      smoothP = targetP
      lastTs = 0
      raf = requestAnimationFrame(frame)
    }
  }

  raf = requestAnimationFrame(frame)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  // prime
  onScroll()
}

/* =========================================================
   Render project cards (reusable)
   ========================================================= */
function cardHTML(p) {
  const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')
  const img = p.image
    ? `<img src="${p.image}" alt="${p.title}" />`
    : `<span>${p.title}</span>`
  return `
    <article class="card tilt" data-tilt>
      <div class="card-img">${img}</div>
      <h3 class="card-title">${p.title}</h3>
      <p class="card-desc">${p.description}</p>
      <div class="card-tags">${tags}</div>
      <a class="card-btn" href="${p.url}" target="_blank" rel="noopener">Buka project</a>
    </article>`
}

const tiltTargets = new Map()
let tiltRaf = 0
let tiltLastTs = performance.now()

function initTilt() {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const els = $$('.tilt')
  if (isReduced || isMobile || els.length === 0) return

  function tick() {
    const now = performance.now()
    const dt = Math.min(0.05, Math.max(0.001, (now - tiltLastTs) / 1000))
    tiltLastTs = now
    let any = false
    tiltTargets.forEach((t, el) => {
      const curX = parseFloat(el.dataset.tiltCurX) || 0
      const curY = parseFloat(el.dataset.tiltCurY) || 0
      const nx = damp(curX, t.x, 10, dt)
      const ny = damp(curY, t.y, 10, dt)
      el.dataset.tiltCurX = nx.toFixed(3)
      el.dataset.tiltCurY = ny.toFixed(3)
      const settled = Math.abs(nx - curX) < 0.005 && Math.abs(ny - curY) < 0.005
      if (settled && Math.abs(t.x) < 0.005 && Math.abs(t.y) < 0.005) {
        el.style.transform = ''
        tiltTargets.delete(el)
        el.classList.remove('is-tilting')
      } else {
        any = true
        el.style.transform = `perspective(900px) rotateX(${ny}deg) rotateY(${nx}deg) translate3d(6px, -6px, 0)`
      }
    })
    if (!any) { tiltRaf = 0; return }
    tiltRaf = requestAnimationFrame(tick)
  }

  els.forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = clamp((e.clientX - cx) / (r.width / 2), -1, 1)
      const dy = clamp((e.clientY - cy) / (r.height / 2), -1, 1)
      el.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width * 100)}%`)
      el.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height * 100)}%`)
      tiltTargets.set(el, { x: dx * 7, y: -dy * 7 })
      el.classList.add('is-tilting')
      if (!tiltRaf) { tiltLastTs = performance.now(); tiltRaf = requestAnimationFrame(tick) }
    })
    el.addEventListener('mouseleave', () => {
      tiltTargets.set(el, { x: 0, y: 0 })
      el.classList.add('is-tilting')
      if (!tiltRaf) { tiltLastTs = performance.now(); tiltRaf = requestAnimationFrame(tick) }
    })
  })
}

/* =========================================================
   Render page
   ========================================================= */
function render() {
  const app = $('#app')

  const meta = site.meta
  document.title = meta.title
  const desc = document.querySelector('meta[name="description"]')
  if (desc) desc.setAttribute('content', meta.description)

  app.innerHTML = `
    <!-- Navbar -->
    <nav class="navbar">
      <div class="container nav-inner">
        <a href="#beranda" class="brand">
          <span class="brand-mark"></span>
          ${site.hero.name === '[ISI DI SINI]' ? 'PORTFOLIO' : site.hero.name.toUpperCase()}
        </a>
        <ul class="nav-links">
          ${site.nav.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}
        </ul>
        <div class="nav-actions">
          <button class="theme-toggle" aria-label="Toggle theme">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          </button>
          <button class="hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- Stage -->
    <section id="beranda" class="stage-wrap">
      <div class="stage-pin">
        <div class="video-stack">
          ${site.videos.map((src, i) => `<video src="${src}" muted playsinline preload="auto" class="${i===0?'v1':'v2'}"></video>`).join('')}
        </div>
        <div class="fallback-poster"></div>

        <div class="parallax" aria-hidden="true">
          <div class="layer layer-far"></div>
          <div class="layer layer-mid"></div>
          <div class="layer layer-near"></div>
        </div>

        <div class="stage-badges" aria-hidden="true">
          ${site.stageBadges.map(b => `<span class="chip" data-depth="${b.depth}" data-z="${b.z}" style="left:${b.x}%; top:${b.y}%;">${b.label}</span>`).join('')}
        </div>

        <div class="overlay hero-text">
          <p class="eyebrow">${site.hero.eyebrow}</p>
          <h1 class="hero-name">${site.hero.name}</h1>
          <p class="hero-tag">${site.hero.tagline}</p>
          <span class="hero-scroll">${site.hero.scrollHint} ↓</span>
        </div>

        <div class="project-title-overlay" aria-hidden="true">
          <h2>${site.hero.projectTitle}</h2>
          <p>${site.hero.projectLead}</p>
        </div>

        <div class="stage-cards">
          <div class="card-grid">
            ${site.projects.map(cardHTML).join('')}
          </div>
        </div>

        <div class="lightning-flash" aria-hidden="true"></div>
      </div>
    </section>

    <!-- Project section -->
    <section id="project" class="section">
      <div class="uriko-border"></div>
      <div class="container">
        <div class="section-header">
          <p class="eyebrow">Pilihan terbaik</p>
          <h2 class="section-title">Project</h2>
          <p class="section-lead">${site.hero.projectLead}</p>
        </div>
        <div class="card-grid">
          ${site.projects.map(cardHTML).join('')}
        </div>
      </div>
    </section>

    <!-- Tentang -->
    <section id="tentang" class="section">
      <div class="zigzag" aria-hidden="true">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 L10 0 L20 20 L30 0 L40 20 L50 0 L60 20 L70 0 L80 20 L90 0 L100 20" fill="none" stroke="var(--accent)" stroke-width="2"/></svg>
      </div>
      <div class="container">
        <div class="about-grid">
          <div>
            <p class="eyebrow">Tentang saya</p>
            <h2 class="section-title">Tentang<br>Saya</h2>
            <p class="about-text">${site.about.text}</p>
          </div>
          <div>
            <p class="eyebrow">Skill</p>
            <div class="skill-list">
              ${site.about.skills.map(s => `<span class="skill">${s}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Kontak -->
    <section id="kontak" class="section">
      <div class="uriko-border"></div>
      <div class="container">
        <div class="contact-grid">
          <div>
            <p class="eyebrow">Kontak</p>
            <h2 class="section-title">Kontak</h2>
            <p class="contact-text">${site.contact.text}</p>
          </div>
          <ul class="contact-list">
            ${site.contact.links.filter(l => l.value && l.value !== '[ISI DI SINI]').map(l => `
              <li>
                <a class="contact-link" href="${l.href}" target="_blank" rel="noopener">
                  <div>
                    <span class="label">${l.label}</span>
                    <div class="value">${l.value}</div>
                  </div>
                  <span class="arrow">→</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    </section>

    <footer>
      <div class="container">${site.footer.note}</div>
    </footer>
  `
}

/* =========================================================
   Init
   ========================================================= */
render()
initTheme()
initNav()
initStage()
initTilt()