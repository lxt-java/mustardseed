/**
 * 分享图工具：SVG → PNG 转换（支持背景图合成）+ 系统分享
 * 金句卡片 / 待办清单等导出图片共用
 */

export interface SvgToPngOptions {
  scale?: number
  /** 背景图 URL（同源，避免 canvas 污染）；不传则使用 SVG 自身背景 */
  bgUrl?: string
  /** 背景图上的白色蒙层不透明度，保证文字可读，默认 0.82 */
  overlayAlpha?: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

/** 以 cover 方式把背景图画到画布（等比缩放裁剪，铺满不留白） */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
}

/** SVG 字符串 → PNG dataURL */
export async function svgToPngDataUrl(svg: string, opts: SvgToPngOptions = {}): Promise<string> {
  const { scale = 2, bgUrl, overlayAlpha = 0.55 } = opts
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const fg = await loadImage(url)
    const W = (fg.naturalWidth || 800) * scale
    const H = (fg.naturalHeight || 600) * scale
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const ctx = c.getContext('2d')
    if (!ctx) throw new Error('canvas 2d 不可用')

    if (bgUrl) {
      // 背景图 + 白色蒙层（背景加载失败时降级为白底，不阻断导出）
      try {
        const bg = await loadImage(bgUrl)
        drawCover(ctx, bg, W, H)
        ctx.fillStyle = `rgba(255,255,255,${overlayAlpha})`
        ctx.fillRect(0, 0, W, H)
      } catch {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, W, H)
      }
    }
    ctx.drawImage(fg, 0, 0, W, H)
    return c.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** 调起系统分享面板分享图片（iOS/Android 可直接「存储图像」进相册）；不支持或失败返回 false */
export async function shareImageFile(dataUrl: string, filename: string, title: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], filename, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title })
      return true
    }
  } catch {
    /* 用户取消分享会抛 AbortError，忽略 */
  }
  return false
}

/** XML 转义，防止经文/待办文本中的 & < > 破坏 SVG */
export function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
