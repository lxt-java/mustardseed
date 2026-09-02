import React, { useEffect, useMemo, useRef, useState } from 'react'
import { storage } from '@/utils/storage'

// 内置模板：选菜 / 周末去哪玩 / 二选一快问快答 / 抛硬币 / 掷骰子
type Preset = {
  id: string
  name: string
  icon: string
  hint?: string
  options: string[]
}

const PRESETS: Preset[] = [
  {
    id: 'food',
    name: '今天吃什么',
    icon: '🍜',
    hint: '选择困难症的救星',
    options: [
      '兰州拉面', '沙县小吃', '麻辣烫', '黄焖鸡米饭', '麦当劳', '肯德基',
      '重庆小面', '火锅', '烤肉', '寿司', '日料定食', '韩式拌饭',
      '螺蛳粉', '盖浇饭', '粥+包子', '饺子', '炒饭', '披萨',
      '沙拉轻食', '汉堡王', '便利店饭团', '海底捞', '川菜', '湘菜',
      '粤菜', '牛肉面', '肉夹馍', '外卖随便一家', '自己做饭🍳',
    ],
  },
  {
    id: 'drink',
    name: '喝点什么',
    icon: '🧋',
    options: [
      '美式咖啡', '拿铁', '摩卡', '卡布奇诺',
      '奶茶（三分糖）', '杨枝甘露', '柠檬水',
      '纯茶（乌龙/绿茶）', '可乐', '雪碧',
      '矿泉水', '椰子水', '果汁', '气泡水',
      '珍珠奶茶', '生椰拿铁', '热巧克力',
    ],
  },
  {
    id: 'weekend',
    name: '周末去哪',
    icon: '🎡',
    options: [
      '宅家追剧', '睡到自然醒', '去公园散步', '看电影',
      '逛超市', '逛书店', '咖啡馆办公', '爬山',
      '约朋友吃饭', '博物馆/美术馆', '健身房',
      '图书馆自习', '近郊旅行', '在家做大餐',
      '逛街买买买', '宅家打游戏', '看展览',
    ],
  },
  {
    id: 'yesno',
    name: '做不做？',
    icon: '🤔',
    hint: '二选一：是 / 否',
    options: ['✅ 去做！', '❌ 再等等'],
  },
  {
    id: 'coin',
    name: '抛硬币',
    icon: '🪙',
    options: ['正面 ✨', '反面 🌙'],
  },
  {
    id: 'dice',
    name: '掷骰子',
    icon: '🎲',
    options: ['1 点', '2 点', '3 点', '4 点', '5 点', '6 点'],
  },
]

const RECENT_KEY = 'mint.picker.recent.v1'

