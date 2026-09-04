import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** 路由切换时自动回到页面顶部（修复长页面残留滚动位置的问题） */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default ScrollToTop
