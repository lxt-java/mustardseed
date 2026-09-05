import React, { useEffect, useMemo, useState } from 'react'
import { storage } from '@/utils/storage'
import { svgToPngDataUrl, shareImageFile, escXml } from '@/utils/shareImage'
import { getShareTheme } from '@/utils/shareThemes'
import ShareThemePicker from '@/components/ShareThemePicker'

export interface TodoItem {
  id: string
  text: string
  done: boolean
  star?: boolean
  createdAt: number
  dueAt?: number
}

const STORAGE_KEY = 'mint.todo.v1'
type Filter = 'all' | 'today' | 'todo' | 'done' | 'star'

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all',    label: '全部', icon: '📋' },
  { key: 'today',  label: '今天', icon: '🌿' },
  { key: 'todo',   label: '待办', icon: '⏳' },
  { key: 'star',   label: '星标', icon: '⭐' },
  { key: 'done',   label: '已完成', icon: '✅' },
]

const SUGGESTIONS = [
  '整理今天的会议纪要',
  '喝水 2L 💧',
  '下午散步 15 分钟',
  '回复未读邮件',
  '读书 20 分钟',
  'Review 昨天的待办',
]

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(-4)
}
function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d.getTime() }
function endOfToday() { return startOfToday() + 86400000 - 1 }
function fmtDate(ts?: number): string {
  if (!ts) return ''
  const today = startOfToday()
  if (ts >= today && ts <= today + 86400000 - 1) return '今天'
  const t = today + 86400000
  if (ts >= t && ts <= t + 86400000 - 1) return '明天'
  const d = new Date(ts)
  return `${d.getMonth()+1}/${d.getDate()}`
}

