/**
 * Created by liunannan on 2023/08/16.
 */
import { saveToLocal, getFromLocal } from "@/utils/index"
import { v4 as uuidv4 } from "uuid"
const user = {
  state: {
    userId: ""
  },
  mutations: {
    setUserId(state, data) {
      let userId = getFromLocal("userId")
      if (!userId) {
        userId = uuidv4() // 如果没有 userId，则生成新的
        saveToLocal("userId", userId) // 保存新的 userId 到本地
      }
      state.userId = userId // 更新 state 中的 userId
    }
  },
  actions: {},
  getters: {
    getUserId: (state) => {
      return state.userId
    }
  }
}

export default user
