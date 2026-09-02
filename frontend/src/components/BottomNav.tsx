import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const tabs = [
  {
    to: '/',
    label: '目录',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-gray-400'}`}>
        <path d="M3 5h18M3 12h18M3 19h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to: '/playlist',
    label: '歌单',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-gray-400'}`}>
        <path d="M14 10H3M14 6H3M10 14H3M10 18H3M17 8v8l5-4-5-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    to: '/profile',
    label: '我的',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className={`w-6 h-6 ${active ? 'text-primary-600' : 'text-gray-400'}`}>
        <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const BottomNav: React.FC = () => {
  const loc = useLocation()
  return (
    <nav className="fixed z-40 left-0 right-0 bottom-0 mx-auto max-w-[720px] bg-white border-t border-gray-100 pb-safe">
      <div className="grid grid-cols-3">
        {tabs.map((t) => {
          const active = t.to === '/' ? loc.pathname === '/' || loc.pathname === '' : loc.pathname.startsWith(t.to)
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className="flex flex-col items-center justify-center py-2.5"
            >
              {t.icon(active)}
              <span className={`mt-0.5 text-[11px] ${active ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
                {t.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