const Todo: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>(() => storage.get<TodoItem[]>(STORAGE_KEY, []))
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportCopied, setExportCopied] = useState(false)
  const [exportPng, setExportPng] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [shareTheme, setShareTheme] = useState('classic')

  useEffect(() => { storage.set(STORAGE_KEY, todos) }, [todos])

  const todayStart = startOfToday()
  const todayEnd = endOfToday()

  const stats = useMemo(() => {
    const today = todos.filter(t =>
      (t.dueAt && t.dueAt >= todayStart && t.dueAt <= todayEnd) ||
      (!t.dueAt && t.createdAt >= todayStart && t.createdAt <= todayEnd)
    )
    return {
      all: todos.length,
      done: todos.filter(t => t.done).length,
      today: today.length,
      todayDone: today.filter(t => t.done).length,
      star: todos.filter(t => t.star).length,
    }
  }, [todos, todayStart, todayEnd])

  const progress = stats.all === 0 ? 0 : Math.round((stats.done / stats.all) * 100)

  const visible = useMemo(() => {
    let list = todos.slice()
    switch (filter) {
      case 'today':
        list = list.filter(t =>
          (t.dueAt && t.dueAt >= todayStart && t.dueAt <= todayEnd) ||
          (!t.dueAt && t.createdAt >= todayStart && t.createdAt <= todayEnd))
        break
      case 'todo': list = list.filter(t => !t.done); break
      case 'done': list = list.filter(t => t.done); break
      case 'star': list = list.filter(t => t.star); break
    }
    list.sort((a, b) => {
      if (!!a.star !== !!b.star) return (a.star ? 0 : 1) - (b.star ? 0 : 1)
      if (a.done !== b.done) return Number(a.done) - Number(b.done)
      return b.createdAt - a.createdAt
    })
    return list
  }, [todos, filter, todayStart, todayEnd])

  function addTodo() {
    const text = input.trim()
    if (!text) return
    setTodos((arr) => [{ id: uid(), text, done: false, createdAt: Date.now() }, ...arr])
    setInput('')
  }
  function toggle(id: string) { setTodos((arr) => arr.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function toggleStar(id: string) { setTodos((arr) => arr.map(t => t.id === id ? { ...t, star: !t.star } : t)) }
  function remove(id: string) { setTodos((arr) => arr.filter(t => t.id !== id)) }
  function setDue(id: string, offsetDays: number | null) {
    setTodos((arr) => arr.map(t => {
      if (t.id !== id) return t
      if (offsetDays === null) return { ...t, dueAt: undefined }
      const d = new Date(); d.setHours(23, 59, 59, 999); d.setDate(d.getDate() + offsetDays)
      return { ...t, dueAt: d.getTime() }
    }))
  }
  function startEdit(t: TodoItem) { setEditingId(t.id); setEditText(t.text); setOpenMenuFor(null) }
  function saveEdit() {
    const text = editText.trim()
    if (text && editingId) {
      setTodos((arr) => arr.map(t => t.id === editingId ? { ...t, text } : t))
    }
    setEditingId(null)
  }
  function clearDone() {
    if (!confirm('确认清除所有已完成的待办吗？')) return
    setTodos((arr) => arr.filter(t => !t.done))
  }
  function buildExportText(): string {
    const lines = todos.slice()
      .sort((a,b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt)
      .map((t, i) => `${i+1}. [${t.done?'✓':' '}] ${t.star?'⭐ ':''}${t.text}${t.dueAt?`  ·  ${fmtDate(t.dueAt)}`:''}`)
      .join('\n')
    return `我的芥菜种子待办清单\n导出时间：${new Date().toLocaleString()}\n完成：${stats.done}/${stats.all}\n\n${lines}`
  }

  // 手机端剪贴板（navigator.clipboard 在微信/旧浏览器不可用时回退 execCommand）
  async function copyExport() {
    const text = buildExportText()
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        ok = document.execCommand('copy')
        ta.remove()
      } catch { ok = false }
    }
    if (ok) {
      setExportCopied(true)
      setTimeout(() => setExportCopied(false), 1800)
    }
  }

  // 待办分享图：卡片式设计，与金句图风格统一
  function buildTodoSvg(themeId = 'classic'): string {
    const photo = themeId !== 'classic'
    const W = 800
    const padX = 56
    const FONT = "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    const list = todos.slice()
      .sort((a,b) => Number(a.done) - Number(b.done) || Number(b.star) - Number(a.star) || b.createdAt - a.createdAt)
    const MAX = 15
    const show = list.slice(0, MAX)
    const more = list.length - show.length

    const now = new Date()
    const week = ['日','一','二','三','四','五','六'][now.getDay()]
    const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 · 星期${week}`

    const wrapChars = (s: string, n: number): string[] => {
      const out: string[] = []
      for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n))
      return out.length ? out : ['']
    }

    const items: string[] = []
    let y = 96

    items.push(`<text x="${padX}" y="${y}" font-size="32" font-weight="700" fill="#104c37" font-family="${FONT}">🌱 我的待办清单</text>`)
    y += 48
    items.push(`<text x="${padX}" y="${y}" font-size="20" fill="#5b9c80" font-family="${FONT}">${escXml(dateStr)}</text>`)
    y += 42

    // 进度条
    const barW = W - padX * 2
    const ratio = stats.all ? stats.done / stats.all : 0
    items.push(`<rect x="${padX}" y="${y - 16}" width="${barW}" height="14" rx="7" fill="#e3f5ec"/>`)
    if (ratio > 0) {
      items.push(`<rect x="${padX}" y="${y - 16}" width="${Math.round(barW * ratio)}" height="14" rx="7" fill="#1a9464"/>`)
    }
    y += 32
    items.push(`<text x="${padX}" y="${y}" font-size="21" font-weight="600" fill="#157652" font-family="${FONT}">已完成 ${stats.done}/${stats.all} · 今日 ${stats.todayDone}/${stats.today}</text>`)
    y += 44

    if (show.length === 0) {
      items.push(`<text x="${W/2}" y="${y + 30}" text-anchor="middle" font-size="24" fill="#8aa89a" font-family="${FONT}">今天还没有待办，添加一件小事开始吧 🌱</text>`)
      y += 90
    }

    show.forEach((t) => {
      const cy = y - 8
      if (t.done) {
        items.push(`<circle cx="${padX + 13}" cy="${cy}" r="13" fill="#1a9464"/>`)
        items.push(`<path d="M ${padX + 7} ${cy + 1} l 4 4 l 8 -9" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
      } else {
        items.push(`<circle cx="${padX + 13}" cy="${cy}" r="13" fill="none" stroke="#9fd8c0" stroke-width="3"/>`)
      }
      const textX = padX + 44
      const lines = wrapChars((t.star ? '⭐ ' : '') + t.text, 21)
      const fill = t.done ? '#a3bcaf' : '#0f3d2e'
      lines.forEach((ln, i) => {
        items.push(`<text x="${textX}" y="${y}" font-size="25" font-weight="500" fill="${fill}" font-family="${FONT}">${escXml(ln)}</text>`)
        if (i === 0 && t.done) {
          const lw = Math.min(ln.length * 25, W - padX - textX - 80)
          items.push(`<line x1="${textX}" y1="${y - 9}" x2="${textX + lw}" y2="${y - 9}" stroke="#a3bcaf" stroke-width="2.5" stroke-linecap="round"/>`)
        }
        y += 36
      })
      if (t.dueAt) {
        items.push(`<text x="${textX}" y="${y}" font-size="18" fill="#8aa89a" font-family="${FONT}">📅 ${escXml(fmtDate(t.dueAt))}</text>`)
        y += 30
      }
      y += 16
    })

    if (more > 0) {
      items.push(`<text x="${padX + 44}" y="${y}" font-size="20" fill="#8aa89a" font-family="${FONT}">… 还有 ${more} 条待办</text>`)
      y += 44
    }

    const height = Math.max(480, y + 80)

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
  <text x="${W - padX}" y="${height - 30}" text-anchor="end" font-size="17" fill="#7fb8a0" font-family="${FONT}">🌱 芥菜种子 · mustardseed</text>
