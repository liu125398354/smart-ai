/**
 * Created by liunannan on 2023/08/16.
 */
import { saveToLocal, getFromLocal } from "@/utils"
import chatApi from "@/api/chat"
import user from "@/store/modules/user"

const chat = {
  state: {
    messageList: [],
    chartsMessageList: [],
    conversationsList: [],
    selectedConversationId: null
  },
  mutations: {
    addMessage(state, params) {
      const { conversationId, userId, role, content, createTime } = params
      const index = state.messageList.findIndex((item) => item.conversationId === conversationId)
      if (index > -1) {
        state.messageList[index].messages.push({
          role: role,
          content: content,
          createTime: createTime
        })
      } else {
        state.messageList.push({
          conversationId: conversationId,
          userId: userId,
          messages: [
            {
              role: role,
              content: content,
              createTime: createTime
            }
          ]
        })
      }
      saveToLocal("chatMessage", state.messageList)
    },
    delMessage(state, conversationId) {
      const index = state.messageList.findIndex((item) => item.conversationId === conversationId)
      if (index > -1) {
        state.messageList.splice(index, 1)
        saveToLocal("chatMessage", state.messageList)
      }
    },
    addChartsMessage(state, message) {
      state.chartsMessageList.push(message)
      saveToLocal("chartsMessage", state.chartsMessageList)
    },
    setConversationsData(state, data) {
      state.conversationsList = data
    },
    delConversationsData(state, index) {
      state.conversationsList.splice(index, 1)
      if (state.conversationsList.length === 0) {
        state.selectedConversationId = null
      } else if (index === state.conversationsList.length) {
        state.selectedConversationId = state.conversationsList[index - 1].conversationId
      } else {
        state.selectedConversationId = state.conversationsList[index].conversationId
      }
      saveToLocal("selectedConversationId", state.selectedConversationId)
    },
    updateMessage(state, params) {
      const { conversationId, message } = params
      const index = state.messageList.findIndex((item) => item.conversationId === conversationId)
      let messages = state.messageList[index].messages
      const lastIndex = messages.length - 1
      if (messages[lastIndex].role === "user") {
        messages.push({
          role: "assistant",
          content: message,
          createTime: new Date().getTime()
        })
      } else {
        messages[lastIndex].content = message
      }
      saveToLocal("chatMessage", state.messageList)
    },
    convertLastAssistantToChart(state, params) {
      const { conversationId, chartPayload } = params
      const index = state.messageList.findIndex((item) => item.conversationId === conversationId)
      if (index === -1) return
      const messages = state.messageList[index].messages
      const lastIndex = messages.length - 1
      if (lastIndex < 0) return
      const last = messages[lastIndex]
      if (last.role === "assistant") {
        last.isChart = true
        last.chartPayload = chartPayload
        last.content = "" // 由渲染器负责显示
        last.createTime = new Date().getTime()
        saveToLocal("chatMessage", state.messageList)
      }
    },
    updateChartsMessage(state, params) {
      const { uuid, message, flag } = params

      const index = state.chartsMessageList.findIndex((item) => item.uuid === uuid)
      if (index !== -1) {
        state.chartsMessageList[index].content = message
        state.chartsMessageList[index].end = flag
        saveToLocal("chartsMessage", state.chartsMessageList)
      } else {
        state.chartsMessageList.push({
          uuid: uuid,
          content: message,
          role: "assistant",
          createTime: new Date().getTime(),
          end: flag
        })
        saveToLocal("chartsMessage", state.chartsMessageList)
      }
    },
    setMessage(state, message) {
      if (Array.isArray(message) && message.length > 0) {
        saveToLocal("chatMessage", message)
        state.messageList = message
      } else {
        let data = getFromLocal("chatMessage")
        if (data) {
          state.messageList = data
        }
      }
    },
    setChartsMessage(state, message) {
      let data = getFromLocal("chartsMessage")
      if (data) {
        state.chartsMessageList = data
      }
    },
    setSelectedConversationId(state, id) {
      state.selectedConversationId = id
      saveToLocal("selectedConversationId", id)
    }
  },
  actions: {
    async getConversationsList({ commit, rootState }) {
      try {
        const response = await chatApi.getConversations({ userId: rootState.user.userInfo?.id })
        commit("setConversationsData", response) // 请求成功后将数据存储到state中
        return Promise.resolve(response)
      } catch (error) {
        commit("setError", error) // 请求失败时处理错误
        return Promise.reject(error)
      } finally {
      }
    },
    async getChatMessages({ commit, rootState }) {
      let messageList = rootState.chat.messageList
      if (Array.isArray(messageList) && messageList.length > 0) {
        return
      }
      // 如果本地storage被删除，则从后台获取所有对话内容
      try {
        const response = await chatApi.getChatMessagesByUser({
          userId: rootState.user.userInfo?.id
        })
        commit("setMessage", response.data) // 存储数据到state中
        return Promise.resolve(response)
      } catch (error) {
        commit("setError", error) // 处理错误
        return Promise.reject(error)
      }
    }
  },
  getters: {
    getMessageData: (state) => {
      let data =
        (state.messageList.length > 0 ? state.messageList : "") || getFromLocal("chatMessage")
      if (data) {
        const index = data.findIndex((item) => item.conversationId === state.selectedConversationId)
        return index > -1 ? data[index].messages : []
      } else {
        return state.messageList
      }
    },
    getChartsMessageData: (state) => {
      let data =
        (state.chartsMessageList.length > 0 ? state.chartsMessageList : "") ||
        getFromLocal("chartsMessage")
      if (data) {
        return data
      } else {
        return state.chartsMessageList
      }
    },
    getConversationsData: (state) => {
      return state.conversationsList
    },
    getSelectedConversationId: (state) => {
      return state.selectedConversationId || getFromLocal("selectedConversationId")
    }
  }
}

export default chat
