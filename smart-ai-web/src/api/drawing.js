/**
 * Created by liunannan on 2021/08/16.
 */

import request from "@/service/axios"

export default {
  makePic(params) {
    return request({
      url: "/draw/makePic",
      method: "post",
      data: params,
      timeout: 0
    })
  },
  getProgress(params) {
    return request({
      url: "/draw/getProgress",
      method: "get",
      params: params
    })
  },
  getCode(params) {
    return request({
      url: "/draw/getCode",
      method: "get",
      params: params
    })
  }
}