</svg>`
  }

  // 点击「导出」：按所选主题生成图片并弹出保存弹层
  async function openExport(themeId: string) {
    setShareTheme(themeId)
    setExportOpen(true)
    setExportPng(null)
    setExportLoading(true)
    try {
      const png = await svgToPngDataUrl(buildTodoSvg(themeId), { scale: 2, bgUrl: getShareTheme(themeId).bg })
      setExportPng(png)
    } catch {
      setExportOpen(false)
    } finally {
      setExportLoading(false)
    }
  }

  async function shareTodoImage() {
    if (exportPng) await shareImageFile(exportPng, '芥菜种子待办.png', '我的芥菜种子待办清单')
  }

  return (
    <div className="animate-fade-up">
      {/* Stats */}
      <div className="rounded-2xl p-5 bg-white/80 border border-mint-100 shadow-card">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-mint-700/70">今日进度</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-mint-900">{stats.todayDone}</span>
              <span className="text-sm text-mint-700/60">/ {stats.today} 完成</span>
            </div>
          </div>
          <div className="text-right text-xs text-mint-700/70 leading-relaxed">
            <div>总共 {stats.all} 条 · 已完成 {stats.done}</div>
            <div>⭐ 星标 {stats.star} 条</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-mint-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-mint-500 to-mint-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Input */}
      <div className="mt-4 rounded-2xl bg-white/90 border border-mint-100 shadow-card p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="写下今天要做的事… 回车添加"
            className="flex-1 bg-mint-50/50 rounded-xl px-4 py-2.5 text-sm placeholder:text-mint-700/40 focus:outline-none focus:ring-2 focus:ring-mint-300"
          />
          <button
            onClick={addTodo}
            className="btn-press px-4 py-2.5 rounded-xl bg-mint-600 text-white text-sm font-semibold shadow-sm hover:bg-mint-700"
          >
            添加
          </button>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-mint-50 text-mint-700 hover:bg-mint-100 border border-mint-100"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`btn-press shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${active ? 'bg-mint-600 border-mint-600 text-white shadow-sm' : 'bg-white/80 border-mint-100 text-mint-700 hover:bg-mint-50'}`}
            >
              <span className="mr-1">{f.icon}</span>{f.label}
            </button>
          )
        })}
        <div className="flex-1" />
        {stats.done > 0 && (
          <button onClick={clearDone} className="btn-press shrink-0 px-3 py-2 rounded-xl text-xs text-rose-500 border border-rose-100 bg-rose-50/40 hover:bg-rose-50">
            清除已完成
          </button>
        )}
        <button onClick={() => openExport(shareTheme)} className="btn-press shrink-0 px-3 py-2 rounded-xl text-xs text-mint-700 border border-mint-100 bg-white hover:bg-mint-50">
          导出
        </button>
      </div>

      {/* List */}
      <div className="mt-3 space-y-2">
        {visible.length === 0 && (
          <div className="py-16 text-center text-mint-700/60 text-sm">
            <div className="text-4xl mb-3">🌱</div>
            {filter === 'done' ? '还没有完成的待办，加油！' :
             filter === 'todo' ? '暂时没有待处理的任务' :
             filter === 'today' ? '今天还没有安排，添加一个吧' :
             filter === 'star' ? '星标重要的任务，它们会出现在这里' :
             '空空如也，写点什么？'}
          </div>
        )}
        {visible.map(t => {
          const editing = editingId === t.id
          const overdue = !!t.dueAt && !t.done && t.dueAt < Date.now()
          return (
            <div
              key={t.id}
              className={`rounded-2xl p-3 flex items-start gap-3 bg-white/85 border shadow-card transition-all ${t.done ? 'opacity-60 border-mint-50' : 'border-mint-100 hover:border-mint-300'}`}
            >
              <button
                onClick={() => toggle(t.id)}
                className={`btn-press mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${t.done ? 'bg-mint-500 border-mint-500 text-white' : 'border-mint-300 hover:border-mint-500'}`}
              >
                {t.done && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editText}
                      onChange={(e)=>setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1 rounded-lg px-2 py-1 bg-mint-50 border border-mint-200 focus:outline-none focus:ring-2 focus:ring-mint-400"
                    />
                    <button onClick={saveEdit} className="text-xs text-mint-700 px-2 py-1 rounded-lg bg-mint-50">保存</button>
                    <button onClick={()=>setEditingId(null)} className="text-xs text-mint-500 px-2 py-1">取消</button>
                  </div>
                ) : (
                  <div
                    onDoubleClick={() => startEdit(t)}
                    className={`text-[15px] leading-6 break-words ${t.done ? 'line-through text-mint-700/60' : 'text-mint-900'}`}
                  >
                    {t.text}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-mint-700/70">
                  {t.dueAt && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${overdue ? 'bg-rose-50 text-rose-500' : 'bg-mint-50 text-mint-700'}`}>
                      📅 {fmtDate(t.dueAt)}{overdue && ' · 已到期'}
                    </span>
                  )}
                  <span className="opacity-60">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 relative">
                <button
                  title={t.star ? '取消星标' : '星标'}
                  onClick={() => toggleStar(t.id)}
                  className="btn-press w-8 h-8 rounded-lg text-mint-600 hover:bg-mint-50 flex items-center justify-center"
                >
                  {t.star ? (
                    <span className="text-base leading-none">⭐</span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polygon points="12 2 15 9 22 9.3 17 14 18.5 21 12 17.3 5.5 21 7 14 2 9.3 9 9 12 2"/></svg>
                  )}
                </button>
                <button
                  title="更多"
                  onClick={() => setOpenMenuFor(openMenuFor === t.id ? null : t.id)}
                  className="btn-press w-8 h-8 rounded-lg text-mint-600 hover:bg-mint-50 flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </button>
                {openMenuFor === t.id && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setOpenMenuFor(null)} />
                    <div className="absolute right-0 top-9 z-10 w-36 rounded-xl bg-white shadow-soft border border-mint-100 overflow-hidden text-sm animate-fade-up">
                      <button onClick={() => { setDue(t.id, 0); setOpenMenuFor(null) }} className="w-full text-left px-3 py-2 hover:bg-mint-50">📅 今天</button>
                      <button onClick={() => { setDue(t.id, 1); setOpenMenuFor(null) }} className="w-full text-left px-3 py-2 hover:bg-mint-50">📅 明天</button>
                      <button onClick={() => { setDue(t.id, 7); setOpenMenuFor(null) }} className="w-full text-left px-3 py-2 hover:bg-mint-50">📅 下周</button>
                      <button onClick={() => { setDue(t.id, null); setOpenMenuFor(null) }} className="w-full text-left px-3 py-2 hover:bg-mint-50 border-t border-mint-50 text-mint-500">清除日期</button>
                      <button onClick={() => startEdit(t)} className="w-full text-left px-3 py-2 hover:bg-mint-50 border-t border-mint-50">✏️ 编辑</button>
                      <button onClick={() => { remove(t.id); setOpenMenuFor(null) }} className="w-full text-left px-3 py-2 hover:bg-rose-50 border-t border-mint-50 text-rose-500">🗑️ 删除</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 导出图片弹层：手机长按存相册 / 系统分享 / 桌面下载，另附文字复制 */}
      {exportOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setExportOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-3.5 w-full max-w-xs shadow-soft animate-fade-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {exportLoading || !exportPng ? (
              <div className="py-16 text-center text-mint-700/70 text-sm">
                <div className="text-2xl mb-2 animate-pulse">🌱</div>
                正在生成分享图…
              </div>
            ) : (
              <>
                <img src={exportPng} alt="待办分享图" className="w-full rounded-xl border border-mint-100" />
                <ShareThemePicker value={shareTheme} onChange={openExport} />
                <p className="mt-2.5 text-[11px] text-mint-700/70 text-center leading-5">
                  📱 手机：长按图片 →「保存到相册」<br />
                  💻 电脑：点击下方按钮下载
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <a
                    href={exportPng}
                    download={`芥菜种子待办_${new Date().toISOString().slice(0,10)}.png`}
                    className="btn-press px-3.5 py-2 rounded-xl bg-gradient-to-br from-mint-500 to-mint-700 text-white text-xs font-semibold border border-mint-600 shadow-soft"
                  >
                    ⬇️ 下载图片
                  </a>
                  {typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && (
                    <button
                      onClick={shareTodoImage}
                      className="btn-press px-3.5 py-2 rounded-xl bg-mint-50 border border-mint-200 text-mint-700 text-xs font-semibold"
                    >
                      📤 分享 / 保存
                    </button>
                  )}
                  <button
                    onClick={copyExport}
                    className="btn-press px-3.5 py-2 rounded-xl bg-white border border-mint-200 text-mint-700 text-xs font-semibold"
                  >
                    {exportCopied ? '✓ 已复制' : '📋 复制文字'}
                  </button>
                  <button
                    onClick={() => setExportOpen(false)}
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

export default Todo
