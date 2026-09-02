import request from './request'
import type { Category, Song, Playlist, AppInfo } from '@/types'

// ===== Category =====
export const categoryList = (): Promise<Category[]> => request.get('/categories')
export const categoryCreate = (data: Partial<Category>): Promise<Category> => request.post('/categories', data)
export const categoryUpdate = (id: number, data: Partial<Category>): Promise<Category> => request.put(`/categories/${id}`, data)
export const categoryDelete = (id: number): Promise<void> => request.delete(`/categories/${id}`)

// ===== Song =====
interface SongPage {
  records: Song[]
  total: number
  size: number
  current: number
}
export const songPage = (params: {
  pageNum?: number
  pageSize?: number
  categoryId?: number | null
  keyword?: string
  favorite?: number
}): Promise<SongPage> => request.get('/songs', { params })

export const songAll = (playlistId?: number): Promise<Song[]> =>
  request.get('/songs/all', { params: playlistId ? { playlistId } : {} })

export const songFavorites = (): Promise<Song[]> => request.get('/songs/favorites')
export const songDetail = (id: number): Promise<Song> => request.get(`/songs/${id}`)
export const songCreate = (data: Partial<Song>): Promise<Song> => request.post('/songs', data)
export const songUpdate = (id: number, data: Partial<Song>): Promise<Song> => request.put(`/songs/${id}`, data)
export const songDelete = (id: number): Promise<void> => request.delete(`/songs/${id}`)
export const songToggleFavorite = (id: number): Promise<void> => request.post(`/songs/${id}/favorite`)
export const songMarkPlayed = (id: number): Promise<void> => request.post(`/songs/${id}/play`)

// ===== Playlist =====
export const playlistList = (): Promise<Playlist[]> => request.get('/playlists')
export const playlistDetail = (id: number): Promise<Playlist> => request.get(`/playlists/${id}`)
export const playlistSongs = (id: number): Promise<Song[]> => request.get(`/playlists/${id}/songs`)
export const playlistCreate = (data: Partial<Playlist>): Promise<Playlist> => request.post('/playlists', data)
export const playlistUpdate = (id: number, data: Partial<Playlist>): Promise<Playlist> => request.put(`/playlists/${id}`, data)
export const playlistDelete = (id: number): Promise<void> => request.delete(`/playlists/${id}`)
export const playlistAddSong = (id: number, songId: number): Promise<void> =>
  request.post(`/playlists/${id}/songs`, { songId })
export const playlistRemoveSong = (id: number, songId: number): Promise<void> =>
  request.delete(`/playlists/${id}/songs/${songId}`)

// ===== App =====
export const appInfo = (): Promise<AppInfo> => request.get('/app/info')
export const appStats = (): Promise<Record<string, any>> => request.get('/app/stats')
