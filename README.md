# smart-app应用

  - [项目简介](#项目简介)
  - [目录结构](#目录结构)
  - [依赖要求](#依赖要求)
  - [快速启动](#快速启动)
  - [使用工具](#使用工具)

## 项目简介

这是一个前后端分离的全栈应用，使用公共的package.json管理启动流程。启动时先启动后端服务，待后端就绪后再启动前端应用。

##目录结构

smart-app/
├── package.json        # 公共配置文件
├── smart-ai-service/   # 后端项目
│   └── package.json   # 后端配置
└── smart-ai/           # 前端项目
     └── package.json   # 前端配置

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

   该命令将分别在 smart-ai-service（后端）和 smart-ai（前端）目录中安装依赖。

2. 启动应用
   要同时启动后端和前端，可以运行以下命令：

   ```
      npm run start
   ```
   该命令将执行以下操作：

   启动 smart-ai-service 目录中的后端服务。
   等待后端准备好（监听 3000 端口）。
   一旦后端准备好，启动 smart-ai 目录中的前端服务。
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
