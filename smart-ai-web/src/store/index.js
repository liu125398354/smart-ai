import { createStore } from "vuex"
import chat from "./modules/chat"
import user from "./modules/user"
import record from "./modules/record"

const store = createStore({
  modules: {
    chat,
    user,
    record
  }
})

export default store
