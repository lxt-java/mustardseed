/**
 * 百度统计埋点
 *
 * 使用方法：
 * 1. 在 https://tongji.baidu.com 注册并添加站点（https://lxt-java.github.io/mustardseed）
 * 2. 获取代码里 hm.js?xxxxxxxx 中的那串 ID，填到下面的 BAIDU_TONGJI_ID
 * 3. 按百度后台提示完成站点验证（把验证文件放到 frontend/public/ 或在 index.html 加 meta）
 * 4. 后台查看路径：报告 → 行为分析 → 事件分析（分类即 category）
 *
 * 留空 = 不加载统计脚本，所有埋点自动静默，站点功能不受影响。
 */
const BAIDU_TONGJI_ID = 'e9ddc225e7ce3cb581efe7e520fc4de2'

declare global {
  interface Window { _hmt: Array<(string | boolean)[]> | undefined }
}

let inited = false

export function initAnalytics() {
  if (inited || !BAIDU_TONGJI_ID) return
  inited = true
  window._hmt = window._hmt || []
  const hm = document.createElement('script')
  hm.src = `https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}`
  hm.async = true
  document.head.appendChild(hm)
}

/** SPA 路由变化时手动上报 PV（首次加载由 hm.js 自动统计，无需调用） */
export function trackPageview(path: string) {
  if (!BAIDU_TONGJI_ID) return
  window._hmt = window._hmt || []
  window._hmt.push(['_trackPageview', path])
}

/** 自定义事件：category 事件分类（后台一张表），action 动作，label 细分项 */
export function trackEvent(category: string, action: string, label?: string) {
  if (!BAIDU_TONGJI_ID) return
  window._hmt = window._hmt || []
  window._hmt.push(['_trackEvent', category, action, label ?? ''])
}
