# smart-ai应用

  - [项目简介](#项目简介)
  - [目录结构](#目录结构)
  - [依赖要求](#依赖要求)
  - [快速启动](#快速启动)
  - [使用工具](#使用工具)

## 项目简介

这是一个前后端分离的全栈应用，使用公共的package.json管理启动流程。启动时先启动后端服务，待后端就绪后再启动前端应用。
此项目主要意在完善AI对话的流程，初始创建是在2023年8月，当时只是一个demo版本，十分简易，后续经过chatgpt4、deepseek，
chatgpt5等一系列版本出来后，就想着把每一处的细节补充一下，具体包括以下几点：

1. 添加会话列表，选择mongodb存储会话信息
2. 列表增加了重命名、删除、记录选中、滚动到指定位置等操作
3. 对话滚动效果根据不同切换逻辑做了优化
4. 添加开启新对话模式，后端请求头特殊处理
5. 增加了上下文连续对话（通过存储在数据文档中的内容实现）
6. 重新优化了对话布局
7. 对数学公式进行了适配兼容显示（过程中尝试了诸多办法）
8. 针对前端功能，后端添加相应的接口以及优化错误状态的捕获
9. 添加了mermaid图的识别显示，并单独写了一个组件
10. 使用Echarts完善了图表的渲染，并区分纯文本和图表消息的显示

## 目录结构

```markdown
smart-ai
├── smart-ai-app                        # Uni-App小程序端
│   ├── api                             # 小程序端接口封装
│   │   ├── auth.js                     # 登录 / 注册 / Token 相关接口
│   │   ├── chat.js                     # 聊天业务接口
│   │   └── request.js                  # 基于 uni.request 的请求封装
│   ├── components                      # 可复用 UI 组件
│   │   ├── ChatView.vue                # 聊天窗口组件（展示消息流）
│   │   └── MessageItem.vue             # 单条消息组件（文本/图片等）
│   ├── pages                           # 小程序页面目录
│   │   └── chat
│   │       └── chat.vue                # 聊天主页面（入口页面）
│   ├── static                          # 静态资源目录
│   │   └── logo.png                    # 默认 Logo 示例
│   ├── utils                           # 工具类（格式化工具/缓存封装）
│   ├── wxcomponents                    # 第三方组件目录
│   ├── App.vue                         # Uni-App 根组件
│   ├── index.html                      # H5 端入口文件
│   ├── main.js                         # 项目主入口
│   ├── manifest.json                   # Uni-App 应用配置（App、小程序、H5）
│   ├── pages.json                      # 配置所有页面路由
│   ├── uni.promisify.adaptor.js        # 兼容 Promise 的 uni API 适配器
│   └── uni.scss                        # 全局样式变量（主题色等）
│
├── smart-ai-service                    # 后端项目（Node.js + Express）
│   ├── bin                             # 启动脚本目录
│   ├── config                          # 配置文件目录
│   │   └── dbConnect.js                # MongoDB 数据库连接逻辑
│   ├── middleware                      # 中间件目录
│   │   └── authMiddleware.js           # 统一认证鉴权
│   ├── models                          # 数据模型（Mongoose Schema）
│   │   └── db.js                       # Conversation 模型定义
│   ├── public                          # 静态资源
│   ├── routes                          # 接口文件（路由层）
│   │   ├── auth.js                     # 登录/注册/Token 相关接口
│   │   ├── chat.js                     # 聊天接口（AI 回复）
│   │   ├── drawing.js                  # 绘图接口（调用大模型）
│   │   └── qianfan.js                  # 文心千帆 API 接口
│   ├── services                        # 业务逻辑层
│   │   └── conversationService.js      # 对话相关业务逻辑封装
│   ├── views                           # 页面视图（Jade 模板）
│   ├── app.js                          # 后端入口文件
│   ├── nodemon.json                    # Nodemon 配置文件（热更新）
│   ├── package-lock.json
│   └── package.json                    # 后端 NPM 配置
│
├── smart-ai-web                       # 前端项目（Vue3 + Vite）
│   ├── public                         # 静态资源
│   ├── src                            # 源代码
│   │   ├── api                        # 接口请求
│   │   │   ├── auth.js                # 登录接口封装
│   │   │   ├── chat.js                # 聊天接口封装
│   │   │   └── drawing.js             # 绘图接口封装
│   │   ├── assets                     # 前端资源文件
│   │   ├── components                 # 公共组件
│   │   │   ├── ChartRenderer.vue      # ECharts 渲染组件
│   │   │   ├── MarkdownRenderer.vue   # Markdown 渲染组件（Bytemd 集成）
│   │   │   └── MermaidRenderer.vue    # Mermaid 流程图渲染组件
│   │   ├── config                     # 配置文件目录
│   │   │   └── apiConfig.js           # URL 地址统一配置
│   │   ├── directives                 # Vue 自定义指令
│   │   │   └── v-ellipsis-title.js    # 悬浮显示 title
│   │   ├── layouts                    # 布局文件
│   │   │   └── index.vue
│   │   ├── router                     # 路由
│   │   │   └── index.js
│   │   ├── service                    # 封装的服务
│   │   │   └── axios.js               # Axios 实例封装（统一拦截器）
│   │   ├── stores                     # 状态管理（pinia / vuex）
│   │   ├── utils                      # 工具函数
│   │   ├── views                      # 页面视图
│   │   │   ├── chat                   # 聊天页面
│   │   │   │   └── chat.vue
│   │   │   ├── drawing                # 绘图页面
│   │   │   │   └── drawing.vue
│   │   │   ├── login                  # 登录页面
│   │   │   │   └── Login.vue
│   │   │   ├── EventSource.html       # 测试 EventSource（SSE）页面
│   │   │   └── katex.html             # KaTeX 公式渲染测试页面
│   │   ├── App.vue                    # 主组件
│   │   └── main.js                    # 入口文件
│   ├── index.html
│   ├── jsconfig.json                  # JS/TS 配置
│   ├── package-lock.json
│   ├── package.json                   # 前端依赖管理
│   └── vite.config.js                 # Vite 配置
│
├── LICENSE
├── package-lock.json
├── package.json                       # 公共配置文件
└── README.md
```

## 依赖要求

- Node.js v16.x 或更高版本

- npm v8.x 或更高版本

- 后端项目依赖：nodemon（本地安装）

## 快速启动

1. 安装依赖
   通过运行以下命令安装后端和前端所需的依赖：

   ```
      npm run install
   ```

   该命令将分别在 smart-ai-service（后端）和 smart-ai-web（前端）目录中安装依赖。

2. 启动应用
   要同时启动后端和前端，可以运行以下命令：

   ```
      npm run start
   ```
   该命令将执行以下操作：

   启动 smart-ai-service 目录中的后端服务。
   等待后端准备好（监听 3000 端口）。
   一旦后端准备好，启动 smart-ai-web 目录中的前端服务。
   使用 concurrently 工具并行运行这两个进程，后端日志以蓝色显示，前端日志以绿色显示。

3. 自定义前端启动（不等待后端）
   如果您希望在不等待后端准备好的情况下启动前端，可以运行：

   ```
     npm run start:frontend
   ```

4. 仅启动后端
   如果只想启动后端服务，可以运行：

   ```
     npm run start:backend
   ```

## 使用工具

   Concurrently: 同时运行多个 npm 脚本。
   Wait-on: 在启动前端之前等待后端准备好。
