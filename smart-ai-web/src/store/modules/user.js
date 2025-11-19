/**
 * Created by liunannan on 2023/08/16.
 */
import { saveToLocal, getFromLocal, removeLocal } from "@/utils/index"
import { v4 as uuidv4 } from "uuid"

// 初始化用户信息
function initUserInfo() {
  const token = getFromLocal("token")
  const userInfo = getFromLocal("userInfo")
  if (token && userInfo) {
    try {
      return userInfo
    } catch (e) {
      console.error("解析用户信息失败:", e)
      // 清除无效的本地存储
      removeLocal("token")
      removeLocal("userInfo")
    }
  }
  return null
}

const user = {
  state: {
    token: getFromLocal("token") || "",
    userInfo: initUserInfo()
  },
  mutations: {
    setToken(state, token) {
      state.token = token
      saveToLocal("token", token)
    },
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo
      saveToLocal("userInfo", userInfo)
    },
    clearUserInfo(state) {
      state.userInfo = null
      // 清除本地存储
      removeLocal("token")
      removeLocal("userInfo")
    }
  },
  actions: {},
  getters: {
    getUserId: (state) => {
      return state.userInfo ? state.userInfo.id : null
    },
    getUserInfo: (state) => {
      return state.userInfo
    },
    getToken: (state) => {
      return state.token
    }
  }
}

export default user
