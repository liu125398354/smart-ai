import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import eslintPlugin from 'vite-plugin-eslint'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 加载对应环境的 .env 文件，例如 .env.development
  const env = loadEnv(mode, process.cwd())

  return {
    root: process.cwd(), // 项目根目录
    base: env.VITE_BASE_URL || '/', // 公共路径，可根据环境变量配置

    plugins: [
      vue(),
      eslintPlugin({
        // 开发模式下在控制台显示警告和错误
        cache: false,
        include: ['src/**/*.js', 'src/**/*.vue'],
        emitWarning: true,
        emitError: true,
        lintOnStart: true // 启动时检查所有文件
      }),
      vueJsx()
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      extensions: ['.js', '.ts', '.vue', '.json', '.jsx', '.tsx']
    },

    css: {
      preprocessorOptions: {
        stylus: {
          paths: [path.resolve(__dirname, 'src')] // Stylus 查找路径
          // additionalData: `@import "assets/css/reset.styl"`
        }
      }
    },

    server: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: false, // 如果端口被占用，自动尝试下一个端口
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
          ws: true, // 是否代理 websocket
          changeOrigin: true, // 跨域时修改 origin
          secure: false, // 如果是 https 接口，需要配置 false
          rewrite: (path) => path.replace(/^\/api/, '') // 重写路径
        }
      }
    },

    build: {
      outDir: env.VITE_OUTPUT_DIR || 'dist', // 构建输出目录
      assetsDir: 'assets', // 静态资源目录
      sourcemap: false, // 是否生成 sourcemap
      minify: 'terser', // 压缩工具
      rollupOptions: {
        output: {
          // 输出文件命名规则
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.css$/.test(name ?? '')) {
              return 'assets/css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },

          // 手动拆分 chunk，提高缓存和加载效率
          manualChunks: {
            'ant-design-vue': ['ant-design-vue'], // 独立打包 Ant Design Vue
            bytemd: [
              'bytemd',
              '@bytemd/plugin-gfm',
              '@bytemd/plugin-highlight',
              '@bytemd/plugin-math',
              '@bytemd/plugin-mermaid'
            ], // 独立打包 Bytemd 及插件
            echarts: ['echarts', 'echarts-gl'] // 独立打包 ECharts 和 ECharts GL
          }
        }
      },

      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    // 预打包优化，减少冷启动慢的问题
    optimizeDeps: {
      include: [
        'echarts',
        'echarts-gl',
        '@bytemd/vue',
        '@bytemd/plugin-gfm',
        '@bytemd/plugin-highlight',
        '@bytemd/plugin-math',
        '@bytemd/plugin-mermaid'
      ]
    }
  }
})
