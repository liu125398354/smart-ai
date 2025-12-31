import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import Antd from 'ant-design-vue'
import './assets/css/reset.styl'

import ellipsisTitle from '@/directives/v-ellipsis-title.js'

// 修复在Vite环境中，顶层await的支持问题
async function initApp() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(Antd).use(pinia).use(router)

  app.directive('ellipsis-title', ellipsisTitle)

  await router.isReady()
  app.mount('#app')
}

initApp()
