import React, { useEffect, useMemo, useState } from 'react'
import { storage } from '@/utils/storage'

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
  function exportText() {
    const lines = todos.slice()
      .sort((a,b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt)
      .map((t, i) => `${i+1}. [${t.done?'✓':' '}] ${t.star?'⭐ ':''}${t.text}${t.dueAt?`  ·  ${fmtDate(t.dueAt)}`:''}`)
      .join('\n')
    const head = `我的芥菜种子待办清单\n导出时间：${new Date().toLocaleString()}\n完成：${stats.done}/${stats.all}\n\n`
    const blob = new Blob([head + lines], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `芥菜种子待办_${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
        <button onClick={exportText} className="btn-press shrink-0 px-3 py-2 rounded-xl text-xs text-mint-700 border border-mint-100 bg-white hover:bg-mint-50">
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
    </div>
  )
}

export default Todo
