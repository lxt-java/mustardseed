/** 分享图内置背景主题 */
export interface ShareTheme {
  id: string
  name: string
  /** 背景图 URL；不填表示经典渐变（背景直接画在 SVG 内） */
  bg?: string
}

const base = import.meta.env.BASE_URL || '/'

export const SHARE_THEMES: ShareTheme[] = [
  { id: 'classic', name: '经典薄荷' },
  { id: 'mint', name: '薄荷水彩', bg: `${base}share-bg/bg-mint.jpg` },
  { id: 'cream', name: '米色信纸', bg: `${base}share-bg/bg-cream.jpg` },
  { id: 'sky', name: '晴空云朵', bg: `${base}share-bg/bg-sky.jpg` },
  { id: 'peach', name: '蜜桃日出', bg: `${base}share-bg/bg-peach.jpg` },
]

export function getShareTheme(id: string): ShareTheme {
  return SHARE_THEMES.find((t) => t.id === id) ?? SHARE_THEMES[0]
}
