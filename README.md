# Portofolio — Zenitsu & Infinity Castle

Website pribadi/portofolio dengan efek scroll-scrubbed video, parallax 3D, dan tema Zenitsu (Demon Slayer). Tanpa nuansa Jepang — fokus pada aksen kuning emas, oranye petir, pola segitiga (uroko), dan garis zig-zag petir.

## Cara Menjalankan

```bash
npm install
npm run dev
```

Server dev berjalan di `http://localhost:5173`. Untuk produksi:

```bash
npm run build
npm run preview
```

## Cara Mengedit Data

Semua teks, link, urutan video, dan konfigurasi di satu file: **`src/data.js`**. Buat perubahan di sana, tidak perlu sentuh komponen.

### Mengganti Urutan Video

Urutan video diatur di `src/data.js` → `videos` array. Ganti posisi path file:

```js
videos: ['/video/video-2.mp4', '/video/video-1.mp4'], // urutan terbalik
```

- **Video 1** (urutan awal): `video-1.mp4` — adegan membuka pintu Infinity Castle.
- **Video 2** (lanjutan): `video-2.mp4` — Zenitsu terjun ke bawah.

Progress scroll (0 sampai 1) dipetakan ke gabungan durasi Video 1 + Video 2. Scroll maju memutar maju, scroll mundur memutar mundur, berhenti scroll berhenti di frame itu.

### Video Scrub (Re-encode Keyframe Rapat)

Video asli di `public/video/` tidak dimodifikasi. Re-encode salinan di `public/video/scrub/` (H.264, tanpa audio, keyframe rapat `-g 2`) agar scrub smooth.

```bash
#buat folder (sudah otomatis)
New-Item -ItemType Directory -Force -Path public\video\scrub

#re-encode video 1 dan 2
ffmpeg -i public\video\video-1.mp4 -map 0:v:0 -an -c:v libx264 -preset slow -crf 18 -g 2 -keyint_min 2 -sc_threshold 0 -movflags +faststart public\video\scrub\video-1.mp4
ffmpeg -i public\video\video-2.mp4 -map 0:v:0 -an -c:v libx264 -preset slow -crf 18 -g 2 -keyint_min 2 -sc_threshold 0 -movflags +faststart public\video\scrub\video-2.mp4

#ganti target ke scrub (di src/data.js)
videos: ['/video/scrub/video-1.mp4', '/video/scrub/video-2.mp4'],
```

### Mengganti Konten

- `site.hero` → teks hero (nama, tagline, ajakan scroll).
- `site.projects` → kartu project. Isi `title`, `description`, `tags`, `image` (jika ada screenshot di `public/img/`), `url`.
- `site.about` → perkenalan dan daftar skill.
- `site.contact.links` → email, GitHub, LinkedIn, Instagram. Hanya yang diisi (value tidak `[ISI DI SINI]`) yang ditampilkan.
- `site.timeline` → konfigurasi munculnya overlay di atas video (hero fade, project title, kartu, kilat petir).
- `site.stageScrollVh` → total scroll height untuk stage (default 600vh, range 500–700vh).

## Fallback

- **Layar kecil** (`< 768px`): video scrub dinonaktifkan, tampilan frame diam (poster gradien CSS). Parallax ringan.
- **`prefers-reduced-motion`**: semua animasi dinonaktifkan, video digantikan poster, parallax dinonaktifkan.
- **Perangkat lemah**: browser tidak memutar video scrub, tampilan statis.

## Struktur Folder

```
.
├── index.html
├── vite.config.js
├── package.json
├── public/
│   ├── favicon.svg
│   └── video/
│       ├── video-1.mp4   ← Video 1: membuka pintu
│       └── video-2.mp4   ← Video 2: Zenitsu terjun
└── src/
    ├── data.js          ← SATU file data (edit di sini)
    ├── main.js          ← Logika scroll-scrub, parallax, render
    └── style.css        ← Semua gaya (tema Zenitsu, uroko, zigzag)
```

## Catatan

- Video dipanggil lewat URL publik (`/video/nama-file.mp4`), bukan di-import dari `src/`.
- Video asli di `public/video/` **tidak diubah, di-copy, atau di-overwrite**. Jika scrubbing terasa patah (keyframe video jarang), buat versi re-encode ke `public/video/scrub/` (H.264, tanpa audio, keyframe rapat: `ffmpeg -g 2`) dan arahkan `videos` array ke situ.
- Tidak ada library 3D berat (Three.js). Semua efek 3D menggunakan CSS `transform` + `perspective`.