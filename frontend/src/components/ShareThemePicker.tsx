import React from 'react'
import { SHARE_THEMES } from '@/utils/shareThemes'

/** 分享图背景选择器：横向滑动缩略图 */
const ShareThemePicker: React.FC<{ value: string; onChange: (id: string) => void }> = ({ value, onChange }) => {
  return (
    <div className="mt-3">
      <div className="text-[11px] text-mint-700/70 mb-1.5 px-0.5">🎨 选择背景</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {SHARE_THEMES.map((t) => {
          const active = t.id === value
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`btn-press shrink-0 w-14 rounded-lg overflow-hidden border-2 transition-all ${
                active ? 'border-mint-600 shadow-soft' : 'border-mint-100'
              }`}
            >
              {t.bg ? (
                <img src={t.bg} alt={t.name} loading="lazy" className="w-full h-12 object-cover" />
              ) : (
                <div
                  className="w-full h-12"
                  style={{ background: 'linear-gradient(135deg,#effbf6 0%,#ffffff 55%,#d9f5e8 100%)' }}
                />
              )}
              <div
                className={`text-[10px] text-center py-0.5 leading-4 ${
                  active ? 'bg-mint-600 text-white' : 'bg-white text-mint-700'
                }`}
              >
                {t.name}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ShareThemePicker
