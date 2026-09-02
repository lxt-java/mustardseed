# 🌿 薄荷小站 (mint-box)

> 一个小而美的清新薄荷绿综合工具箱：**办公 | 休闲 双模式**，**纯前端**，无需登录，所有数据保存在你的浏览器本地。  
> 托管：GitHub Pages · 仓库：https://github.com/lxt-java/mint-box

---

## ✨ 功能总览

### 🛠️ 办公工具箱
| 工具 | 状态 | 亮点 |
|---|---|---|
| 🍅 番茄钟 | ✅ v1 首发 | 圆形进度 SVG；专注/短休/长休三模式；每日目标；WebAudio 合成提示音；document.title 实时倒计时 |
| ✅ 待办清单 | ✅ v1 推荐 | 回车添加 / 星标 / 到期日 / 双击编辑 / 5 种筛选 / 导出 txt / 一键清已完成 |
| 📏 JSON 格式化 | ⏳ 即将上线 | 美化 / 压缩 / 校验 / 格式化错误定位 |
| ⏱️ 时间戳转换 | ⏳ 即将上线 | Unix 时间戳 ↔ 本地时间 / UTC / 毫秒级 |
| 📅 工作日计算 | ⏳ 即将上线 | 区间工作日 / 节假日 + 调休预测 |

### 🎡 休闲娱乐
| 工具 | 状态 | 亮点 |
|---|---|---|
| 🎯 纠结人神器 | ✅ v1 首发 | 6 个内置模板（吃啥/喝啥/周末/做不做/硬币/骰子）+ 2/3/4/6 快速填充 + 自定义选项；滚动减速抽奖动画；历史记录 |
| ✨ 治愈金句 | ✅ v1 首发 | 内置 **200 条中英对照圣经金句**；9 种主题筛选 + ⭐收藏；一键复制中/英/全文；一键导出 **SVG 矢量分享图**（渐变背景 + 叶片装饰 + 小站水印） |
| 🎵 音乐小站 | ✅ UI 就绪 | 钢琴曲 / 白噪音 / 热门歌 三分类；播放器大卡片（进度条 / 上下首 / 拖拽 seek）；支持粘贴在线音频 URL 接口；收藏 / 搜索 / 本地持久化 |
| 🎲 随机抽签 | ⏳ 即将上线 | 自定义签文池 + 摇签动画 |
| 🧩 趣味小测试 | ⏳ 即将上线 | 性格 / 颜色 / 今日运势 |

---

## 🚀 本地开发

前置条件：**Node.js ≥ 18**

```bash
git clone https://github.com/lxt-java/mint-box.git
cd mint-box
# 如果你用单仓式结构 (frontend/ 子目录)，也请 cd frontend
npm install
npm run dev       # → http://127.0.0.1:5173/
```

其他命令：

```bash
npm run build     # 生产构建 → dist/
npm run preview   # 本地预览 build 产物
```

---

## 🌐 GitHub Pages 一键部署（推荐）

本仓库已内置 **GitHub Actions 自动部署工作流**（`.github/workflows/deploy.yml`）。
启用步骤：

1. **GitHub 上打开仓库 → Settings → Pages**  
   `Build and deployment → Source` 选择 `GitHub Actions`

2. **推送一次 main / master 分支**，`deploy.yml` 会自动：
   - 安装依赖 → 构建 → 上传 `dist/` 到 Pages
   - 每次 push 都会自动重新部署 ✅

### ⚠️ 如果你改了仓库名

编辑 `frontend/vite.config.ts`，把：
```ts
const base = mode === 'production' ? '/mint-box/' : '/'
```
里面的 `/mint-box/` 改为 `'/你的仓库名/'`，否则部署后资源 404。  
如果使用了自定义域名，则改为 `'/'`。

---

## 🧩 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | React 18 + TypeScript (strict) | 纯组件化，无 Redux 等重型状态库 |
| 构建 | Vite 5 | HMR 秒开，构建产物 gzip ≈ 110KB |
| 路由 | react-router v6 · HashRouter | GitHub Pages 天然兼容，深链不 404 |
| 样式 | TailwindCSS 3 + 自定义 mint 色板 | 清新薄荷绿主题，一套颜色贯穿全部页面 |
| 持久化 | `localStorage` (utils/storage.ts) | 全端免登录：番茄统计、待办、纠结历史、金句收藏、音乐播放列表 |
| 音效 | Web Audio API (番茄钟) | 无外部音频文件，C / E / G 三音琶音合成 |
| 导出 | SVG 字符串合成 + Blob | 金句可分享图零依赖、矢量清晰 |

---

## 📁 目录结构

```
mint-box/
├─ .github/workflows/deploy.yml      # Pages 自动部署
├─ .gitignore
├─ README.md
└─ frontend/
   ├─ index.html                     # 标题 / favicon / theme-color
   ├─ package.json
   ├─ vite.config.ts                 # base: '/mint-box/'（生产）
   ├─ tailwind.config.js             # mint 色板 + shadow-soft/card
   ├─ postcss.config.js
   ├─ tsconfig.json                  # strict + @/* alias
   └─ src/
      ├─ main.tsx                    # HashRouter
      ├─ App.tsx                     # 路由：/pomodoro /todo /picker /verse /music
      ├─ index.css                   # 薄荷径向渐变背景 + 所有动画 keyframes
      ├─ utils/storage.ts
      ├─ data/verses.ts              # 200 条中英对照圣经金句
      ├─ components/
      │   ├─ PageHeader.tsx          # 工具页统一顶部栏（返回箭头）
      │   └─ SiteFooter.tsx          # 底部版权 + 指向 GitHub 仓库的 ⭐Star
      └─ pages/
          ├─ Home.tsx                # 办公工具箱 / 休闲娱乐 双板块导航
          ├─ Pomodoro.tsx
          ├─ Todo.tsx
          ├─ Picker.tsx
          ├─ Verse.tsx
          └─ Music.tsx               # 播放器 UI 预留，支持粘贴音频 URL
```

---

## 🎨 主题设计哲学

- **主色**：薄荷绿 `#1a9464` — 干净、平静、轻松愉快，不刺激视觉疲劳  
- **背景**：两处径向光斑 + 白色渐变，既有呼吸感，又保证全页文字可读  
- **阴影**：`shadow-soft` 柔和 + `shadow-card` 实体，两套层级拉开深浅  
- **动效**：卡片 `hover:scale(1.02)`、按钮 `btn-press scale(0.96)`、抽奖 `shake`、加载 `fade-up` + `popIn`

---

## 📜 License · 声明

- 代码：MIT，欢迎 Fork / Star / PR 💚
- 金句数据：来源于公共版权圣经译本的常用经文，仅供个人激励使用
- 数据：100% 保存在你本地浏览器 localStorage，任何时候不会上传

Made with 💚 · 薄荷小站 v1.0.0
