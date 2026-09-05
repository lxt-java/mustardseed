/**
 * 生成分享图内置背景（PNG）→ public/share-bg/*.png
 * 运行：node scripts/gen-share-bg.mjs
 * 风格统一为高明度浅色，保证叠加半透明白层后文字清晰可读。
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'share-bg')
mkdirSync(OUT, { recursive: true })

const W = 1200
const H = 1500

// 纸感颗粒（feTurbulence），各背景共用
const grain = `
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.6  0 0 0 0 0.6  0 0 0 0.05 0"/></filter>`

const svg = (body, defs = '') =>
`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${defs}${grain}</defs>
  ${body}
  <rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`

// 1. 薄荷水彩：白色底 + 薄荷绿水彩晕染
const mint = svg(`
  <rect width="${W}" height="${H}" fill="#fbfefd"/>
  <g filter="url(#blur)">
    <ellipse cx="180" cy="240" rx="420" ry="340" fill="#bfead6" opacity="0.75"/>
    <ellipse cx="1080" cy="520" rx="380" ry="320" fill="#d6f3e5" opacity="0.8"/>
    <ellipse cx="260" cy="1280" rx="460" ry="380" fill="#a7e0c5" opacity="0.55"/>
    <ellipse cx="1040" cy="1330" rx="400" ry="300" fill="#c7eedd" opacity="0.7"/>
  </g>
  <g filter="url(#softblur)" opacity="0.75" fill="#ffffff">
    <ellipse cx="760" cy="280" rx="130" ry="80"/>
    <ellipse cx="860" cy="320" rx="100" ry="60"/>
    <ellipse cx="680" cy="340" rx="80" ry="55"/>
  </g>`,
  `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>
   <filter id="softblur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="38"/></filter>`)

// 2. 米色信纸：暖米色 + 角落植物线稿 + 双线边框
const leafBranch = (x, y, rot, scale) => `
  <g transform="translate(${x},${y}) rotate(${rot}) scale(${scale})" fill="none" stroke="#9a8f73" stroke-width="3" stroke-linecap="round" opacity="0.55">
    <path d="M0 0 C 20 -120 60 -260 30 -420"/>
    <path d="M28 -90 C 90 -120 130 -100 160 -60 C 110 -50 60 -55 28 -90 Z" fill="#b7a986" fill-opacity="0.25"/>
    <path d="M30 -180 C 10 -240 20 -300 70 -330 C 80 -270 70 -220 30 -180 Z" fill="#b7a986" fill-opacity="0.22"/>
    <path d="M34 -270 C 100 -290 140 -270 170 -230 C 120 -225 70 -235 34 -270 Z" fill="#b7a986" fill-opacity="0.2"/>
  </g>`
const cream = svg(`
  <rect width="${W}" height="${H}" fill="#fdf9f0"/>
  <g filter="url(#blur)">
    <ellipse cx="600" cy="700" rx="620" ry="700" fill="#f7eedd" opacity="0.7"/>
    <ellipse cx="1050" cy="1200" rx="380" ry="320" fill="#f3e6cc" opacity="0.5"/>
  </g>  <rect x="48" y="48" width="${W - 96}" height="${H - 96}" rx="28" fill="none" stroke="#c9bd9f" stroke-width="2.5" opacity="0.7"/>
  <rect x="64" y="64" width="${W - 128}" height="${H - 128}" rx="22" fill="none" stroke="#d8cdb2" stroke-width="1.5" opacity="0.6"/>
  ${leafBranch(40, H - 40, -12, 1)}
  ${leafBranch(W - 40, 60, 168, 1)}
  <g opacity="0.35" fill="#c9bd9f">
    <circle cx="600" cy="180" r="5"/><circle cx="640" cy="180" r="5"/><circle cx="560" cy="180" r="5"/>
  </g>`,
  `<filter id="blur"><feGaussianBlur stdDeviation="60"/></filter>`)

// 3. 晴空云朵：淡蓝渐变 + 柔白云朵
const cloud = (x, y, s) => `
  <g transform="translate(${x},${y}) scale(${s})" fill="#ffffff">
    <ellipse cx="0" cy="0" rx="150" ry="70"/>
    <ellipse cx="-110" cy="20" rx="100" ry="55"/>
    <ellipse cx="110" cy="22" rx="110" ry="60"/>
    <ellipse cx="20" cy="-45" rx="90" ry="65"/>
  </g>`
const sky = svg(`
  <rect width="${W}" height="${H}" fill="#eef8fe"/>
  <g filter="url(#blur)">
    <ellipse cx="600" cy="300" rx="700" ry="420" fill="#d9effb" opacity="0.85"/>
    <ellipse cx="500" cy="1300" rx="700" ry="420" fill="#cfe8fa" opacity="0.6"/>
  </g>
  <g filter="url(#softblur)" opacity="0.95">
    ${cloud(330, 320, 1.1)}
    ${cloud(900, 620, 0.9)}
    ${cloud(300, 1050, 0.85)}
    ${cloud(920, 1280, 1.05)}
  </g>
  <g fill="#b7dcf2" opacity="0.6">
    <path d="M180 520 q 20 -18 40 0 q 20 -18 40 0" stroke="#b7dcf2" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M820 880 q 20 -18 40 0 q 20 -18 40 0" stroke="#b7dcf2" stroke-width="6" fill="none" stroke-linecap="round"/>
  </g>`,
  `<filter id="blur"><feGaussianBlur stdDeviation="70"/></filter>
   <filter id="softblur"><feGaussianBlur stdDeviation="14"/></filter>`)

// 4. 蜜桃日出：暖粉橙渐变 + 柔光球
const peach = svg(`
  <rect width="${W}" height="${H}" fill="#fff6f0"/>
  <g filter="url(#blur)">
    <ellipse cx="600" cy="330" rx="480" ry="380" fill="#ffd9c2" opacity="0.9"/>
    <ellipse cx="220" cy="900" rx="420" ry="460" fill="#ffe3d2" opacity="0.75"/>
    <ellipse cx="1050" cy="1050" rx="460" ry="420" fill="#ffcfc0" opacity="0.6"/>
    <ellipse cx="600" cy="1400" rx="600" ry="320" fill="#ffe9dc" opacity="0.8"/>
  </g>
  <circle cx="600" cy="420" r="170" fill="#fff1e2" opacity="0.95" filter="url(#softblur)"/>
  <g stroke="#ec9e73" stroke-width="6" stroke-linecap="round" opacity="0.7">
    <line x1="600" y1="130" x2="600" y2="180"/>
    <line x1="340" y1="220" x2="375" y2="255"/>
    <line x1="860" y1="220" x2="825" y2="255"/>
    <line x1="210" y1="420" x2="260" y2="420"/>
    <line x1="990" y1="420" x2="940" y2="420"/>
  </g>`,
  `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="50"/></filter>
   <filter id="softblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>`)

const jobs = [
  ['bg-mint.jpg', mint],
  ['bg-cream.jpg', cream],
  ['bg-sky.jpg', sky],
  ['bg-peach.jpg', peach],
]

for (const [name, markup] of jobs) {
  await sharp(Buffer.from(markup), { density: 96 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT, name))
  console.log('generated', name)
}
