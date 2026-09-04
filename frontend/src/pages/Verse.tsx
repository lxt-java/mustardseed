import React, { useEffect, useMemo, useRef, useState } from 'react'
import { TAGS_CN, VERSES, type Verse } from '@/data/verses'
import { storage } from '@/utils/storage'

const FAV_KEY = 'mint.verse.fav.v1'

type TagFilter = 'all' | NonNullable<Verse['tag']>

function uid() { return Math.random().toString(36).slice(2, 10) }

const Verse: React.FC = () => {
  const [tag, setTag] = useState<TagFilter>('all')
  const [idx, setIdx] = useState<number>(() => Math.floor(Math.random() * VERSES.length))
  const [lastIds, setLastIds] = useState<number[]>([])
  const [favs, setFavs] = useState<number[]>(() => storage.get<number[]>(FAV_KEY, []))
  const [showFavOnly, setShowFavOnly] = useState(false)
  const [dualLang, setDualLang] = useState<boolean>(true)
  const [showCopyTip, setShowCopyTip] = useState<string | null>(null)
  const [sharePng, setSharePng] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => { storage.set(FAV_KEY, favs) }, [favs])

  const pool = useMemo(() => {
    let list = VERSES.slice()
    if (tag !== 'all') list = list.filter(v => v.tag === tag)
    if (showFavOnly) list = list.filter(v => favs.includes(v.id))
    return list
  }, [tag, showFavOnly, favs])

  const current: Verse | undefined = pool[idx % Math.max(1, pool.length)]

  useEffect(() => {
    // reset to a valid index if pool changed
    setIdx((i) => Math.min(i, Math.max(0, pool.length - 1)))
  }, [pool])

  function randNext(echoLast = true) {
    if (pool.length === 0) return
    if (echoLast) setLastIds((arr) => [current?.id ?? 0, ...arr].slice(0, 10))
    if (pool.length === 1) { setIdx(0); return }
    let n = idx
    let guard = 8
    do {
      n = Math.floor(Math.random() * pool.length)
      guard--
    } while (n === idx && guard > 0)
    setIdx(n)
  }

  function copyText(kind: 'full' | 'zh' | 'en') {
    if (!current) return
    const zh = `${current.zh}\n—— ${current.ref}`
    const en = `${current.en}\n— ${current.refEn}`
    let text = ''
    if (kind === 'zh') text = zh
    else if (kind === 'en') text = en
    else text = `${zh}\n\n${en}`

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setShowCopyTip('已复制到剪贴板 ✅')
        setTimeout(() => setShowCopyTip(null), 1600)
      }).catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }
  }
  function fallbackCopy(t: string) {
    const ta = document.createElement('textarea')
    ta.value = t; document.body.appendChild(ta)
    ta.select(); try { document.execCommand('copy') } catch (e) {}
    document.body.removeChild(ta)
    setShowCopyTip('已复制 ✅')
    setTimeout(() => setShowCopyTip(null), 1600)
  }

  function toggleFav() {
    if (!current) return
    setFavs((arr) =>
      arr.includes(current.id) ? arr.filter(x => x !== current.id) : [current.id, ...arr]
    )
  }

  function buildShareSvg(): string {
    if (!current) return ''
    // Generate a simple SVG data URL with verse text, then download as .svg
    const zhLines = wrap(current.zh, 26)
    const enLines = wrap(current.en, 60)
    const padLR = 40
    const lineH = 30
    const lineHEn = 22
    let y = 120
    const zhBlock = zhLines.map(l => `<text x="${padLR}" y="${y}">${l}</text>`).join('\n') || ''
    y += zhLines.length * lineH + 26
    const enBlock = enLines.map(l => `<text x="${padLR}" y="${y}">${l}</text>`).join('\n') || ''
    y += enLines.length * lineHEn + 34
    const height = Math.max(500, y + 70)
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#effbf6"/>
      <stop offset="55%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d9f5e8"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4fc494"/>
      <stop offset="100%" stop-color="#157652"/>
    </linearGradient>
  </defs>
  <rect width="800" height="${height}" fill="url(#bg)"/>
  <g opacity="0.35" transform="translate(680, -40) rotate(20)">
    <path d="M0 0 C 80 40 80 160 0 200 C -30 160 -30 40 0 0 Z" fill="url(#leaf)"/>
  </g>
  <g opacity="0.3" transform="translate(-60, ${height - 120}) rotate(-18)">
    <path d="M0 0 C 90 50 90 180 0 220 C -40 180 -40 50 0 0 Z" fill="url(#leaf)"/>
  </g>
  <g>
    <text x="${padLR}" y="76" font-size="28" fill="#104c37" font-weight="700" font-family="-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif">✨ 治愈金句</text>
  </g>
  <g font-family="-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif" fill="#104c37" font-size="20" font-weight="500">
    ${zhBlock}
  </g>
  <g font-family="Georgia, 'Times New Roman', serif" fill="#157652" font-size="14" fill-opacity="0.88">
    ${enBlock}
  </g>
  <g font-family="-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif">
    <text x="${padLR}" y="${height - 40}" font-size="14" fill="#157652" font-weight="600">—— ${current.ref}</text>
    <text x="795" y="${height - 40}" text-anchor="end" font-size="12" fill="#157652" fill-opacity="0.7">— ${current.refEn}</text>
    <text x="795" y="${height - 18}" text-anchor="end" font-size="11" fill="#157652" fill-opacity="0.55">🌱 芥菜种子 · mustardseed</text>
  </g>
</svg>`
    return svg
  }

  // SVG 字符串 → PNG dataURL（供长按保存 / 分享 / 下载）
  function svgToPngDataUrl(svg: string, scale = 2): Promise<string> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        try {
          const w = (img.naturalWidth || 800) * scale
          const h = (img.naturalHeight || 600) * scale
          const c = document.createElement('canvas')
          c.width = w
          c.height = h
          const ctx = c.getContext('2d')
          if (!ctx) throw new Error('canvas 2d 不可用')
          ctx.drawImage(img, 0, 0, w, h)
          URL.revokeObjectURL(url)
          resolve(c.toDataURL('image/png'))
        } catch (e) {
          URL.revokeObjectURL(url)
          reject(e)
        }
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG 渲染失败')) }
      img.src = url
    })
  }

  // 点击「导出图片」：转 PNG 后弹出保存弹层
  async function exportImage() {
    const svg = buildShareSvg()
    if (!svg) return
    try {
      const png = await svgToPngDataUrl(svg, 2)
      setSharePng(png)
    } catch {
      // 兜底：极少数不支持 canvas 的环境，退回 svg 下载
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `金句_${current!.ref.replace(/\s/g,'')}_${uid()}.svg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }

  // 系统分享面板（iOS/Android 可直接「存储图像」进相册）
  async function sharePngFile() {
    if (!sharePng) return
    try {
      const blob = await (await fetch(sharePng)).blob()
      const file = new File([blob], '芥菜种子金句.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '芥菜种子 · 治愈金句' })
      }
    } catch { /* 用户取消分享会抛 AbortError，忽略 */ }
  }

  return (
    <div className="animate-fade-up">
      {/* Tag chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['all', 'love','faith','hope','peace','wisdom','strength','grace','comfort','joy'] as TagFilter[]).map(k => {
          const meta = k === 'all' ? { label: '全部', icon: '🌈' } : (TAGS_CN[k] ?? { label: k, icon: '📌' })
          const active = tag === k
          return (
            <button
              key={k}
              onClick={() => { setTag(k); setShowFavOnly(false) }}
              className={`btn-press shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition-all ${active ? 'bg-mint-600 border-mint-600 text-white shadow-sm' : 'bg-white/80 border-mint-100 text-mint-700 hover:bg-mint-50'}`}
            >
              <span className="mr-1">{meta.icon}</span>{meta.label}
            </button>
          )
        })}
        <div className="flex-1" />
        <button
          onClick={() => setShowFavOnly(v => !v)}
          className={`btn-press shrink-0 px-3 py-1.5 rounded-full text-sm border ${showFavOnly ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/80 border-mint-100 text-mint-700 hover:bg-mint-50'}`}
        >
          ⭐ 收藏 {favs.length ? `(${favs.length})` : ''}
        </button>
      </div>

      {/* Verse Card */}
      <div ref={cardRef} className="mt-4 relative verse-card rounded-3xl p-6 sm:p-8 border border-mint-100 shadow-soft">
        <div className="absolute top-4 right-5 text-5xl leading-none opacity-30 select-none pointer-events-none">”</div>
        <div className="absolute bottom-4 left-5 text-5xl leading-none rotate-180 opacity-20 select-none pointer-events-none">”</div>

        {current ? (
          <div className="animate-fade-up" key={`${current.id}-${idx}`}>
            <div className="text-xs tracking-widest text-mint-600 font-semibold mb-3">
              {current.tag ? `${TAGS_CN[current.tag]?.icon ?? ''} ${TAGS_CN[current.tag]?.label ?? ''}` : ''}
            </div>
            <p className="text-lg sm:text-[20px] leading-8 text-mint-900 font-medium">
              {current.zh}
            </p>
            <p className="mt-2 text-right text-sm text-mint-700">—— {current.ref}</p>

            {dualLang && (
              <>
                <div className="my-5 h-px w-16 bg-mint-200/80" />
                <p className="text-[14px] leading-7 text-mint-700/90 font-serif italic">
                  {current.en}
                </p>
                <p className="mt-2 text-right text-xs text-mint-600/80">— {current.refEn}</p>
              </>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-mint-700/60">
            <div className="text-3xl mb-2">🌱</div>
            该条件下暂无经文，试试换个标签吧～
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <ActionBtn onClick={() => randNext()} label="换一条" icon="🎲" primary />
        <ActionBtn onClick={toggleFav} label={current && favs.includes(current.id) ? '已收藏' : '收藏'} icon="⭐" />
        <ActionBtn onClick={() => copyText('full')} label="复制" icon="📋" />
        <ActionBtn onClick={exportImage} label="导出图片" icon="💾" />
      </div>

      {/* Options Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 border border-mint-100 shadow-card px-4 py-3 text-sm">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={dualLang} onChange={e=>setDualLang(e.target.checked)}
            className="w-4 h-4 accent-mint-600"/>
          中英双语显示
        </label>
      </div>

      {/* Recent */}
      {lastIds.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-mint-800 mb-2">📜 最近 10 条</div>
          <div className="space-y-2">
            {VERSES.filter(v => lastIds.includes(v.id)).slice(0, 10).map(v => (
              <button
                key={v.id}
                onClick={() => {
                  const pos = pool.findIndex(x => x.id === v.id)
                  if (pos >= 0) setIdx(pos)
                }}
                className="w-full text-left rounded-2xl p-3 bg-white/80 border border-mint-100 shadow-card hover:border-mint-300 transition-all"
              >
                <div className="text-sm text-mint-900 line-clamp-2">{v.zh}</div>
                <div className="mt-1 text-[11px] text-mint-600/80">{v.ref}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Copy tip */}
      {showCopyTip && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 py-2 rounded-full bg-mint-800 text-white text-sm shadow-soft animate-fade-up">
          {showCopyTip}
        </div>
      )}

      {/* 保存图片弹层：手机长按存相册 / 系统分享 / 桌面下载 */}
      {sharePng && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSharePng(null)}
        >
          <div
            className="bg-white rounded-2xl p-3.5 w-full max-w-xs shadow-soft animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={sharePng} alt="金句分享图" className="w-full rounded-xl border border-mint-100" />
            <p className="mt-2.5 text-[11px] text-mint-700/70 text-center leading-5">
              📱 手机：长按图片 →「保存到相册 / 存储图像」<br />
              💻 电脑：点击下方按钮下载
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <a
                href={sharePng}
                download={`芥菜种子金句_${current?.ref.replace(/\s/g, '') || 'verse'}.png`}
                className="btn-press px-3.5 py-2 rounded-xl bg-gradient-to-br from-mint-500 to-mint-700 text-white text-xs font-semibold border border-mint-600 shadow-soft"
              >
                ⬇️ 下载 PNG
              </a>
              {typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && (
                <button
                  onClick={sharePngFile}
                  className="btn-press px-3.5 py-2 rounded-xl bg-mint-50 border border-mint-200 text-mint-700 text-xs font-semibold"
                >
                  📤 分享 / 保存
                </button>
              )}
              <button
                onClick={() => setSharePng(null)}
                className="btn-press px-3 py-2 rounded-xl text-mint-600 text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ActionBtn: React.FC<{onClick:()=>void, label:string, icon:string, primary?:boolean}> = ({onClick, label, icon, primary}) => (
  <button
    onClick={onClick}
    className={`btn-press inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-card ${primary ? 'bg-gradient-to-br from-mint-500 to-mint-700 text-white border-mint-600 shadow-soft' : 'bg-white text-mint-700 border-mint-100 hover:bg-mint-50'}`}
  >
    <span>{icon}</span>{label}
  </button>
)

/** simple char/word wrap */
function wrap(text: string, maxLen: number): string[] {
  if (!text) return []
  // Chinese chars: each counts ~1 width, English: break by words then pad
  const isEn = /^[\x00-\x7F\s]+$/.test(text.slice(0, 10))
  if (isEn) {
    const words = text.split(/\s+/)
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= maxLen) {
        cur = (cur ? cur + ' ' : '') + w
      } else {
        if (cur) lines.push(cur)
        cur = w
      }
    }
    if (cur) lines.push(cur)
    return lines
  }
  // Chinese: just split by characters
  const out: string[] = []
  for (let i = 0; i < text.length; i += maxLen) {
    out.push(text.slice(i, i + maxLen))
  }
  return out
}

export default Verse
