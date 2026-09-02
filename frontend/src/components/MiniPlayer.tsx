import React from 'react'
import { usePlayer } from '@/context/PlayerContext'

const grads = ['cover-grad', 'cover-grad-2', 'cover-grad-3', 'cover-grad-4']

const MiniPlayer: React.FC = () => {
  const { currentSong, isPlaying, togglePlay, next, formatTime, currentTime, duration, seek } = usePlayer()
  if (!currentSong) return null

  const grad = grads[currentSong.id % grads.length]
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="mx-3 mb-2 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.995] transition-transform">
      {/* Progress bar on top */}
      <div className="h-0.5 w-full bg-gray-100 relative">
        <div
          className="h-full bg-primary-600 rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center p-2.5 gap-3" onClick={(e) => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${grad} flex items-center justify-center text-white shadow-sm`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800 line-clamp-1">{currentSong.title}</div>
          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
            {currentSong.artist || '未知歌手'} · {currentSong.categoryName || ''}
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-[10px] mr-1">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration || currentSong.duration || 0)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100"
            onClick={next}
            aria-label="下一首"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          <button
            className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md active:bg-primary-700"
            onClick={togglePlay}
            aria-label={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MiniPlayer
