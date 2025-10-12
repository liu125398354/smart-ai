import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import store from "./store"

import Antd from "ant-design-vue"
import "./assets/css/reset.styl"

import ellipsisTitle from "@/directives/v-ellipsis-title.js"
const app = createApp(App)
app.directive("ellipsis-title", ellipsisTitle)
app.use(Antd).use(store).use(router).mount("#app")
