/**
 * 生成微信小程序 TabBar 占位图标（81x81 PNG）
 * 运行方式：node scripts/generate-icons.js
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// PNG 构造工具
function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  let crc = 0 ^ -1
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

/**
 * 生成 81x81 PNG，纯色圆 + 居中字母
 */
function generateIcon(letter, hexColor, bgColor = '#ffffff') {
  const SIZE = 81
  const pixels = Buffer.alloc(SIZE * SIZE * 4)

  // 解析颜色
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const bgR = parseInt(bgColor.slice(1, 3), 16)
  const bgG = parseInt(bgColor.slice(3, 5), 16)
  const bgB = parseInt(bgColor.slice(5, 7), 16)

  // 字母的简易 5x7 点阵（每个图标自定义）
  const letterMap = {
    H: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  }

  const matrix = letterMap[letter] || letterMap.H
  const cellSize = 7 // 每像素格大小
  const offsetX = Math.floor((SIZE - 5 * cellSize) / 2)
  const offsetY = Math.floor((SIZE - 7 * cellSize) / 2)
  const circleR = SIZE / 2 - 4
  const center = SIZE / 2

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = (y * SIZE + x) * 4
      // 圆形裁剪
      const dx = x - center + 0.5
      const dy = y - center + 0.5
      const dist = Math.sqrt(dx * dx + dy * dy)
      const inCircle = dist <= circleR

      if (!inCircle) {
        // 圆外透明
        pixels[idx] = 0
        pixels[idx + 1] = 0
        pixels[idx + 2] = 0
        pixels[idx + 3] = 0
        continue
      }

      // 是否在字母区域内
      const lx = Math.floor((x - offsetX) / cellSize)
      const ly = Math.floor((y - offsetY) / cellSize)
      let isLetter = false
      if (lx >= 0 && lx < 5 && ly >= 0 && ly < 7) {
        isLetter = matrix[ly][lx] === '1'
      }

      if (isLetter) {
        // 字母白色
        pixels[idx] = 255
        pixels[idx + 1] = 255
        pixels[idx + 2] = 255
        pixels[idx + 3] = 255
      } else {
        // 圆内填充
        pixels[idx] = r
        pixels[idx + 1] = g
        pixels[idx + 2] = b
        pixels[idx + 3] = 255
      }
    }
  }

  // 添加 PNG 滤镜行（每行前加 0 字节表示无过滤）
  const filtered = Buffer.alloc(SIZE * (SIZE * 4 + 1))
  for (let y = 0; y < SIZE; y++) {
    filtered[y * (SIZE * 4 + 1)] = 0 // 过滤器类型
    pixels.copy(filtered, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
  }

  // 压缩
  const compressed = zlib.deflateSync(filtered)

  // 构造 PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0)
  ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const ICONS = [
  { name: 'home', letter: 'H' },
  { name: 'pomodoro', letter: 'P' },
  { name: 'todo', letter: 'T' },
  { name: 'verse', letter: 'V' },
  { name: 'quiz', letter: 'Q' },
]

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'tabbar')
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

ICONS.forEach(({ name, letter }) => {
  // 普通态：灰色
  const normal = generateIcon(letter, '#9ca3af')
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), normal)

  // 选中态：薄荷绿
  const active = generateIcon(letter, '#1a9464')
  fs.writeFileSync(path.join(OUT_DIR, `${name}-active.png`), active)

  console.log(`  ✓ ${name}.png / ${name}-active.png`)
})

console.log(`\n✅ 生成 ${ICONS.length * 2} 个占位图标 (81x81 PNG)`)
console.log(`📁 位置: ${OUT_DIR}`)
console.log(`\n💡 提示: 占位图标为单色圆+字母，正式部署前建议替换为：`)
console.log(`   - 彩色 emoji 风图标（推荐）`)
console.log(`   - 线性图标（如 IconPark / Heroicons）`)
console.log(`   - 尺寸：81x81px（普通态 / 选中态 各一份）`)
