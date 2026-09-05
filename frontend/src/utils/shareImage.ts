/**
 * 分享图工具：SVG → PNG 转换 + 系统分享
 * 金句卡片 / 待办清单等导出图片共用
 */

/** SVG 字符串 → PNG dataURL（scale 倍分辨率，适合手机长按保存到相册） */
export function svgToPngDataUrl(svg: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      try {
        const w = (img.naturalWidth || 800) * scale
        const h = (img.naturalHeight || 600) * scale
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        if (!ctx) throw new Error('canvas 2d 不可用')
        ctx.drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        resolve(c.toDataURL('image/png'))
      } catch (e) {
        URL.revokeObjectURL(url)
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('SVG 渲染失败'))
    }
    img.src = url
  })
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
