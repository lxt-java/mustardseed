import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

// 部署到 GitHub Pages 的仓库名。若你的仓库不是 mint-box，
// 请改为你的真实仓库名，例如 '/你的仓库名/' 或保持 '/' 用于自定义域名。
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/mint-box/' : '/'
  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { port: 5173 },
  }
})
