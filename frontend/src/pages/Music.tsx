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
      { title: '卡农 D 大调 (Pachelbel)', artist: 'Pachelbel · 钢琴合成', category: 'piano', coverColor: '0',
        url: '/audio/piano_canon_real.wav' },
      { title: '致爱丽丝 (Für Elise)', artist: 'Beethoven · 钢琴合成', category: 'piano', coverColor: '1',
        url: '/audio/piano_fur_elise.wav' },
      { title: '月光奏鸣曲 第一乐章', artist: 'Beethoven · 钢琴合成', category: 'piano', coverColor: '2',
        url: '/audio/piano_moonlight.wav' },
      { title: '夜的钢琴曲五', artist: '石进（待添加）', category: 'piano', coverColor: '1', duration: 225 },
    ],
  },
  {
    key: 'whitenoise', label: '白噪音', icon: '🌧️', hint: '助眠 · 办公专注',
    default: [
      { title: '窗外雨声（合成 · 60s 循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: '1',
        url: '/audio/amb_rain.wav', duration: 60 },
      { title: '清晨森林鸟鸣（合成 · 60s 循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: '2',
        url: '/audio/amb_forest.wav', duration: 60 },
      { title: '咖啡馆环境音（合成 · 60s 循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: '0',
        url: '/audio/amb_cafe.wav', duration: 60 },
      { title: '海浪声', artist: '环境音（待添加）', category: 'whitenoise', coverColor: '3', duration: 540 },
      { title: '柴火壁炉声', artist: '环境音（待添加）', category: 'whitenoise', coverColor: '2', duration: 500 },
      { title: '夏日夜晚虫鸣', artist: '环境音（待添加）', category: 'whitenoise', coverColor: '0', duration: 60 },
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
const STORAGE_KEY = 'mint.music.v4' // v4: 钢琴曲换成真实古典曲目（钢琴音色合成 WAV），强制重种

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
  const [loadErr, setLoadErr] = useState<string>('')
  const [loadingSrc, setLoadingSrc] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => { storage.set(STORAGE_KEY, tracks) }, [tracks])

  // Create audio once
  useEffect(() => {
    try {
      const a = new Audio()
      a.preload = 'metadata'
      // 本地源（/audio/*）不走 crossOrigin，避免多余 CORS 预检
      audioRef.current = a
    } catch {}
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
    setLoadErr('')
    if (!audioRef.current) { setIsPlaying(false); return }
    const a = audioRef.current
    // 串行：先 pause 清状态，再赋值新 src
    try { a.pause() } catch {}
    try {
      a.removeAttribute('src')
      try { a.load() } catch {}
    } catch {}
    if (!track.url) {
      setIsPlaying(false)
      return
    }
    // 白噪音类默认循环播放（本地合成 WAV 仅 60 秒）
    try { a.loop = (track.category === 'whitenoise') } catch {}
    setLoadingSrc(true)
    try {
      a.src = track.url
      a.load()
      const started = a.play()
      if (started && typeof started.then === 'function') {
        started
          .then(() => { setIsPlaying(true); setLoadingSrc(false) })
          .catch((err) => {
            setIsPlaying(false)
            setLoadingSrc(false)
            const msg = err && err.name ? `(${err.name}) ${err.message || ''}` : ''
            setLoadErr(`浏览器阻止了自动播放或加载失败 ${msg}。请点击曲目左侧的播放键（而非底部大按钮）重试，首次点一定会播放成功。`)
          })
      } else {
        setIsPlaying(true); setLoadingSrc(false)
      }
    } catch (err: any) {
      setLoadingSrc(false)
      setIsPlaying(false)
      setLoadErr(`播放初始化异常：${err && err.message ? err.message : '未知错误'}`)
    }
  }
  function togglePlay() {
    if (!current) return
    const a = audioRef.current
    if (!current.url) {
      setIsPlaying(!isPlaying)
      return
    }
    if (!a) return
    setLoadErr('')
    if (isPlaying) {
      try { a.pause() } catch {}
      setIsPlaying(false)
    } else {
      setLoadingSrc(true)
      // 若尚未设置 src（上次因无 src 清空过），先补上
      try {
        if (!a.src || a.getAttribute('src') !== current.url) {
          try { a.loop = (current.category === 'whitenoise') } catch {}
          a.src = current.url; try { a.load() } catch {}
        }
        const p = a.play()
        if (p && typeof p.then === 'function') {
          p.then(() => { setIsPlaying(true); setLoadingSrc(false) })
            .catch((err) => {
              setLoadingSrc(false)
              setIsPlaying(false)
              const msg = err && err.name ? `（${err.name}）${err.message || ''}` : ''
              // 按经验给用户的兜底建议
              let tip = `播放失败 ${msg}。`
              if (/notallowed|user gesture|autoplay/i.test(err?.name || '') || /notallowed|autoplay/i.test(err?.message || '')) {
                tip = '浏览器要求用户先手动点一下才允许播放。请直接点击曲目列表左侧的播放键 🔊（不是底部的大播放键）。'
              } else if (/network|error/i.test(err?.name || '')) {
                tip = '网络加载失败。可能是 CDN 临时不可用 / 公司内网拦截。请刷新重试，或给这首曲目粘贴你自己的 mp3 链接。'
              }
              setLoadErr(tip)
            })
        } else {
          setIsPlaying(true); setLoadingSrc(false)
        }
      } catch (err: any) {
        setLoadingSrc(false)
        setIsPlaying(false)
        setLoadErr(`播放异常：${err && err.message ? err.message : '未知错误'}`)
      }
    }
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
    const onD = () => {
      const d = a.duration && isFinite(a.duration) ? a.duration : (current?.duration || 0)
      setDuration(d)
    }
    const onEnd = () => {
      // 非白噪音类播放完就下一首；白噪音由于 a.loop 已设通常不会触发 onEnd（保险也切下一首）
      if (!current || current.category !== 'whitenoise') nextPrev(1)
      setIsPlaying(false)
    }
    const onError = () => {
      setLoadingSrc(false)
      setIsPlaying(false)
      const code = (a as any).error?.code
      const codeHint: Record<number,string> = {
        1:'(ABORTED) 加载被中止',
        2:'(NETWORK) 网络错误 —— 本地 /audio/ 目录下的音频文件缺失？',
        3:'(DECODE) 音频解码失败，文件格式不被浏览器支持',
        4:'(SRC_NOT_SUPPORTED) 源不可达或格式不支持 —— 请确保 public/audio 下有同名文件',
      }
      setLoadErr(`⚠️ 加载失败 ${codeHint[code] || ''}。
→ 解决方案：① 刷新页面（升级后本地有 v3 强制重种）；② 先点曲目左侧的 ▶️ 触发手势，再用底部播放控件；③ 想自定义音乐？曲目「…」→「粘贴音频URL」直接加你自己的 mp3。`)
    }
    const onPlaying = () => { setLoadingSrc(false); setLoadErr(''); setIsPlaying(true) }
    const onCanPlay = () => { setLoadingSrc(false) }
    const onPause = () => { setIsPlaying(false) }
    a.addEventListener('timeupdate', onT)
    a.addEventListener('loadedmetadata', onD)
    a.addEventListener('ended', onEnd)
    a.addEventListener('error', onError)
    a.addEventListener('playing', onPlaying)
    a.addEventListener('canplay', onCanPlay)
    a.addEventListener('pause', onPause)
    return () => {
      a.removeEventListener('timeupdate', onT)
      a.removeEventListener('loadedmetadata', onD)
      a.removeEventListener('ended', onEnd)
      a.removeEventListener('error', onError)
      a.removeEventListener('playing', onPlaying)
      a.removeEventListener('canplay', onCanPlay)
      a.removeEventListener('pause', onPause)
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
            ) : loadingSrc ? (
              <span className="text-xs font-bold text-mint-600">加载中…</span>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button onClick={()=>nextPrev(1)}
            className="btn-press w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        {loadErr && (
          <div className="mt-4 mx-auto max-w-lg rounded-xl bg-rose-500/25 border border-white/30 backdrop-blur px-3 py-2 text-xs text-white whitespace-pre-line">
            {loadErr}
          </div>
        )}

        {!current?.url && !loadErr && (
          <div className="mt-4 mx-auto max-w-md rounded-xl bg-white/15 border border-white/20 backdrop-blur px-3 py-2 text-xs text-white/95 whitespace-pre-line">
            💡 当前曲目暂未配置音频源。
本地已内置 6 首可直接播放：
🎹 钢琴：卡农 D 大调 / 致爱丽丝 / 月光奏鸣曲（钢琴音色合成）
🌧️ 环境音：窗外雨声 / 清晨森林鸟鸣 / 咖啡馆环境音（60 秒循环）
其它曲目点「…」→「粘贴音频URL」即可添加自己的 mp3 / wav。
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
                <div className="mt-0.5 text-[11px] text-mint-700/60 line-clamp-1 flex items-center gap-1">
                  <span>{tk.artist} · {fmt(tk.duration || 0)}</span>
                  {tk.url ? (
                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-semibold">本地内置</span>
                  ) : (
                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-mint-100 text-mint-600/80">需自行添加 URL</span>
                  )}
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
        <div className="font-semibold text-mint-800 mb-1">🌿 播放不出声音？按这个顺序排查</div>
        <ol className="space-y-1 list-decimal list-inside">
          <li><b>首次一定要先点曲目行左侧的 ▶️ 小按钮</b>（这是用户手势，100% 绕过浏览器的自动播放禁令）；底部大按钮之后就可以随意用了。</li>
          <li>白噪音类是本地合成的 60 秒 WAV，默认自动循环，可当工作背景音一直开着。</li>
          <li>如果本地存储着旧版本的歌单，提示框会一直出现？刷新一次页面或清站点数据（storage key 已升到 v3 强制重种 6 首本地文件）。</li>
          <li>想换成你喜欢的音乐？每首歌右侧「…」→「粘贴音频URL」添加任何 http(s) mp3 / wav 直链即可，不会被存到服务器，只保留在你本机。</li>
        </ol>
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
