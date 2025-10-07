import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import store from "./store"

import Antd from "ant-design-vue"
import "./assets/css/reset.styl"

createApp(App).use(Antd).use(store).use(router).mount("#app")
