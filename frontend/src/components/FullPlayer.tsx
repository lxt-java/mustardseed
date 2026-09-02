import React, { useEffect, useState } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { songToggleFavorite } from '@/api'

const grads = ['cover-grad', 'cover-grad-2', 'cover-grad-3', 'cover-grad-4']

interface Props {
  open: boolean
  onClose: () => void
}

const FullPlayer: React.FC<Props> = ({ open, onClose }) => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    next,
    prev,
    seek,
    currentTime,
    duration,
    formatTime,
    playMode,
    setPlayMode,
    playlist,
    currentIndex,
  } = usePlayer()

  const [fav, setFav] = useState<number>(currentSong?.favorite ?? 0)
  const [showLyrics, setShowLyrics] = useState(false)

  useEffect(() => {
    if (currentSong) setFav(currentSong.favorite ?? 0)
  }, [currentSong?.id, currentSong?.favorite])

  if (!open) return null

  const grad = currentSong ? grads[currentSong.id % grads.length] : 'cover-grad'
  const total = duration || currentSong?.duration || 0
  const progressPct = total > 0 ? (currentTime / total) * 100 : 0

  const toggleFav = async () => {
    if (!currentSong) return
    try {
      await songToggleFavorite(currentSong.id)
      setFav((f) => (f === 1 ? 0 : 1))
    } catch (e) {
      // ignore
    }
  }

  const modeIcon = () => {
    if (playMode === 'repeat')
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="13" r="2" fill="currentColor"/>
        </svg>
      )
    if (playMode === 'shuffle')
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }

  const switchMode = () => {
    setPlayMode(playMode === 'sequence' ? 'repeat' : playMode === 'repeat' ? 'shuffle' : 'sequence')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col text-white animate-fadeIn">
      {/* Background */}
      <div className={`absolute inset-0 ${grad} opacity-95`} />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-10 pb-4">
          <button className="w-10 h-10 rounded-full flex items-center justify-center active:bg-white/10" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-90 12 12)"/>
            </svg>
          </button>
          <div className="text-center flex-1 px-4">
            <div className="text-base font-semibold line-clamp-1">{currentSong?.title ?? '未在播放'}</div>
            <div className="text-xs text-white/70 mt-0.5 line-clamp-1">
              {currentSong?.artist || '未知歌手'}
            </div>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center active:bg-white/10" onClick={toggleFav}>
            <svg viewBox="0 0 24 24" fill={fav === 1 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className={`w-6 h-6 ${fav === 1 ? 'text-red-400' : ''}`}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Middle: Cover or Lyrics */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
          {!showLyrics ? (
            <div className={`w-64 h-64 sm:w-72 sm:h-72 rounded-3xl ${grad} shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}
                 style={{ animationDuration: '8s' }}>
              <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="w-full h-full max-h-[60vh] overflow-y-auto no-scrollbar text-center space-y-4 text-white/80 py-6">
              {(currentSong?.lyrics || '暂无歌词').split('\n').map((line, i) => (
                <p key={i} className="text-sm leading-6">{line || '　'}</p>
              ))}
            </div>
          )}
          <button
            className="mt-6 text-xs text-white/60 active:text-white"
            onClick={() => setShowLyrics((s) => !s)}
          >
            {showLyrics ? '返回封面' : '点击查看歌词'}
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 mb-2">
          <input
            type="range"
            className="player-range w-full"
            min={0}
            max={Math.max(1, total)}
            step={1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ background: `linear-gradient(to right, #fff ${progressPct}%, rgba(255,255,255,0.3) ${progressPct}%)` }}
          />
          <div className="flex justify-between text-[11px] text-white/70 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(total)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 pb-10 pt-2">
          <button className="w-11 h-11 rounded-full flex items-center justify-center active:bg-white/10" onClick={switchMode} title={playMode}>
            {modeIcon()}
          </button>
          <button className="w-12 h-12 rounded-full flex items-center justify-center active:bg-white/10" onClick={prev}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            className="w-16 h-16 rounded-full bg-white text-primary-700 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button className="w-12 h-12 rounded-full flex items-center justify-center active:bg-white/10" onClick={next}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          <div className="w-11 h-11 flex flex-col items-center justify-center text-[10px] text-white/80">
            <span>{playlist.length > 0 ? `${currentIndex + 1}/${playlist.length}` : ''}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  )
}

export default FullPlayer
