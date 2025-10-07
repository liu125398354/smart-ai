const { defineConfig } = require("@vue/cli-service")
const path = require("path")

function resolve(dir) {
  return path.join(__dirname, dir)
}

const port = process.env.port || process.env.npm_config_port || 8080 // dev port
module.exports = defineConfig({
  publicPath: "./",
  outputDir: "smartAI",
  assetsDir: "static",
  lintOnSave: process.env.NODE_ENV === "development",
  productionSourceMap: false,
  devServer: {
    port: port,
    host: "",
    open: true,
    // overlay: {
    //   warnings: false,
    //   errors: true
    // },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        ws: true,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          "^/api": ""
        }
      }
    }, // string | Object
    // 禁用缓冲，强制响应流动，这才能保证通过代理发送出去的请求响应回来的是流式传输数据
    // 否则就会缓冲，然后数据一次性回来，达不到流式传输的效果
    compress: false,
  },
  configureWebpack: {
    resolve: {
      alias: {
        "@": resolve("src")
      }
    },
    // 警告 webpack 的性能提示
    performance: {
      hints: "warning",
      // 入口起点的最大体积
      maxEntrypointSize: 50000000,
      // 生成文件的最大体积
      maxAssetSize: 30000000,
      // 只给出 js 文件的性能提示
      assetFilter: function (assetFilename) {
        return assetFilename.endsWith(".js")
      }
    }
  },
  chainWebpack(config) {
    config.plugins.delete("preload") // TODO: need test
    config.plugins.delete("prefetch") // TODO: need test
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    config.plugin("html").tap((args) => {
      args[0].title = "smartAI"
      return args
    })

    // set svg-sprite-loader
    config.module.rule("svg").exclude.add(resolve("src/common/icons")).end()
    config.module
      .rule("icons")
      .test(/\.svg$/)
      .include.add(resolve("src/common/icons"))
      .end()
      .use("svg-sprite-loader")
      .loader("svg-sprite-loader")
      .options({
        symbolId: "icon-[name]"
      })
      .end()

    // set preserveWhitespace
    config.module
      .rule("vue")
      .test(/\.vue$/)
      .use("vue-loader")
      .tap((options) => {
        options.compilerOptions = {
          preserveWhitespace: true
        }
      })
      .end()

    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === "development", (config) => config.devtool("cheap-source-map"))

    config.when(process.env.NODE_ENV !== "development", (config) => {
      config.optimization.splitChunks({
        chunks: "all",
        cacheGroups: {
          libs: {
            name: "chunk-libs",
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: "initial" // only package third parties that are initially dependent
          },
          antDesignVue: {
            name: "chunk-ant-design-vue",
            test: /[\\/]node_modules[\\/]ant-design-vue[\\/]/,
            chunks: "initial",
            priority: 20,
            reuseExistingChunk: true,
            enforce: true
          },
          commons: {
            name: "chunk-commons",
            test: resolve("src/components"), // can customize your rules
            minChunks: 3, //  minimum common number
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
      config.optimization.runtimeChunk("single")
    })
  }
})
