import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Pomodoro from './pages/Pomodoro'
import Todo from './pages/Todo'
import Picker from './pages/Picker'
import Verse from './pages/Verse'
import Music from './pages/Music'
import Workdays from './pages/Workdays'
import Quiz from './pages/Quiz'
import PageHeader from './components/PageHeader'
import SiteFooter from './components/SiteFooter'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/' || location.pathname === ''

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="w-full max-w-[720px] mx-auto flex-1 flex flex-col px-4 sm:px-6">
        {/* 顶部栏：首页显示大标题，其他页显示返回 */}
        {!isHome ? <PageHeader onBack={() => navigate(-1)} /> : null}

        <main className={`flex-1 w-full ${isHome ? 'pt-6 sm:pt-10 pb-12' : 'pb-16'}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/todo" element={<Todo />} />
            <Route path="/picker" element={<Picker />} />
            <Route path="/verse" element={<Verse />} />
            <Route path="/music" element={<Music />} />
            <Route path="/workdays" element={<Workdays />} />
            <Route path="/quiz" element={<Quiz />} />
          </Routes>
        </main>

        {/* 底部开源版权 */}
        <SiteFooter />
      </div>
    </div>
  )
}

export default App
