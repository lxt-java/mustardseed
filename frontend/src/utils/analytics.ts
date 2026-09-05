/**
 * 百度统计埋点
 *
 * hm.js 脚本已静态写在 index.html <head> 中（官方"代码检查"要求在网页
 * 源码里直接看到 hm.baidu.com/hm.js 才判定安装成功），本模块只负责往
 * window._hmt 推送事件，不要在别处重复加载统计脚本（会重复计数）。
 *
 * 后台查看路径：报告 → 行为分析 → 事件分析（分类即 category）
 */
declare global {
  interface Window { _hmt?: Array<(string | boolean)[]> }
}

/** SPA 路由变化时手动上报 PV（首次加载由 hm.js 自动统计，无需调用） */
export function trackPageview(path: string) {
  window._hmt?.push(['_trackPageview', path])
}

/** 自定义事件：category 事件分类（后台一张表），action 动作，label 细分项 */
export function trackEvent(category: string, action: string, label?: string) {
  window._hmt?.push(['_trackEvent', category, action, label ?? ''])
}
