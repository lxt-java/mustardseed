import React, { useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '@/utils/storage'
import { trackEvent } from '@/utils/analytics'

type Mode = 'focus' | 'short' | 'long'

interface Settings {
  focusMin: number
  shortMin: number
  longMin: number
  autoNext: boolean
  soundOn: boolean
  dailyGoal: number
}

const STORAGE_KEY = 'mint.pomodoro.v1'
const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  autoNext: false,
  soundOn: true,
  dailyGoal: 8,
}

const MODES: { key: Mode; label: string; tip: string }[] = [
  { key: 'focus', label: '专注', tip: '全情投入' },
  { key: 'short', label: '短休息', tip: '站起来动一下' },
  { key: 'long',  label: '长休息', tip: '喝杯茶 ☕' },
]

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0')

function beep(soundOn: boolean) {
  if (!soundOn) return
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const now = ctx.currentTime
    const tones = [523.25, 659.25, 783.99] // C5 E5 G5
    tones.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      osc.connect(gain); gain.connect(ctx.destination)
      const t0 = now + i * 0.22
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22)
      osc.start(t0); osc.stop(t0 + 0.25)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch (e) { /* ignore */ }
}

const Pomodoro: React.FC = () => {
  const saved = storage.get<{ settings: Settings; completedDates: Record<string, number>; totalFocus: number } | null>(STORAGE_KEY, null)
  const [settings, setSettings] = useState<Settings>(saved?.settings ?? DEFAULT_SETTINGS)
  const [completedDates, setCompletedDates] = useState<Record<string, number>>(saved?.completedDates ?? {})
  const [totalFocus, setTotalFocus] = useState<number>(saved?.totalFocus ?? 0)

  const [mode, setMode] = useState<Mode>('focus')
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(() => (saved?.settings?.focusMin ?? DEFAULT_SETTINGS.focusMin) * 60)
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef<number | null>(null)

  // persist settings + stats
  useEffect(() => {
    storage.set(STORAGE_KEY, { settings, completedDates, totalFocus })
  }, [settings, completedDates, totalFocus])

  // reset time when mode or settings duration changes (only when not running)
  useEffect(() => {
    if (running) return
    const m = mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin
    setSeconds(m * 60)
  }, [mode, settings.focusMin, settings.shortMin, settings.longMin])

  // tick
  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1))
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  // 完成检测：秒数归零时结算（用 ref 防止 strict mode 下 effect 双调用导致重复累加）
  const finishingRef = useRef(false)
  useEffect(() => {
    if (seconds === 0 && running && !finishingRef.current) {
      finishingRef.current = true
      finishOne()
      setTimeout(() => { finishingRef.current = false }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, running])

  function finishOne() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    beep(settings.soundOn)

    if (mode === 'focus') {
      const today = new Date().toISOString().slice(0, 10)
      setCompletedDates((m) => ({ ...m, [today]: (m[today] ?? 0) + 1 }))
      setTotalFocus((t) => t + 1)
    }

    if (settings.autoNext) {
      // 每 4 次专注后进入长休息，否则短休息；从休息自动回到专注
      const today = new Date().toISOString().slice(0, 10)
      const doneToday = (completedDates[today] ?? 0) + (mode === 'focus' ? 1 : 0)
      let nextMode: Mode
      if (mode === 'focus') nextMode = doneToday % 4 === 0 ? 'long' : 'short'
      else nextMode = 'focus'
      setMode(nextMode)
      const dur = nextMode === 'focus' ? settings.focusMin : nextMode === 'short' ? settings.shortMin : settings.longMin
      setSeconds(dur * 60)
      setRunning(true)
    } else {
      setRunning(false)
    }
  }

  const totalPerMode = (mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin) * 60
  const progress = totalPerMode === 0 ? 0 : 1 - seconds / totalPerMode

  const timeText = `${pad(seconds / 60)}:${pad(seconds % 60)}`
  const titleHint = running ? `${timeText} · ${MODES.find(m=>m.key===mode)?.label}中` : '番茄钟'
  useEffect(() => { document.title = `${titleHint} · 芥菜种子` }, [titleHint])

  // Circular progress
  const size = 280
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = useMemo(() => c * (1 - progress), [c, progress])

  const colorClass =
    mode === 'focus' ? 'stroke-rose-400' :
    mode === 'short' ? 'stroke-mint-500' : 'stroke-indigo-400'
  const bgBtnClass =
    mode === 'focus' ? 'bg-rose-500 hover:bg-rose-600' :
    mode === 'short' ? 'bg-mint-600 hover:bg-mint-700' : 'bg-indigo-500 hover:bg-indigo-600'

  const todayKey = new Date().toISOString().slice(0,10)
  const todayDone = completedDates[todayKey] ?? 0
  const goalPct = Math.min(100, Math.round((todayDone / Math.max(1,settings.dailyGoal)) * 100))

  function toggleRun() {
    // Unlock AudioContext via user gesture
    if (!running && settings.soundOn) {
      try {
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext
        if (AC) { const x = new AC(); x.resume?.(); x.close?.() }
      } catch (e) {/* ignore */}
    }
    setRunning((r) => {
      trackEvent('番茄钟', r ? '暂停' : '开始', mode)
      return !r
    })
  }
  function resetTimer() {
    setRunning(false)
    const m = mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin
    setSeconds(m * 60)
  }
  function skipNext() {
    setSeconds(0)
    finishOne()
  }

  return (
    <div className="animate-fade-up">
      {/* Mode tabs */}
      <div className="flex p-1 rounded-2xl bg-white/80 border border-mint-100 shadow-card">
        {MODES.map((m) => {
          const active = mode === m.key
          return (
            <button
              key={m.key}
              onClick={() => { if (!running) setMode(m.key) }}
              disabled={running}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-mint-600 text-white shadow-sm' : 'text-mint-800/70 hover:text-mint-800'} ${running ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div>{m.label}</div>
              <div className={`text-[10px] mt-0.5 font-normal ${active ? 'text-white/90' : 'text-mint-700/50'}`}>
                {m.key === 'focus' ? `${settings.focusMin} 分钟` : m.key === 'short' ? `${settings.shortMin} 分钟` : `${settings.longMin} 分钟`}
              </div>
            </button>
          )
        })}
      </div>

      {/* Circular Timer */}
      <div className="mt-8 flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="pomodoro-ring -rotate-90">
            <circle cx={size/2} cy={size/2} r={r} stroke="#d9f5e8" strokeWidth={stroke} fill="none" />
            <circle
              cx={size/2} cy={size/2} r={r}
              className={`${colorClass}`}
              strokeWidth={stroke} strokeLinecap="round" fill="none"
              strokeDasharray={c}
              strokeDashoffset={dash}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xs text-mint-600 font-medium tracking-widest">
              {MODES.find(m=>m.key===mode)?.tip}
            </div>
            <div className="mt-2 text-6xl font-bold text-mint-900 tabular-nums tracking-tight">{timeText}</div>
            <div className="mt-3 text-xs text-mint-700/70">
              第 {todayDone + (running && mode==='focus' ? 1 : 0)} 个 · 目标 {settings.dailyGoal} 个番茄
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={resetTimer}
          className="btn-press w-14 h-14 rounded-full bg-white border border-mint-100 shadow-card text-mint-700 hover:bg-mint-50 flex items-center justify-center"
          aria-label="重置"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
        <button
          onClick={toggleRun}
          className={`btn-press w-20 h-20 rounded-full text-white shadow-soft ${bgBtnClass} flex items-center justify-center`}
          aria-label={running ? '暂停' : '开始'}
        >
          {running ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 ml-1"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <button
          onClick={skipNext}
          className="btn-press w-14 h-14 rounded-full bg-white border border-mint-100 shadow-card text-mint-700 hover:bg-mint-50 flex items-center justify-center"
          aria-label="跳过"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      {/* Stats + Settings */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-white/80 border border-mint-100 shadow-card">
          <div className="text-xs text-mint-700/70">今日番茄</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-mint-900">{todayDone}</span>
            <span className="text-sm text-mint-700/60">/ {settings.dailyGoal}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-mint-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-mint-500 to-mint-400" style={{width: `${goalPct}%`}} />
          </div>
        </div>
        <div className="rounded-2xl p-4 bg-white/80 border border-mint-100 shadow-card">
          <div className="text-xs text-mint-700/70">累计专注</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-mint-900">{totalFocus}</span>
            <span className="text-sm text-mint-700/60">个番茄</span>
          </div>
          <div className="mt-2 text-xs text-mint-700/60">
            ≈ {totalFocus * settings.focusMin} 分钟的认真时刻 🌟
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowSettings((s) => !s)}
        className="mt-4 w-full btn-press rounded-xl py-3 text-sm text-mint-700 bg-mint-50/70 border border-mint-100 flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
        </svg>
        设置
      </button>

      {showSettings && (
        <div className="mt-4 p-4 rounded-2xl bg-white/90 border border-mint-100 shadow-card animate-fade-up">
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="专注（分钟）" value={settings.focusMin} min={1} max={90}
              onChange={(v) => setSettings({...settings, focusMin: v})}/>
            <NumberField label="短休息" value={settings.shortMin} min={1} max={60}
              onChange={(v) => setSettings({...settings, shortMin: v})}/>
            <NumberField label="长休息" value={settings.longMin} min={1} max={60}
              onChange={(v) => setSettings({...settings, longMin: v})}/>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField label="每日目标（个）" value={settings.dailyGoal} min={1} max={30}
              onChange={(v) => setSettings({...settings, dailyGoal: v})}/>
            <div className="flex items-center justify-between rounded-xl bg-mint-50/60 px-3 py-2 border border-mint-100">
              <span className="text-xs text-mint-800">提示音</span>
              <Toggle checked={settings.soundOn} onChange={(v) => setSettings({...settings, soundOn: v})}/>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-mint-50/60 px-3 py-2 border border-mint-100">
            <span className="text-sm text-mint-800">自动进入下一阶段</span>
            <Toggle checked={settings.autoNext} onChange={(v) => setSettings({...settings, autoNext: v})}/>
          </div>
          <p className="mt-2 text-[11px] text-mint-700/60">
            * 每完成 4 个专注番茄后会自动进入长休息，其他时候进入短休息。
          </p>
        </div>
      )}
    </div>
  )
}

const NumberField: React.FC<{label:string, value:number, min:number, max:number, onChange:(n:number)=>void}> = ({label, value, min, max, onChange}) => (
  <label className="rounded-xl bg-mint-50/60 px-3 py-2 border border-mint-100 block">
    <div className="text-[11px] text-mint-700/80">{label}</div>
    <input type="number" min={min} max={max} value={value}
      onChange={(e) => {
        const n = parseInt(e.target.value || String(min), 10)
        if (isFinite(n)) onChange(Math.max(min, Math.min(max, n)))
      }}
      className="mt-0.5 w-full bg-transparent text-lg font-semibold text-mint-900 focus:outline-none"/>
  </label>
)

const Toggle: React.FC<{checked:boolean, onChange:(v:boolean)=>void}> = ({checked, onChange}) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-mint-500' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}/>
  </button>
)

export default Pomodoro
