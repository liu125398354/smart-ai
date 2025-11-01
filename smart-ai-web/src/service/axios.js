/**
 * Created by liunannan on 2023/08/16.
 */

import axios from "axios"
import { message } from "ant-design-vue"
import { BASE_URL } from "@/config/apiConfig"

const service = axios.create({
  baseURL: BASE_URL,
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 20000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  (config) => {
    // do something before request is sent
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // do something with request error
    console.log("request---", error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  (response) => {
    const res = response.data
    return res
  },
  (error) => {
    const res = error.response
    // 这里是全局错误提示处理
    if (res) {
      if (res.status === 401) {
        return Promise.resolve(res.data)
      } else if (res.status === 400 || res.status === 500) {
        message.error(res.data.message)
      } else {
        message.error("服务器错误，请稍后再试")
      }
    } else {
      message.error("网络异常，请检查连接")
    }
    return Promise.reject(error)
  }
)

export default service
