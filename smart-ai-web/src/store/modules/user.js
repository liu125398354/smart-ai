/**
 * Created by liunannan on 2023/08/16.
 */
import { saveToLocal, getFromLocal } from "@/utils/index"
import { v4 as uuidv4 } from "uuid"

// 初始化用户信息
function initUserInfo() {
  const token = localStorage.getItem("token")
  const userInfo = localStorage.getItem("userInfo")
  if (token && userInfo) {
    try {
      return JSON.parse(userInfo)
    } catch (e) {
      console.error("解析用户信息失败:", e)
      // 清除无效的本地存储
      localStorage.removeItem("token")
      localStorage.removeItem("userInfo")
    }
  }
  return null
}

const user = {
  state: {
    token: localStorage.getItem("token") || "",
    userInfo: initUserInfo()
  },
  mutations: {
    setToken(state, token) {
      state.token = token
      localStorage.setItem("token", token)
    },
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo
      localStorage.setItem("userInfo", JSON.stringify(userInfo))
    },
    clearUserInfo(state) {
      state.userInfo = null
      // 清除本地存储
      localStorage.removeItem("token")
      localStorage.removeItem("userInfo")
    }
  },
  actions: {},
  getters: {
    getUserId: (state) => {
      return state.userInfo ? state.userInfo.id : null
    },
    getUserInfo: (state) => {
      return state.userInfo
    }
  }
}

export default user
