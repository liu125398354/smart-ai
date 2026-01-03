/**
 * @Author: Liunannan
 * @Date: 2026/1/3 14:13
 * @Description:
 */
import { defineStore } from 'pinia'
import { saveToLocal, getFromLocal, removeLocal } from '@/utils/index'

// 初始化用户信息
function initUserInfo() {
  const token = getFromLocal('token')
  const userInfo = getFromLocal('userInfo')
  if (token && userInfo) {
    try {
      return userInfo
    } catch (e) {
      console.error('解析用户信息失败:', e)
      // 清除无效的本地存储
      removeLocal('token')
      removeLocal('userInfo')
    }
  }
  return null
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getFromLocal('token') || '',
    userInfo: initUserInfo()
  }),

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
  },

  actions: {
    setToken(token) {
      this.token = token
      saveToLocal('token', token)
    },
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      saveToLocal('userInfo', userInfo)
    },
    clearUserInfo() {
      this.userInfo = null
      // 清除本地存储
      removeLocal('token')
      removeLocal('userInfo')
    }
  }
})