const Picker: React.FC = () => {
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id)
  const [custom, setCustom] = useState<string[]>([])
  const [isCustom, setIsCustom] = useState(false)
  const [input, setInput] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>(() => storage.get<string[]>(RECENT_KEY, []))
  const intervalRef = useRef<number | null>(null)

  useEffect(() => { storage.set(RECENT_KEY, history.slice(0, 30)) }, [history])

  const preset = useMemo(() => PRESETS.find(p => p.id === presetId) ?? PRESETS[0], [presetId])

  const opts: string[] = isCustom
    ? custom
    : preset.options

  const pickOnce = () => opts[Math.floor(Math.random() * opts.length)]

  function startSpin() {
    if (opts.length < 2) {
      alert('至少需要两个选项才可以开始抽哦～')
      return
    }
    setResult(null)
    setSpinning(true)
    const total = 1600
    const start = Date.now()
    let delay = 50
    const tick = () => {
      const elapsed = Date.now() - start
      setResult(pickOnce())
      if (elapsed >= total) {
        // final result
        const finalResult = pickOnce()
        setResult(finalResult)
        setSpinning(false)
        setHistory((h) => [
          `${isCustom ? '🎯 自定义' : preset.icon + ' ' + preset.name}：${finalResult}`,
          ...h,
        ].slice(0, 30))
        return
      }
      // slow down gradually
      delay = 50 + (elapsed / total) * 180
      intervalRef.current = window.setTimeout(tick, delay)
    }
    tick()
  }

  function stopSpin() {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
      intervalRef.current = null
    }
    setSpinning(false)
  }

  function addCustomOption() {
    const v = input.trim()
    if (!v) return
    if (custom.includes(v)) { setInput(''); return }
    setCustom([...custom, v])
    setInput('')
    setIsCustom(true)
  }
  function removeCustom(i: number) {
    setCustom(custom.filter((_, idx) => idx !== i))
  }
  function usePreset(id: string) {
    setPresetId(id)
    setIsCustom(false)
    setResult(null)
    stopSpin()
  }
  function goCustom() {
    setIsCustom(true)
    setResult(null)
    stopSpin()
  }
  function loadQuickPreset(n: number) {
    // 2选1、3选1快速填充
    const placeholders = ['选项 A', '选项 B', '选项 C', '选项 D', '选项 E', '选项 F'].slice(0, n)
    setCustom(placeholders)
    setIsCustom(true)
    setResult(null)
  }

  return (
    <div className="animate-fade-up">
      {/* Preset grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {PRESETS.map(p => {
          const active = !isCustom && p.id === presetId
          return (
            <button
              key={p.id}
              onClick={() => usePreset(p.id)}
              className={`card-hover rounded-2xl p-3 text-left border bg-white/90 shadow-card ${active ? 'border-mint-500 ring-2 ring-mint-300/50' : 'border-mint-100'}`}
            >
              <div className="text-2xl leading-none">{p.icon}</div>
              <div className={`mt-2 text-sm font-semibold ${active ? 'text-mint-700' : 'text-mint-900'}`}>{p.name}</div>
              <div className="mt-0.5 text-[11px] text-mint-700/60 line-clamp-1">
                {p.hint ?? `${p.options.length} 个选项`}
              </div>
            </button>
          )
        })}
      </div>

      {/* Custom mode switch */}
      <div className="mt-4 rounded-2xl bg-white/90 border border-mint-100 shadow-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-mint-900">🎯 自定义选项</div>
            <div className="text-xs text-mint-700/60 mt-0.5">自己输入，想抽啥抽啥</div>
          </div>
          <div className="flex items-center gap-2">
            {[2,3,4,6].map(n => (
              <button
                key={n}
                onClick={() => loadQuickPreset(n)}
                className="text-[11px] px-2 py-1 rounded-lg bg-mint-50 text-mint-700 border border-mint-100 hover:bg-mint-100"
              >
                {n} 选 1
              </button>
            ))}
            <button
              onClick={goCustom}
              className={`btn-press text-[12px] px-3 py-1.5 rounded-lg border ${isCustom ? 'bg-mint-600 text-white border-mint-600' : 'bg-white text-mint-700 border-mint-200 hover:bg-mint-50'}`}
            >
              {isCustom ? '编辑中' : '去编辑'}
            </button>
          </div>
        </div>

        {isCustom && (
          <div className="mt-3 animate-fade-up">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomOption()}
                placeholder="输入一个选项，回车添加"
                className="flex-1 bg-mint-50/50 rounded-xl px-3 py-2 text-sm placeholder:text-mint-700/40 focus:outline-none focus:ring-2 focus:ring-mint-300"
              />
              <button onClick={addCustomOption}
                className="btn-press px-3.5 py-2 rounded-xl bg-mint-600 text-white text-sm font-semibold">
                添加
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {custom.length === 0 && (
                <div className="text-xs text-mint-700/50 py-2">还没有选项，先在上方添加吧～</div>
              )}
              {custom.map((c, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-mint-50 border border-mint-100 text-mint-800 text-sm">
                  {c}
                  <button onClick={() => removeCustom(i)}
                    className="w-5 h-5 rounded-full bg-white text-mint-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Draw area */}
      <div className="mt-5">
        <div className={`relative rounded-3xl p-8 border bg-gradient-to-br from-mint-50 to-white shadow-card overflow-hidden ${spinning ? 'border-mint-300' : 'border-mint-100'}`}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-mint-200/40 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="relative text-center min-h-[160px] flex items-center justify-center">
            {!result && !spinning && (
              <div className="text-mint-700/60 text-sm">
                <div className="text-5xl mb-3">🎯</div>
                当前共 <b className="text-mint-700">{opts.length}</b> 个选项 · 点下面按钮开始
              </div>
            )}
            {result && (
              <div key={result + (spinning ? 's' : 'e')} className={spinning ? 'animate-shake' : 'animate-pop'}>
                <div className={`text-[11px] tracking-widest uppercase ${spinning ? 'text-mint-500' : 'text-mint-600'}`}>
                  {spinning ? '抽取中…' : '✨ 就是你啦'}
                </div>
                <div className="mt-3 text-4xl sm:text-5xl font-bold text-mint-800 break-words max-w-md mx-auto leading-tight">
                  {result}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          {!spinning ? (
            <button onClick={startSpin}
              className="btn-press px-8 py-3.5 rounded-2xl bg-gradient-to-br from-mint-500 to-mint-700 text-white font-semibold text-lg shadow-soft hover:brightness-105">
              🎲 开始抽
            </button>
          ) : (
            <button onClick={stopSpin}
              className="btn-press px-8 py-3.5 rounded-2xl bg-white border border-mint-200 text-mint-700 font-semibold text-lg shadow-card">
              立即停
            </button>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-mint-800">📜 最近抽取记录</div>
            <button onClick={() => { if (confirm('清空最近记录？')) setHistory([]) }}
              className="text-[11px] text-mint-500 hover:text-rose-500">清空</button>
          </div>
          <div className="rounded-2xl bg-white/80 border border-mint-100 shadow-card divide-y divide-mint-50 overflow-hidden">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className="px-4 py-2.5 text-sm text-mint-800 flex items-center gap-2">
                <span className="text-mint-400 text-xs w-6">{history.length - i}</span>
                <span className="line-clamp-1">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Picker
