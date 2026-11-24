export const site = {
  meta: {
    title: 'Portofolio — [ISI DI SINI]',
    description: 'Portofolio pribadi [ISI DI SINI]. Jelajahi project-project yang sudah saya buat.',
    ogImage: '',
    author: '[ISI DI SINI]',
    themeColor: '#0a0e1a',
  },

  hero: {
    eyebrow: 'Pembangun Web · Pecinta Petir',
    name: '[ISI DI SINI]',
    tagline: 'Aku bukan hero. Tapi aku bisa bikin pintu terbuka.',
    scrollHint: 'Gulir untuk masuk',
    projectTitle: 'Project',
    projectLead: 'Gerbang berikutnya. Pilih satu.',
  },

  nav: [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Project', href: '#project' },
    { label: 'Tentang Saya', href: '#tentang' },
    { label: 'Kontak', href: '#kontak' },
  ],

  // Urutan video: ganti posisi nama file di array ini untuk menukur urutan.
  // Video 1 = video-1.mp4 (membuka pintu), Video 2 = video-2.mp4 (Zenitsu terjun).
  // Skenario utama: video re-encode keyframe rapat di public/video/scrub/.
  // Asli di public/video/ tetap utuh (tidak disentuh), fallback bisa dipakai jika scrub gagal.
  videos: [
    import.meta.env.BASE_URL + 'video/scrub/video-1.mp4',
    import.meta.env.BASE_URL + 'video/scrub/video-2.mp4',
  ],
  // Fallback urutan asli: ['/video/video-1.mp4', '/video/video-2.mp4'],

  // Progress (0..1) untuk tiap momen overlay di atas video.
  timeline: {
    heroFadeStart: 0.08,
    heroFadeEnd: 0.18,
    projectTitleStart: 0.55,
    projectTitleEnd: 0.65,
    cardsStart: 0.82,
    cardsEnd: 0.92,
    lightningAt: [0.18, 0.55, 0.82],
  },

  stageScrollVh: 900,

  // Label melayang ala frame Figma di atas video. Posisi dalam persen (0-100).
  // depth: kecepatan parallax, z: kedalaman translateZ (px).
  stageBadges: [],

  projects: [
    {
      title: 'Aplikasi Belajar Bahasa Jepang',
      description:
        'Latihan JLPT dari Hiragana-Katakana sampai N1. Ada flashcard dan kuis untuk menguji ingatan.',
      tags: ['React', 'JavaScript', 'CSS'],
      image: '',
      url: 'https://github.com/[ISI DI SINI]',
    },
    {
      title: '[ISI DI SINI]',
      description: '[ISI DI SINI]',
      tags: ['[ISI DI SINI]'],
      image: '',
      url: '[ISI DI SINI]',
    },
    {
      title: '[ISI DI SINI]',
      description: '[ISI DI SINI]',
      tags: ['[ISI DI SINI]'],
      image: '',
      url: '[ISI DI SINI]',
    },
  ],

  about: {
    heading: 'Tentang Saya',
    text: '[ISI DI SINI]',
    skills: ['[ISI DI SINI]', '[ISI DI SINI]', '[ISI DI SINI]'],
  },

  contact: {
    heading: 'Kontak',
    text: '[ISI DI SINI]',
    links: [
      { label: 'Email', value: '[ISI DI SINI]', href: 'mailto:[ISI DI SINI]' },
      { label: 'GitHub', value: '[ISI DI SINI]', href: '[ISI DI SINI]' },
      { label: 'LinkedIn', value: '[ISI DI SINI]', href: '[ISI DI SINI]' },
      { label: 'Instagram', value: '[ISI DI SINI]', href: '[ISI DI SINI]' },
    ],
  },

  footer: {
    note: 'Dibuat dengan cepat, tajam, dan tegas. [ISI DI SINI]',
  },
}
