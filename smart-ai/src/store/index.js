import { createStore } from "vuex"
import chat from "./modules/chat"
import user from "./modules/user"

const store = createStore({
  modules: {
    chat,
    user
  }
})

export default store
