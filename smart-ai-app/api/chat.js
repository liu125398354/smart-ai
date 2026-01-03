import request from "@/api/request"

export default {
  sendMessage(params, config) {
    return request.post("/chat/getMessage", params)
  },
  
  sendQianFan(params, config) {
    return request.post("/qianfan/getQianFanMessage", params)
  },
  
  getConversations(params) {
    return request.post("/qianfan/getConversationsList", params, { requireUserId: true })
  },
  
  getChatMessagesByUser(params) {
    return request.post("/qianfan/getChatMessagesByUser", params, { requireUserId: true })
  },
  
  getChatMessagesByConversationId(params) {
    return request.post("/qianfan/getChatMessagesByConversationId", params)
  },
  
  delConversations(params) {
    return request.post("/qianfan/deleteConversations", params)
  },
  
  modifyConversationName(params) {
    return request.post("/qianfan/modifyConversationName", params)
  }
}