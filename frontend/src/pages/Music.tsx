import React, { useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '@/utils/storage'

/**
 * 音乐小站（音乐播放器 UI 预留版）
 * 三大分类：钢琴曲 / 白噪音 / 热门歌曲
 * 功能：分类浏览、搜索、收藏、本地存储播放列表
 * 音频源留接口：支持粘贴在线 URL / 选择本地文件 / 后续接入
 */

export interface Track {
  id: string
  title: string
  artist: string
  category: 'piano' | 'whitenoise' | 'hot'
  coverColor?: string // 渐变配色索引 0-3
  url?: string
  duration?: number // 秒
  favorite?: boolean
  addedAt?: number
}

const CATS: { key: Track['category']; label: string; icon: string; hint: string; default: Omit<Track,'id'|'addedAt'>[] }[] = [
  {
    key: 'piano', label: '钢琴曲', icon: '🎹', hint: '平静思绪 · 灵感写作',
    default: [
      { title: '卡农 (Canon in D)', artist: 'Pachelbel', category: 'piano', coverColor: '0', duration: 300 },
      { title: 'River Flows in You', artist: 'Yiruma', category: 'piano', coverColor: '1', duration: 210 },
      { title: '梦中的婚礼', artist: 'Richard Clayderman', category: 'piano', coverColor: '2', duration: 198 },
      { title: '天空之城', artist: '久石让', category: 'piano', coverColor: '3', duration: 245 },
      { title: '月光 (Beethoven)', artist: 'Beethoven', category: 'piano', coverColor: '0', duration: 360 },
      { title: '夜的钢琴曲五', artist: '石进', category: 'piano', coverColor: '1', duration: 225 },
    ],
  },
  {
    key: 'whitenoise', label: '白噪音', icon: '🌧️', hint: '助眠 · 办公专注',
    default: [
      { title: '雨声', artist: '自然白噪音', category: 'whitenoise', coverColor: '1', duration: 600 },
      { title: '森林鸟鸣', artist: '自然白噪音', category: 'whitenoise', coverColor: '2', duration: 480 },
      { title: '海浪声', artist: '自然白噪音', category: 'whitenoise', coverColor: '3', duration: 540 },
      { title: '咖啡馆环境音', artist: '环境音', category: 'whitenoise', coverColor: '0', duration: 420 },
      { title: '柴火壁炉声', artist: '环境音', category: 'whitenoise', coverColor: '2', duration: 500 },
      { title: '猫呼噜声', artist: '环境音', category: 'whitenoise', coverColor: '3', duration: 380 },
      { title: '夏日夜晚虫鸣', artist: '自然白噪音', category: 'whitenoise', coverColor: '0', duration: 600 },
    ],
  },
  {
    key: 'hot', label: '热门歌曲', icon: '🔥', hint: '心情旋律 · 轻松一刻',
    default: [
      { title: '晴天', artist: '周杰伦', category: 'hot', coverColor: '0', duration: 269 },
      { title: '稻香', artist: '周杰伦', category: 'hot', coverColor: '1', duration: 223 },
      { title: '光年之外', artist: '邓紫棋', category: 'hot', coverColor: '2', duration: 235 },
      { title: '起风了', artist: '买辣椒也用券', category: 'hot', coverColor: '3', duration: 326 },
      { title: '海阔天空', artist: 'Beyond', category: 'hot', coverColor: '0', duration: 326 },
      { title: '朋友', artist: '周华健', category: 'hot', coverColor: '1', duration: 256 },
      { title: '月亮代表我的心', artist: '邓丽君', category: 'hot', coverColor: '2', duration: 210 },
    ],
  },
]

const GRADS = [
  'from-mint-400 via-emerald-400 to-teal-500',
  'from-sky-400 via-mint-400 to-emerald-400',
  'from-amber-300 via-rose-300 to-pink-400',
  'from-violet-400 via-indigo-400 to-mint-400',
]
const STORAGE_KEY = 'mint.music.v1'

function fmt(sec?: number) {
  if (!sec || !isFinite(sec)) return '00:00'
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(-4) }

const Music: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = storage.get<Track[] | null>(STORAGE_KEY, null)
    if (saved && saved.length > 0) return saved
    const seeded: Track[] = []
    CATS.forEach(c => c.default.forEach(t => seeded.push({ ...t, id: uid(), favorite: false, addedAt: Date.now() })))
    return seeded
  })
  const [cat, setCat] = useState<Track['category']>('piano')
  const [keyword, setKeyword] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(tracks[0]?.id ?? null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [t, setT] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => { storage.set(STORAGE_KEY, tracks) }, [tracks])

  // Create audio once
  useEffect(() => {
    try { audioRef.current = new Audio() } catch {}
    return () => { try { audioRef.current?.pause() } catch {} }
  }, [])

  const list = useMemo(() => {
    let list = tracks.filter(x => x.category === cat)
    if (favOnly) list = list.filter(x => x.favorite)
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(x => x.title.toLowerCase().includes(kw) || x.artist.toLowerCase().includes(kw))
    }
    return list
  }, [tracks, cat, favOnly, keyword])

  const current = tracks.find(x => x.id === currentId) ?? list[0] ?? null

  function playTrack(track: Track) {
    setCurrentId(track.id)
    setT(0)
    if (audioRef.current) {
      try {
        if (track.url) { audioRef.current.src = track.url; audioRef.current.play().catch(() => {}) }
        else { audioRef.current.src = ''; audioRef.current.pause() }
      } catch {}
    }
    setIsPlaying(!!track.url)
  }
  function togglePlay() {
    if (!current) return
    if (!current.url) {
      // no source yet: simulate a playback tick
      setIsPlaying(!isPlaying)
      return
    }
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause()
      else audioRef.current.play().catch(() => {})
    }
    setIsPlaying(!isPlaying)
  }
  function seek(sec: number) {
    setT(sec)
    if (audioRef.current && current?.url) {
      try { audioRef.current.currentTime = sec } catch {}
    }
  }

  // simulation tick when no url
  useEffect(() => {
    if (!current || !isPlaying || current.url) return
    const i = window.setInterval(() => {
      setT((s) => {
        const dur = current.duration ?? 180
        if (s + 1 >= dur) { setIsPlaying(false); return dur }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(i)
  }, [current, isPlaying])

  // sync real audio events (if url exists)
  useEffect(() => {
    const a = audioRef.current; if (!a) return
    const onT = () => setT(a.currentTime || 0)
    const onD = () => setDuration(a.duration && isFinite(a.duration) ? a.duration : (current?.duration || 0))
    const onEnd = () => { setIsPlaying(false) }
    a.addEventListener('timeupdate', onT)
    a.addEventListener('loadedmetadata', onD)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onT)
      a.removeEventListener('loadedmetadata', onD)
      a.removeEventListener('ended', onEnd)
    }
  }, [current?.id, current?.url, current?.duration])

  const [_, setDuration] = useState(0)
  const duration = audioRef.current?.duration && isFinite(audioRef.current.duration) ? audioRef.current.duration : (current?.duration || 0)
  const progress = duration > 0 ? t / duration : 0

  function toggleFav(id: string) {
    setTracks(ts => ts.map(x => x.id === id ? { ...x, favorite: !x.favorite } : x))
  }
  function addFromPrompt() {
    const title = prompt('歌曲名？')?.trim()
    if (!title) return
    const artist = prompt('艺术家/来源？（可留空）')?.trim() || '未知'
    const url = prompt('粘贴音频在线 URL（可留空，后续填入）')?.trim() || ''
    const track: Track = {
      id: uid(), title, artist, category: cat, url,
      coverColor: String(Math.floor(Math.random()*4)),
      duration: 0, favorite: false, addedAt: Date.now(),
    }
    setTracks([track, ...tracks])
  }

  const nextPrev = (dir: 1 | -1) => {
    if (list.length === 0) return
    const curIdx = list.findIndex(x => x.id === currentId)
    const idx = (curIdx + dir + list.length) % list.length
    playTrack(list[idx])
  }

  const grad = current ? GRADS[parseInt(current.coverColor ?? '0') % GRADS.length] : GRADS[0]

  return (
    <div className="animate-fade-up">
      {/* Now playing bar */}
      <div className={`relative rounded-3xl overflow-hidden p-5 text-white shadow-soft bg-gradient-to-br ${grad}`}>
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/20 blur-2xl"/>
        <div className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"/>
        <div className="relative flex items-center gap-4">
          <div className={`shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner ${isPlaying ? 'animate-pulse' : ''}`}>
            <span className="text-4xl sm:text-5xl">{CATS.find(c=>c.key===cat)?.icon ?? '🎵'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] tracking-widest uppercase opacity-80">
              {isPlaying ? '正在播放' : '待播放'}
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold line-clamp-1">
              {current?.title ?? '还没有曲目，先添加一首吧'}
            </div>
            <div className="mt-1 text-sm opacity-90 line-clamp-1">{current?.artist ?? ''}</div>
          </div>
        </div>
        {/* Progress */}
        <div className="relative mt-5">
          <input
            type="range"
            className="mint-range w-full"
            min={0}
            max={Math.max(1, Math.floor(duration))}
            value={Math.floor(t)}
            onChange={(e) => seek(parseInt(e.target.value))}
          />
          <div className="mt-1 flex justify-between text-[11px] opacity-90 font-mono">
            <span>{fmt(t)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        {/* Controls */}
        <div className="mt-3 flex items-center justify-center gap-4">
          <button onClick={()=>nextPrev(-1)}
            className="btn-press w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button onClick={togglePlay}
            className="btn-press w-16 h-16 rounded-full bg-white text-mint-700 shadow-lg flex items-center justify-center">
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button onClick={()=>nextPrev(1)}
            className="btn-press w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        {!current?.url && (
          <div className="mt-4 mx-auto max-w-md rounded-xl bg-white/15 border border-white/20 backdrop-blur px-3 py-2 text-xs text-white/95">
            💡 这是播放器 UI 预留版。点击右侧「…」按钮可给曲目粘贴在线音频 URL；或点击底部「+ 新增曲目」直接添加自己的歌。后续可接入本地音频文件。
          </div>
        )}
      </div>

      {/* Cat Tabs */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {CATS.map(c => {
          const active = c.key === cat
          const count = tracks.filter(x => x.category === c.key).length
          return (
            <button key={c.key} onClick={() => setCat(c.key)}
              className={`card-hover rounded-2xl p-3 sm:p-4 text-left border transition-all ${active ? 'bg-mint-600 text-white border-mint-600 shadow-soft' : 'bg-white/80 border-mint-100 text-mint-900 shadow-card'}`}>
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-1 font-semibold text-sm">{c.label}</div>
              <div className={`mt-0.5 text-[11px] ${active ? 'text-white/80' : 'text-mint-700/60'} line-clamp-1`}>{c.hint}</div>
              <div className={`mt-2 text-[11px] ${active ? 'text-white/90' : 'text-mint-700/70'}`}>{count} 首</div>
            </button>
          )
        })}
      </div>

      {/* Search + filters */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[180px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 border border-mint-100 shadow-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-mint-500">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜歌名或歌手"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-mint-500/50"
          />
        </div>
        <button onClick={()=>setFavOnly(v=>!v)}
          className={`btn-press px-3 py-2 rounded-xl text-sm border ${favOnly ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/80 border-mint-100 text-mint-700 hover:bg-mint-50 shadow-card'}`}>
          ⭐ 收藏
        </button>
        <button onClick={addFromPrompt}
          className="btn-press px-3 py-2 rounded-xl text-sm bg-mint-600 text-white shadow-soft hover:bg-mint-700">
          + 新增
        </button>
      </div>

      {/* Track list */}
      <div className="mt-3 divide-y divide-mint-50 rounded-2xl overflow-hidden bg-white/85 border border-mint-100 shadow-card">
        {list.length === 0 && (
          <div className="py-16 text-center text-mint-700/60 text-sm">
            <div className="text-4xl mb-2">🎵</div>
            暂无匹配的曲目。点右上角「+ 新增」添加你自己的歌吧～
          </div>
        )}
        {list.map(tk => {
          const active = tk.id === currentId
          const g = GRADS[parseInt(tk.coverColor ?? '0') % GRADS.length]
          return (
            <div key={tk.id}
              className={`group flex items-center gap-3 px-3 py-2.5 hover:bg-mint-50/70 ${active ? 'bg-mint-50' : ''}`}>
              <button onClick={()=>playTrack(tk)}
                className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${g} text-white flex items-center justify-center shadow-card`}>
                {active && isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <button onClick={()=>playTrack(tk)} className="flex-1 min-w-0 text-left">
                <div className={`text-sm line-clamp-1 ${active ? 'text-mint-700 font-semibold' : 'text-mint-900'}`}>{tk.title}</div>
                <div className="mt-0.5 text-[11px] text-mint-700/60 line-clamp-1">
                  {tk.artist} · {fmt(tk.duration || 0)}{tk.url ? ' · 可播' : ''}
                </div>
              </button>
              <button onClick={()=>toggleFav(tk.id)}
                className="btn-press w-9 h-9 rounded-lg text-mint-500 hover:bg-mint-50 flex items-center justify-center">
                <span className={tk.favorite ? '' : 'grayscale opacity-50'}>⭐</span>
              </button>
              <div className="relative">
                <MoreMenu
                  onSetUrl={() => {
                    const u = prompt('粘贴在线音频 URL（mp3/wav 直链）', tk.url ?? '')
                    if (u !== null) setTracks(ts => ts.map(x => x.id === tk.id ? { ...x, url: u.trim() || undefined } : x))
                  }}
                  onEdit={() => {
                    const newTitle = prompt('修改歌名', tk.title)
                    if (newTitle && newTitle.trim()) setTracks(ts => ts.map(x => x.id === tk.id ? { ...x, title: newTitle.trim() } : x))
                  }}
                  onDelete={() => {
                    if (confirm(`删除《${tk.title}》？`)) setTracks(ts => ts.filter(x => x.id !== tk.id))
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Tips at bottom */}
      <div className="mt-5 rounded-2xl bg-white/70 border border-mint-100 shadow-card p-4 text-xs text-mint-700/80 leading-relaxed">
        <div className="font-semibold text-mint-800 mb-1">🌿 后续可以继续迭代的方向</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>接入本地音频文件：使用 FileReader 把音频转为本地播放列表</li>
          <li>支持循环、随机、单曲循环三种播放模式</li>
          <li>定时器 / 睡眠模式（定时 15m / 30m / 60m 自动停止）</li>
          <li>在线音频源管理：钢琴曲 CDN、白噪音流 API 等</li>
        </ul>
      </div>
    </div>
  )
}

const MoreMenu: React.FC<{onSetUrl:()=>void, onEdit:()=>void, onDelete:()=>void}> = ({onSetUrl, onEdit, onDelete}) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={()=>setOpen(o=>!o)}
        className="btn-press w-9 h-9 rounded-lg text-mint-500 hover:bg-mint-50 flex items-center justify-center" title="更多">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-0" onClick={()=>setOpen(false)}/>
          <div className="absolute right-0 top-10 z-10 w-36 rounded-xl bg-white shadow-soft border border-mint-100 overflow-hidden text-sm animate-fade-up">
            <button onClick={()=>{onSetUrl(); setOpen(false)}} className="w-full text-left px-3 py-2 hover:bg-mint-50">🔗 粘贴音频URL</button>
            <button onClick={()=>{onEdit(); setOpen(false)}} className="w-full text-left px-3 py-2 hover:bg-mint-50 border-t border-mint-50">✏️ 编辑信息</button>
            <button onClick={()=>{onDelete(); setOpen(false)}} className="w-full text-left px-3 py-2 hover:bg-rose-50 border-t border-mint-50 text-rose-500">🗑️ 删除</button>
          </div>
        </>
      )}
    </>
  )
}

export default Music
