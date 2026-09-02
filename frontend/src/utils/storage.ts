/** localStorage 简易封装，带 JSON 序列化，支持过期（可选） */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw == null) return fallback
      return JSON.parse(raw) as T
    } catch (e) {
      console.warn('[storage.get]', key, e)
      return fallback
    }
  },
  set<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('[storage.set]', key, e)
    }
  },
  remove(key: string) {
    localStorage.removeItem(key)
  },
}
