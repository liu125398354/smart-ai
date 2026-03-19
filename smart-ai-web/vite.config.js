import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import eslintPlugin from 'vite-plugin-eslint'
import viteCompression from 'vite-plugin-compression'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'

export default defineConfig(async ({ mode }) => {
  // 加载对应环境的 .env 文件，例如 .env.development
  const env = loadEnv(mode, process.cwd())
  return {
    root: process.cwd(), // 项目根目录
    base: env.VITE_BASE_URL, // 公共路径，可根据环境变量配置

    plugins: [
      vue(),
      eslintPlugin({
        // 开发模式下在控制台显示警告和错误
        cache: false,
        include: ['src/**/*.js', 'src/**/*.vue'],
        emitWarning: true,
        emitError: true,
        lintOnStart: mode === 'development' // 只在 dev 检查
      }),
      // Brotli 压缩，服务器需要配置优先返回 .br 文件
      viteCompression({
        verbose: true,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br'
      }),
      // gzip 压缩生成 .gz 文件，生产环境可直接使用 nginx 或 CDN
      viteCompression({
        verbose: false,
        disable: false,
        threshold: 10240, // 大于 10kb 的文件才压缩
        algorithm: 'gzip',
        ext: '.gz'
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
          target: env.VITE_API_BASE_URL,
          ws: true, // 是否代理 websocket
          changeOrigin: true, // 跨域时修改 origin
          secure: false, // 如果是 https 接口，需要配置 false
          rewrite: (path) => path.replace(/^\/api/, '') // 重写路径
        }
      }
    },

    build: {
      outDir: env.VITE_OUTPUT_DIR, // 构建输出目录
      assetsDir: 'assets', // 静态资源目录
      sourcemap: false, // 是否生成 sourcemap
      minify: 'terser', // 压缩工具
      chunkSizeWarningLimit: 1500, // 调整 chunk 警告阈值，单位 KB
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
            if (/\.(woff2?|ttf|eot|otf)$/.test(name ?? '')) {
              return 'assets/fonts/[name]-[hash][extname]' // 将katex中的字体打包进assets目录
            }
            return 'assets/[name]-[hash][extname]'
          },
          manualChunks(id) {
            if (id.includes('echarts-gl')) return 'echarts-gl'
            if (id.includes('echarts')) return 'echarts'
            if (id.includes('ant-design-vue')) return 'ant-design-vue'
            if (id.includes('bytemd')) return 'bytemd'
            if (id.includes('katex')) return 'katex'

            if (id.includes('cytoscape')) return 'cytoscape'
            if (id.includes('elkjs')) return 'elk'
            if (id.includes('highlight.js')) return 'highlight'

            if (id.includes('lodash')) return 'lodash'
            if (id.includes('axios')) return 'axios'
            // 其他 node_modules 全部放 vendor
            if (id.includes('node_modules')) return 'vendor'
          }
        }
      },

      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },

      // 压缩图片等资源
      assetsInlineLimit: 4096 // 小于 4KB 的图片内联，减少请求
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
