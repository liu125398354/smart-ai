/**
 * Created by liunannan on 2021/08/16.
 */

import axios from "axios"

const service = axios.create({
  baseURL:
    process.env.NODE_ENV === "development"
      ? "/api"
      : process.env.NODE_ENV === "production"
      ? ""
      : "",
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 20000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  (config) => {
    // do something before request is sent
    config.headers.authorization = ""
    return config
  },
  (error) => {
    // do something with request error
    console.log(error) // for debug
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
    return Promise.reject(error)
  }
)

export default service
