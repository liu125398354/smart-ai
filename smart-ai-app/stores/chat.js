/**
 * @Author: Liunannan
 * @Date: 2026/1/3 14:00
 * @Description:
 */

import { defineStore } from 'pinia'
import { saveToLocal, getFromLocal } from '@/utils'
import chatApi from '@/api/chat'

/**
 * 内存级解析缓存（不进 localStorage）
 * 只给 assistant 且非 chart 的消息解析
 */
function ensureParsedContent(message, towxml) {
  if (!message._parsedContent && message.content) {
    message._parsedContent = towxml(
      message.content
        // 块级公式 \[...\] → $$...$$
        .replace(/\\\[(.*?)\\\]/gs, (_, expr) => `$$${expr}$$`)
        // 行内公式 \(...\) → $...$
        .replace(/\\\((.*?)\\\)/gs, (_, expr) => `$${expr}$`),
      'markdown'
    )
  }
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    // key: conversationId
    // value: { conversationId, userId, messages: [...] }
    messageMap: {},

    chartsMessageList: [],
    conversationsList: [],
    selectedConversationId: null
  }),

  getters: {
    getMessageData: (state) => {
      const convId = state.selectedConversationId
      if (!convId || !state.messageMap[convId]) return []

      const messages = state.messageMap[convId].messages

      // 只在 getter 里统一做一次解析
      const app = getApp?.()
      const towxml = app?.$vm?.$towxml

      if (towxml) {
        messages.forEach((msg) => {
          if (msg.role === 'assistant' && !msg.isChart) {
            ensureParsedContent(msg, towxml)
          }
        })
      }

      return messages
    },

    getConversationsData: (state) => state.conversationsList,

    getSelectedConversationId: (state) =>
      state.selectedConversationId || getFromLocal('selectedConversationId')
  },

  actions: {
    /** 添加消息 */
    addMessage({ conversationId, userId, role, content, createTime }) {
      const newMsg = { role, content, createTime, userId }

      if (this.messageMap[conversationId]) {
        this.messageMap[conversationId].messages.push(newMsg)
      } else {
        this.messageMap[conversationId] = {
          conversationId,
          userId,
          messages: [newMsg]
        }
      }

      this._saveToStorage()
    },

    /** 删除整个会话的消息 */
    delMessage(conversationId) {
      delete this.messageMap[conversationId]
      this._saveToStorage()
    },

    /** 重命名会话 */
    renameConversation(currentIndex, name) {
      if (this.conversationsList[currentIndex]) {
        this.conversationsList[currentIndex].conversationName = name
      }
    },

    setConversationsData(data) {
      this.conversationsList = data
    },

    /** 删除会话 */
    delConversationsData(index) {
      const convId = this.conversationsList[index]?.conversationId
      this.conversationsList.splice(index, 1)

      if (convId) delete this.messageMap[convId]

      if (this.conversationsList.length === 0) {
        this.selectedConversationId = null
      } else if (index === this.conversationsList.length) {
        this.selectedConversationId =
          this.conversationsList[index - 1].conversationId
      } else {
        this.selectedConversationId =
          this.conversationsList[index].conversationId
      }

      saveToLocal('selectedConversationId', this.selectedConversationId)
      this._saveToStorage()
    },

    /** 流式更新消息 */
    updateMessage({ conversationId, message }) {
      const conv = this.messageMap[conversationId]
      if (!conv || conv.messages.length === 0) return

      const messages = conv.messages
      const lastIndex = messages.length - 1

      if (messages[lastIndex].role === 'user') {
        messages.push({
          role: 'assistant',
          content: message,
          createTime: Date.now(),
          userId: conv.userId
        })
      } else {
        messages[lastIndex].content = message
        // 内容变了 → 清掉解析缓存
        delete messages[lastIndex]._parsedContent
      }

      this._saveToStorage()
    },

    /** AI 回复转图表 */
    convertLastAssistantToChart({ conversationId, chartPayload }) {
      const conv = this.messageMap[conversationId]
      if (!conv || conv.messages.length === 0) return

      const last = conv.messages[conv.messages.length - 1]
      if (last.role === 'assistant') {
        last.isChart = true
        last.chartPayload = chartPayload
        last.content = ''
        delete last._parsedContent
        last.createTime = Date.now()
      }

      this._saveToStorage()
    },

    /** 初始化 / 设置全部消息 */
    setMessage(messages) {
      const map = {}

      const source =
        Array.isArray(messages) && messages.length > 0
          ? messages
          : getFromLocal('chatMessage') || []

      source.forEach((item) => {
        map[item.conversationId] = {
          conversationId: item.conversationId,
          userId: item.userId,
          messages: item.messages || []
        }
      })

      this.messageMap = map
      this._saveToStorage()
    },

    setSelectedConversationId(id) {
      this.selectedConversationId = id
      saveToLocal('selectedConversationId', id)
    },

    async getConversationsList({ userId }) {
      try {
        const response = await chatApi.getConversations({ userId })
        this.setConversationsData(response)
        return response
      } catch (error) {
        console.error('获取对话列表失败:', error)
        return Promise.reject(error)
      }
    },

    async getChatMessages({ userId }) {
      if (Object.keys(this.messageMap).length > 0) return

      try {
        const response = await chatApi.getChatMessagesByUser({ userId })
        this.setMessage(response.data)
        return response
      } catch (error) {
        console.error('获取聊天消息失败:', error)
        return Promise.reject(error)
      }
    },

    /** 统一落盘（不保存 _parsedContent） */
    _saveToStorage() {
      const pureData = Object.values(this.messageMap).map((conv) => ({
        ...conv,
        messages: conv.messages.map(({ _parsedContent, ...rest }) => rest)
      }))

      saveToLocal('chatMessage', pureData)
    }
  }
})
