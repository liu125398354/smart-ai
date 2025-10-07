/**
 * Created by liunannan on 2021/08/16.
 */

import request from "@/service/axios"

export default {
  sendMessage(params, config) {
    return request({
      ...config,
      url: "/chat/getMessage",
      method: "post",
      data: params,
      timeout: 0
    })
  },
  sendQianFan(params, config) {
    return request({
      ...config,
      url: "/qianfan/getQianFanMessage",
      method: "post",
      data: params,
      timeout: 0
    })
  },
  getConversations(params) {
    return request({
      url: "/qianfan/getConversationsList",
      method: "post",
      data: params
    })
  },
  delConversations(params) {
    return request({
      url: "/qianfan/deleteConversations",
      method: "post",
      data: params
    })
  },
  modifyConversationName(params) {
    return request({
      url: "/qianfan/modifyConversationName",
      method: "post",
      data: params
    })
  }
}
