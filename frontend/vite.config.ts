import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import { execSync } from 'child_process'

// 读取 git 信息，编译期注入（__GIT_BRANCH__ / __GIT_COMMIT__ / __GIT_DATE__）
function gitCmd(cmd: string, fallback = 'unknown'): string {
  try {
    return execSync(cmd, { cwd: fileURLToPath(new URL('.', import.meta.url)), encoding: 'utf8' }).trim()
  } catch {
    return fallback
  }
}

// 部署到 GitHub Pages 的仓库名。若仓库再次改名，
// 请同步修改这里的 '/mustardseed/'（或改为 '/' 用于自定义域名）。
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/mustardseed/' : '/'
  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      __GIT_BRANCH__: JSON.stringify(gitCmd('git rev-parse --abbrev-ref HEAD')),
      __GIT_COMMIT__: JSON.stringify(gitCmd('git rev-parse --short HEAD')),
      __GIT_DATE__: JSON.stringify(gitCmd('git log -1 --format=%ct')), // unix 时间戳（秒）
    },
    server: { port: 9999, strictPort: true, host: '0.0.0.0' },
    preview: { port: 9999, strictPort: true, host: '0.0.0.0' },
  }
})
