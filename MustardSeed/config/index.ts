import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import { UnifiedWebpackPluginV5 } from 'weapp-tailwindcss/webpack'
import path from 'path'

// https://taro-docs.jd.com/docs
export default defineConfig<'webpack5'>(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'mint-station',
    date: '2026-9-2',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    plugins: [],
    // 关闭 prebundle：weapp-tailwindcss 官方提示 prebundle 常出兼容问题
    compiler: {
      type: 'webpack5',
      prebundle: { enable: false },
    },
    framework: 'react',
    mini: {
      webpackChain(chain) {
        chain.merge({
          plugin: {
            install: {
              plugin: UnifiedWebpackPluginV5,
              args: [
                {
                  appType: 'taro',
                  // rem -> rpx（1rem = 32rpx），与 750 设计稿对齐
                  rem2rpx: true,
                },
              ],
            },
          },
        })
      },
    },
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, require('./dev').default)
  }
  return merge({}, baseConfig, require('./prod').default)
})
