export interface Category {
  id: number
  name: string
  description: string
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface Song {
  id: number
  title: string
  artist: string
  album: string
  categoryId?: number
  songNumber: number
  lyrics?: string
  fileUrl?: string
  coverUrl?: string
  duration: number
  playCount: number
  favorite: number
  categoryName?: string
  createdAt?: string
  updatedAt?: string
}

export interface Playlist {
  id: number
  name: string
  description: string
  coverUrl?: string
  songCount: number
  createdAt?: string
  updatedAt?: string
}

export interface AppInfo {
  appName: string
  version: string
  releaseDate: string
  themeColor: string
  clientId: string
}

export interface PlayerState {
  currentSong: Song | null
  playlist: Song[]
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  playMode: 'sequence' | 'repeat' | 'shuffle'
}
