/**
 * @Author: Liunannan
 * @Date: 2026/1/3 14:00
 * @Description:
 */

import { defineStore } from 'pinia'
import { saveToLocal, getFromLocal } from '@/utils'
import chatApi from '@/api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messageList: [],
    chartsMessageList: [],
    conversationsList: [],
    selectedConversationId: null
  }),

  getters: {
    getMessageData: (state) => {
      let data =
        (state.messageList.length > 0 ? state.messageList : '') || getFromLocal('chatMessage')
      if (data) {
        const index = data.findIndex((item) => item.conversationId === state.selectedConversationId)
        return index > -1 ? data[index].messages : []
      } else {
        return state.messageList
      }
    },
    getConversationsData: (state) => {
      return state.conversationsList
    },
    getSelectedConversationId: (state) => {
      return state.selectedConversationId || getFromLocal('selectedConversationId')
    }
  },

  actions: {
    addMessage(params) {
      const { conversationId, userId, role, content, createTime } = params
      const index = this.messageList.findIndex((item) => item.conversationId === conversationId)
      if (index > -1) {
        this.messageList[index].messages.push({
          role: role,
          content: content,
          createTime: createTime
        })
      } else {
        this.messageList.push({
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
      saveToLocal('chatMessage', this.messageList)
    },

    delMessage(conversationId) {
      const index = this.messageList.findIndex((item) => item.conversationId === conversationId)
      if (index > -1) {
        this.messageList.splice(index, 1)
        saveToLocal('chatMessage', this.messageList)
      }
    },
    setConversationsData(data) {
      this.conversationsList = data
    },

    delConversationsData(index) {
      this.conversationsList.splice(index, 1)
      if (this.conversationsList.length === 0) {
        this.selectedConversationId = null
      } else if (index === this.conversationsList.length) {
        this.selectedConversationId = this.conversationsList[index - 1].conversationId
      } else {
        this.selectedConversationId = this.conversationsList[index].conversationId
      }
      saveToLocal('selectedConversationId', this.selectedConversationId)
    },

    updateMessage(params) {
      const { conversationId, message } = params
      const index = this.messageList.findIndex((item) => item.conversationId === conversationId)
      let messages = this.messageList[index].messages
      const lastIndex = messages.length - 1
      if (messages[lastIndex].role === 'user') {
        messages.push({
          role: 'assistant',
          content: message,
          createTime: new Date().getTime()
        })
      } else {
        messages[lastIndex].content = message
      }
      saveToLocal('chatMessage', this.messageList)
    },

    convertLastAssistantToChart(params) {
      const { conversationId, chartPayload } = params
      const index = this.messageList.findIndex((item) => item.conversationId === conversationId)
      if (index === -1) return
      const messages = this.messageList[index].messages
      const lastIndex = messages.length - 1
      if (lastIndex < 0) return
      const last = messages[lastIndex]
      if (last.role === 'assistant') {
        last.isChart = true
        last.chartPayload = chartPayload
        last.content = '' // 由渲染器负责显示
        last.createTime = new Date().getTime()
        saveToLocal('chatMessage', this.messageList)
      }
    },
    setMessage(message) {
      if (Array.isArray(message) && message.length > 0) {
        saveToLocal('chatMessage', message)
        this.messageList = message
      } else {
        let data = getFromLocal('chatMessage')
        if (data) {
          this.messageList = data
        }
      }
    },
    setSelectedConversationId(id) {
      this.selectedConversationId = id
      saveToLocal('selectedConversationId', id)
    },

    async getConversationsList({ userId }) {
      try {
        const response = await chatApi.getConversations({ userId })
        this.setConversationsData(response) // 请求成功后将数据存储到state中
        return Promise.resolve(response)
      } catch (error) {
        console.error('获取对话列表失败:', error) // 请求失败时处理错误
        return Promise.reject(error)
      }
    },

    async getChatMessages({ userId }) {
      let messageList = this.messageList
      if (Array.isArray(messageList) && messageList.length > 0) {
        return
      }
      // 如果本地storage被删除，则从后台获取所有对话内容
      try {
        const response = await chatApi.getChatMessagesByUser({
          userId
        })
        this.setMessage(response.data) // 存储数据到state中
        return Promise.resolve(response)
      } catch (error) {
        console.error('获取聊天消息失败:', error) // 处理错误
        return Promise.reject(error)
      }
    }
  }
})
