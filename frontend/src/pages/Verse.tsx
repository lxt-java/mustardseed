import React, { useEffect, useMemo, useRef, useState } from 'react'
import { TAGS_CN, VERSES, type Verse } from '@/data/verses'
import { storage } from '@/utils/storage'
import { svgToPngDataUrl, shareImageFile, escXml } from '@/utils/shareImage'
import { getShareTheme } from '@/utils/shareThemes'
import ShareThemePicker from '@/components/ShareThemePicker'

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
  const [shareOpen, setShareOpen] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [sharePng, setSharePng] = useState<string | null>(null)
  const [shareTheme, setShareTheme] = useState('classic')
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

  // 生成金句分享图 SVG：排版与页面卡片一致（标签 / 中文大字 / 出处 / 分隔线 / 英文斜体）
  function buildShareSvg(themeId = 'classic'): string {
    if (!current) return ''
    const photo = themeId !== 'classic'
    const W = 800
    const padX = 56
    const FONT_SANS = "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    const FONT_SERIF = "Georgia, 'Times New Roman', serif"

    // 字号比页面卡片略大，适合手机全屏查看与社交分享
    const ZH_SIZE = 33
    const ZH_LINE_H = 56
    const EN_SIZE = 21
    const EN_LINE_H = 38

    const zhLines = wrap(current.zh, 19)
    const enLines = dualLang ? wrap(current.en, 54) : []
    const tagMeta = current.tag ? TAGS_CN[current.tag] : null
    const tagLabel = tagMeta ? `${tagMeta.icon ?? ''} ${tagMeta.label ?? ''}`.trim() : ''

    const items: string[] = []
    let y = 86

    // 标题
    items.push(`<text x="${padX}" y="${y}" font-size="30" font-weight="700" fill="#104c37" font-family="${FONT_SANS}">✨ 治愈金句</text>`)
    y += 58

    // 主题标签（与页面卡片一致）
    if (tagLabel) {
      items.push(`<text x="${padX}" y="${y}" font-size="21" font-weight="600" letter-spacing="3" fill="#2f9e74" font-family="${FONT_SANS}">${escXml(tagLabel)}</text>`)
      y += 48
    }

    // 中文正文（逐行递增 y，避免重叠）
    zhLines.forEach((l) => {
      items.push(`<text x="${padX}" y="${y}" font-size="${ZH_SIZE}" font-weight="500" fill="#0f3d2e" font-family="${FONT_SANS}">${escXml(l)}</text>`)
      y += ZH_LINE_H
    })
    y += 12

    // 中文出处（右对齐）
    items.push(`<text x="${W - padX}" y="${y}" text-anchor="end" font-size="23" font-weight="600" fill="#157652" font-family="${FONT_SANS}">—— ${escXml(current.ref)}</text>`)
    y += 46

    // 英文部分（斜体衬线，与页面一致）
    if (enLines.length) {
      items.push(`<line x1="${padX}" y1="${y - 28}" x2="${padX + 96}" y2="${y - 28}" stroke="#9fd8c0" stroke-width="3" stroke-linecap="round"/>`)
      enLines.forEach((l) => {
        items.push(`<text x="${padX}" y="${y}" font-size="${EN_SIZE}" font-style="italic" fill="#3f7a63" font-family="${FONT_SERIF}">${escXml(l)}</text>`)
        y += EN_LINE_H
      })
      y += 10
      items.push(`<text x="${W - padX}" y="${y}" text-anchor="end" font-size="19" fill="#5b9c80" font-family="${FONT_SERIF}">— ${escXml(current.refEn)}</text>`)
      y += 44
    }

    const height = Math.max(580, y + 66)

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}">
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
  ${photo ? '' : `
  <rect width="${W}" height="${height}" fill="url(#bg)"/>
  <g opacity="0.35" transform="translate(680, -40) rotate(20)">
    <path d="M0 0 C 80 40 80 160 0 200 C -30 160 -30 40 0 0 Z" fill="url(#leaf)"/>
  </g>
  <g opacity="0.3" transform="translate(-60, ${height - 120}) rotate(-18)">
    <path d="M0 0 C 90 50 90 180 0 220 C -40 180 -40 50 0 0 Z" fill="url(#leaf)"/>
  </g>`}
  ${items.join('\n  ')}
  <text x="${W - padX}" y="${height - 30}" text-anchor="end" font-size="17" fill="#7fb8a0" font-family="${FONT_SANS}">🌱 芥菜种子 · mustardseed</text>
</svg>`
  }

  // 点击「导出图片」：按所选主题生成 PNG 并弹出保存弹层
  async function openExport(themeId: string) {
    setShareTheme(themeId)
    setShareOpen(true)
    setShareLoading(true)
    setSharePng(null)
    const svg = buildShareSvg(themeId)
    if (!svg) { setShareLoading(false); return }
    try {
      const png = await svgToPngDataUrl(svg, { scale: 2, bgUrl: getShareTheme(themeId).bg })
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
      setShareOpen(false)
    } finally {
      setShareLoading(false)
    }
  }

  // 系统分享面板（iOS/Android 可直接「存储图像」进相册）
  async function sharePngFile() {
    if (sharePng) await shareImageFile(sharePng, '芥菜种子金句.png', '芥菜种子 · 治愈金句')
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
        <ActionBtn onClick={() => openExport(shareTheme)} label="导出图片" icon="💾" />
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
      {shareOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-3.5 w-full max-w-xs shadow-soft animate-fade-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {shareLoading || !sharePng ? (
              <div className="py-16 text-center text-mint-700/70 text-sm">
                <div className="text-2xl mb-2 animate-pulse">🌱</div>
                正在生成分享图…
              </div>
            ) : (
              <>
                <img src={sharePng} alt="金句分享图" className="w-full rounded-xl border border-mint-100" />
                <ShareThemePicker value={shareTheme} onChange={openExport} />
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
                    onClick={() => setShareOpen(false)}
                    className="btn-press px-3 py-2 rounded-xl text-mint-600 text-xs"
                  >
                    关闭
                  </button>
                </div>
              </>
            )}
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
