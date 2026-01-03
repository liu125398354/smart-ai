// 网络请求封装
import { getFromLocal, removeLocal } from '@/utils/index'
import { useUserStore } from '@/stores/user'
const BASE_URL = 'http://192.168.1.3:3000' // 根据实际情况修改

// 新增：防止重复刷新 token
let isRefreshing = false
let requestQueue = []

export default {
  // GET请求
  get(url, data = {}, options = {}) {
    return this.request('GET', url, data, options)
  },

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request('POST', url, data, options)
  },

  // 通用请求方法
  request(method, url, data, options) {
	const userStore = useUserStore()
    return new Promise((resolve, reject) => {

      const doRequest = () => {
        // #ifdef MP
        const token = userStore.token
        // #endif

        // #ifdef H5 || APP-PLUS
        const token = localStorage.getItem('token')
        // #endif

        const header = { 'Content-Type': 'application/json' }
        if (token) {
          header['Authorization'] = `Bearer ${token}`
        }
		
		if (options.requireUserId) {
		  const userInfo = getFromLocal('userInfo')
		  if (userInfo) {
			data = { ...data, userId: userInfo.id }
		  }
		}

        uni.request({
          url: BASE_URL + url,
          method,
          header,
          data,
          success: async (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(res.data)
            } else if (res.statusCode === 401 || res.statusCode === 403) {
              // 清除 token
              // #ifdef MP
              userStore.clearUserInfo()
              // #endif

              // #ifdef H5 || APP-PLUS
              localStorage.removeItem('token')
              // #endif

              // 小程序处理自动重新登录
              // #ifdef MP
              if (isRefreshing) {
                // 已经在刷新，加入队列
                requestQueue.push(() => {
                  this.request(method, url, data).then(resolve).catch(reject)
                })
                return
              }
              isRefreshing = true

              uni.showToast({
                title: '登录已过期，请重新授权',
                icon: 'none'
              })
              uni.login({
                provider: 'weixin',
                success: async (loginRes) => {
                  console.log('重新登录 code:', loginRes.code)
                  // 调用后端 /wxlogin 获取新 token
                  try {
                    const loginResult = await new Promise(res2 => {
                      uni.request({
                        url: BASE_URL + '/auth/wxlogin',
                        method: 'POST',
                        data: { code: loginRes.code },
                        success: r => res2(r.data)
                      })
                    })
                    if (loginResult.success) {
					  userStore.setToken(loginResult.data.token)
					  userStore.setUserInfo(loginResult.data.user)
                      // 执行队列请求
                      requestQueue.forEach(cb => cb())
                      requestQueue = []
                      isRefreshing = false

                      // 重试当前请求
                      this.request(method, url, data, options).then(resolve).catch(reject)
                    }
                  } catch (err) {
                    isRefreshing = false
                    reject(new Error('重新登录失败'))
                  }
                }
              })
              // #endif

              // H5 / APP处理
              // #ifdef H5 || APP-PLUS
              uni.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none'
              })
              uni.redirectTo({ url: '/pages/login/login' })
              reject(new Error('未授权，请重新登录'))
              // #endif
            } 
            else {
              uni.showToast({
                title: `请求失败: ${res.statusCode}`,
                icon: 'none'
              })
              reject(new Error(`请求失败: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            uni.showToast({
              title: '网络请求失败',
              icon: 'none'
            })
            reject(new Error('网络请求失败'))
          }
        })
      }

      doRequest()
    })
  }
}
