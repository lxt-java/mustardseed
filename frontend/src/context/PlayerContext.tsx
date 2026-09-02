import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react'
import type { Song } from '@/types'
import { songMarkPlayed } from '@/api'

type PlayMode = 'sequence' | 'repeat' | 'shuffle'

interface PlayerContextValue {
  currentSong: Song | null
  playlist: Song[]
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  playMode: PlayMode
  playList: (list: Song[], index?: number) => void
  playSong: (song: Song) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (t: number) => void
  setPlayMode: (m: PlayMode) => void
  addSong: (song: Song) => void
  removeSong: (id: number) => void
  formatTime: (s: number) => string
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}

export const formatTimeSec = (s: number): string => {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [playMode, setPlayMode] = useState<PlayMode>('sequence')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastPlayedIdRef = useRef<number | null>(null)

  // Lazy create audio element
  if (typeof window !== 'undefined' && !audioRef.current) {
    try {
      const audio = new Audio()
      audio.preload = 'metadata'
      audioRef.current = audio
    } catch (e) {
      // ignore
    }
  }

  const currentSong = playlist[currentIndex] ?? null

  const pickNextIndex = useCallback(
    (dir: 1 | -1): number => {
      if (!playlist.length) return 0
      if (playMode === 'shuffle') {
        if (playlist.length === 1) return 0
        let idx = Math.floor(Math.random() * playlist.length)
        if (idx === currentIndex) idx = (idx + 1) % playlist.length
        return idx
      }
      if (playMode === 'repeat') {
        return currentIndex
      }
      return (currentIndex + dir + playlist.length) % playlist.length
    },
    [playlist, currentIndex, playMode],
  )

  const loadSong = useCallback(
    (song: Song | null) => {
      const audio = audioRef.current
      if (!audio || !song) return
      // If no file URL, try to use a demo audio; otherwise do not crash
      if (!song.fileUrl) {
        audio.src = ''
        // Set a fake duration from metadata for UI
        setDuration(song.duration || 180)
        setCurrentTime(0)
        return
      }
      try {
        audio.src = song.fileUrl
        audio.load()
      } catch (e) {
        // ignore
      }
    },
    [],
  )

  // When current song changes, load it
  useEffect(() => {
    if (currentSong) {
      loadSong(currentSong)
    }
  }, [currentSong, loadSong])

  // Play/pause sync
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying && audio.src) {
      const p = audio.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // autoplay may be blocked; just stay in paused state on UI
          setIsPlaying(false)
        })
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong])

  // Mark song as played when starting a new one
  useEffect(() => {
    if (currentSong && lastPlayedIdRef.current !== currentSong.id) {
      lastPlayedIdRef.current = currentSong.id
      try {
        songMarkPlayed(currentSong.id).catch(() => {})
      } catch (e) {
        // ignore
      }
    }
  }, [currentSong])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime || 0)
    const onMeta = () => setDuration(audio.duration && isFinite(audio.duration) ? audio.duration : (currentSong?.duration || 0))
    const onEnded = () => {
      // Advance
      setCurrentIndex((old) => {
        if (playMode === 'repeat') return old
        if (playlist.length <= 1) {
          setIsPlaying(false)
          return 0
        }
        if (playMode === 'shuffle') {
          let idx = Math.floor(Math.random() * playlist.length)
          if (idx === old) idx = (idx + 1) % playlist.length
          return idx
        }
        const nextIdx = old + 1
        if (nextIdx >= playlist.length) {
          // Loop back if sequence end and user wants to continue? pause by default
          setIsPlaying(false)
          return 0
        }
        return nextIdx
      })
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('ended', onEnded)
    }
  }, [playlist, playMode, currentSong])

  const playList = useCallback((list: Song[], index = 0) => {
    setPlaylist(list)
    setCurrentIndex(Math.min(Math.max(0, index), list.length - 1))
    setCurrentTime(0)
    setIsPlaying(list.length > 0)
  }, [])

  const playSong = useCallback(
    (song: Song) => {
      setPlaylist((prev) => {
        const idx = prev.findIndex((s) => s.id === song.id)
        if (idx >= 0) {
          setCurrentIndex(idx)
          setCurrentTime(0)
          setIsPlaying(true)
          return prev
        }
        const newList = [...prev, song]
        setCurrentIndex(newList.length - 1)
        setCurrentTime(0)
        setIsPlaying(true)
        return newList
      })
    },
    [],
  )

  const togglePlay = useCallback(() => {
    if (!currentSong) return
    setIsPlaying((p) => !p)
  }, [currentSong])

  const next = useCallback(() => {
    if (!playlist.length) return
    setCurrentIndex(pickNextIndex(1))
    setCurrentTime(0)
    setIsPlaying(true)
  }, [playlist.length, pickNextIndex])

  const prev = useCallback(() => {
    if (!playlist.length) return
    setCurrentIndex(pickNextIndex(-1))
    setCurrentTime(0)
    setIsPlaying(true)
  }, [playlist.length, pickNextIndex])

  const seek = useCallback((t: number) => {
    const audio = audioRef.current
    setCurrentTime(t)
    if (audio && audio.src) {
      try {
        audio.currentTime = t
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const addSong = useCallback((song: Song) => {
    setPlaylist((prev) => {
      if (prev.find((s) => s.id === song.id)) return prev
      return [...prev, song]
    })
  }, [])

  const removeSong = useCallback((id: number) => {
    setPlaylist((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      if (idx < 0) return prev
      const nextList = prev.filter((s) => s.id !== id)
      if (idx === currentIndex) {
        setCurrentIndex(Math.min(idx, Math.max(0, nextList.length - 1)))
        setIsPlaying(false)
      } else if (idx < currentIndex) {
        setCurrentIndex((i) => i - 1)
      }
      return nextList
    })
  }, [currentIndex])

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentSong,
      playlist,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      playMode,
      playList,
      playSong,
      togglePlay,
      next,
      prev,
      seek,
      setPlayMode,
      addSong,
      removeSong,
      formatTime: formatTimeSec,
    }),
    [
      currentSong,
      playlist,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      playMode,
      playList,
      playSong,
      togglePlay,
      next,
      prev,
      seek,
      addSong,
      removeSong,
    ],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}
