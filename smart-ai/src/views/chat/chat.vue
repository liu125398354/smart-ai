<template>
  <div class="chat-container">
    <div class="chat-list">
      <div class="top-new">
        <a-button type="dashed" @click="createConversation">开启新对话</a-button>
      </div>
      <ul class="list">
        <li
          v-for="(item, index) in conversationsList"
          :key="index"
          class="conversation"
          :class="{ selected: item.conversationId === selectedConversationId }"
          @click="selectConversation(item.conversationId)"
        >
          <MessageOutlined />
          <div v-if="item.conversationId !== selectedConversationId || !isEdit" class="part-text">
            {{ item.conversationName }}
          </div>
          <a-input
            ref="nameInput"
            v-if="item.conversationId === selectedConversationId && isEdit"
            v-model:value="item.conversationName"
            @blur="inputBlur(index, item)"
            @pressEnter="inputEnter(index, item)"
          />
          <EditOutlined
            v-if="item.conversationId === selectedConversationId && !isEdit"
            @click.stop="editConversationName(index, item)"
          ></EditOutlined>
          <DeleteOutlined
            v-if="item.conversationId === selectedConversationId && !isEdit"
            @click="showDeleteConfirm(index, item.conversationId)"
          >
          </DeleteOutlined>
          <SaveOutlined
            v-if="item.conversationId === selectedConversationId && isEdit"
          ></SaveOutlined>
        </li>
      </ul>
    </div>
    <div class="chat-record">
      <div v-if="messageList.length === 0" class="no-message">
        你好，我是chatgpt，很高兴见到你！
      </div>
      <div v-else class="chat-wrapper">
        <ul class="chat-ul">
          <li class="chat-item" v-for="(item, index) in messageList" :key="index">
            <div class="chat-right" v-if="item.role === 'user'">
              <div>
                <span class="avatar my">我</span>
              </div>
              <div class="chat-right-content">
                <p class="chat-time chat-right-time">{{ parseTime(item.createTime) }}</p>
                <markdown-renderer class="chat-content" :content="item.content" />
                <div class="chat-copy">
                  <span class="copy" @click="copyText(item.content)"><CopyOutlined />复制</span>
                  <span @click="startSpeech(item.content)"><BellOutlined />朗读</span>
                </div>
              </div>
            </div>
            <div class="chat-left" v-else>
              <div>
                <span class="avatar">AI</span>
              </div>
              <div class="chat-left-content">
                <p class="chat-time">{{ parseTime(item.createTime) }}</p>
                <markdown-renderer class="chat-marked" :content="item.content" />
                <div class="chat-copy">
                  <span class="copy" @click="copyText(item.content)"><CopyOutlined />复制</span>
                  <span @click="startSpeech(item.content)"><BellOutlined />朗读</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div class="chat-bottom">
        <div class="chat-input">
          <a-textarea
            v-model:value="text"
            placeholder="请输入内容"
            :auto-size="{ minRows: 1, maxRows: 2 }"
            @keydown="handleKeyDown($event)"
          />
        </div>
        <div class="chat-send">
          <a-button :disabled="sendDisabled" type="primary" shape="round" @click="sendMessage">
            <template #icon>
              <SendOutlined />
            </template>
            发送
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue"
import { useStore } from "vuex"
import { parseTime } from "@/utils"

import BScroll from "better-scroll"
import {
  SendOutlined,
  CopyOutlined,
  BellOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons-vue"
import { createVNode } from "vue"
import { message, Modal } from "ant-design-vue"

import MarkdownRenderer from "@/components/MarkdownRenderer"
import { v4 as uuidv4 } from "uuid"
import chatApi from "@/api/chat"
import axios from "axios"

const store = useStore()
const chatScroll = ref(null)
const text = ref("")
const sendDisabled = ref(false)
const synthesis = ref(null)
let eventSource = null
let isEdit = ref(false)
let isEnter = ref(false)
let nameInput = ref(null)

let controller = new AbortController()
let signal = controller.signal

const messageList = computed(() => store.getters.getMessageData)
const conversationsList = computed(() => store.getters.getConversationsData)
const selectedConversationId = computed(() => store.getters.getSelectedConversationId)
const userId = computed(() => store.getters.getUserId)

onMounted(() => {
  store.commit("setUserId")
  store.commit("setMessage")
  initConversationsList()
  store.commit("setSelectedConversationId", selectedConversationId.value)
  initScroll()
  initSpeech()
  scrollToSelectedPosition()
})

function initConversationsList() {
  store.dispatch("getConversationsList")
}

function initScroll() {
  if (messageList.value.length === 0) {
    console.log("return")
    return
  }
  nextTick(() => {
    chatScroll.value = new BScroll(".chat-wrapper", {
      click: true,
      scrollY: true,
      pullUpLoad: {
        threshold: 10 // 在上拉到超过底部 20px 时，触发 pullingUp 事件
      },
      pullDownRefresh: {
        //开启下拉刷新
        stop: 30, //刷新时离顶部停留的距离
        threshold: 40 //设置下拉事件触发的距离
      },
      // scrollbar: {
      //   fade: false,
      //   interactive: true
      // },
      probeType: 3,
      mouseWheel: true
      // eventPassthrough: "vertical"
    })
    chatScroll.value.scrollTo(0, chatScroll.value.maxScrollY)
    chatScroll.value.refresh()
  })
}

function initSpeech() {
  if ("speechSynthesis" in window) {
    synthesis.value = new SpeechSynthesisUtterance()
    synthesis.value.onend = handleSpeechEnd()
  } else {
    message.error("抱歉，你的浏览器不支持文字转语音功能")
  }
}
// 滚动到列表选中的位置
function scrollToSelectedPosition() {
  setTimeout(() => {
    const targetElement = document.getElementsByClassName("selected")[0]
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth", // 平滑滚动
        block: "start" // 将目标元素对齐到视口顶部
      })
    }
  }, 100)
}

function handleKeyDown(event) {
  if (event.keyCode === 13) {
    event.preventDefault()
    this.sendMessage()
    return false
  }
}

async function sendMessage() {
  if (sendDisabled.value) {
    return
  }
  if (!text.value) {
    message.warning("请输入内容")
    return
  }
  sendDisabled.value = true
  let params = {
    conversationId: store.state.chat.selectedConversationId,
    userId: store.state.user.userId,
    role: "user",
    content: text.value,
    createTime: new Date().getTime()
  }
  text.value = ""
  // let config = {
  //   onDownloadProgress({ event }) {
  //     console.log("下载进度-->", event)
  //     store.commit("updateMessage", {
  //       uuid: uuid,
  //       message: event.target.responseText
  //     })
  //     scrollBottom()
  //   }
  // }
  // chatApi.sendQianFan(params, config).then((res) => {
  //   sendDisabled.value = false
  // })
  try {
    const response = await fetch("/api/qianfan/getQianFanMessage", {
      signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json" // 明确指定 JSON 格式
      },
      body: JSON.stringify(params)
    })

    // 从响应头中提取新的 dialogId
    const newDialogId = response.headers.get("X-Dialog-ID")
    if (newDialogId) {
      console.log("New dialog ID:", newDialogId)
      params.conversationId = newDialogId
      initConversationsList()
      store.commit("setSelectedConversationId", newDialogId)
    }
    store.commit("addMessage", params)
    if (!chatScroll.value) {
      initScroll()
    }
    scrollBottom()
    // 处理大模型返回出错的问题
    if (!response.ok) {
      message.error("服务器出现问题，稍后再试")
      sendDisabled.value = false
      return
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let done = false
    let totalMessage = ""

    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunk = decoder.decode(value, { stream: true })

      // 这里将 chunk 直接输出，并累加
      totalMessage += chunk
      // 将内容逐步更新到页面
      store.commit("updateMessage", {
        conversationId: params.conversationId,
        message: totalMessage
      })
      scrollBottom()
    }
    sendDisabled.value = false
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("请求被终止")
    } else {
      console.log("发生了其他错误")
    }
  }
  // let aaa = ""
  // if (eventSource) {
  //   eventSource.close()
  // }
  // eventSource = new EventSource("/api/qianfan/getQianFanMessage?content=" + params.content)
  // // 在连接成功时打印信息
  // eventSource.onopen = function() {
  //   console.log("SSE connection opened")
  // }
  // eventSource.onmessage = (e) => {
  //   const data = JSON.parse(e.data)
  //   aaa += data.text
  //   store.commit("updateMessage", {
  //     uuid: uuid,
  //     message: aaa
  //   })
  //   scrollBottom()
  // }
  // eventSource.onerror = (e) => {
  //   console.log("连接错误了！！！！")
  //   sendDisabled.value = false
  //   eventSource.close()  // 错误时关闭连接
  // }
  // eventSource.onclose = (e) => {
  //   console.log("关闭连接了！！！！")
  //   sendDisabled.value = false
  //   // 当连接关闭时，手动关闭 EventSource 防止重连
  //   eventSource.close()
  // }
}
// 创建新对话
function createConversation() {
  cancelRequest()
  store.commit("setSelectedConversationId", null)
  // 每次开始新对话时，messageList数据都会清空，scroll就不会起作用，
  // 所以将scroll置空，以便接下来对话中可以不重复的重新初始化
  chatScroll.value = null
}
// 选择对话
function selectConversation(id) {
  cancelRequest()
  store.commit("setSelectedConversationId", id)
  if (!chatScroll.value) {
    initScroll()
  }
  scrollBottom()
}

// 当用户切换对话时取消请求
function cancelRequest() {
  controller.abort()
  sendDisabled.value = false
  // 这里要创建新的 controller 实例，获取新的 signal，否则下一个请求发不出去了
  controller = new AbortController()
  signal = controller.signal
}

function scrollBottom() {
  nextTick(() => {
    chatScroll.value.refresh()
    chatScroll.value.scrollTo(0, chatScroll.value.maxScrollY)
  })
}

function showDeleteConfirm(index, conversationId) {
  Modal.confirm({
    title: "你确认要删除当前对话吗？",
    icon: createVNode(ExclamationCircleOutlined),
    content: "删除后，对话不可恢复",
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk() {
      let params = {
        userId: userId.value,
        conversationId: conversationId
      }
      chatApi
        .delConversations(params)
        .then((res) => {
          if (res.code === 0) {
            store.commit("delConversationsData", index)
            store.commit("delMessage", conversationId)
            scrollBottom()
            message.success(res.message)
          }
        })
        .catch((error) => {})
    },
    onCancel() {
      console.log("Cancel")
    }
  })
}

function editConversationName(index, item) {
  // 编辑对话名称时，需要将模式改为正在编辑的模式，且聚焦到当前的输入框，
  // 由于用ul li导致ref是一个数组，所以用nameInput.value[0]访问
  isEdit.value = true
  nextTick(() => {
    nameInput.value[0].focus()
  })
}

function inputBlur(index, item) {
  // 点击回车过后，失焦事件就不执行了，否则调用两次修改接口
  if (isEnter.value) {
    isEnter.value = false
    return
  }
  inputEnter(index, item)
}

function inputEnter(index, item) {
  if (!item.conversationName.trim()) {
    message.warning("请输入对话名称")
    return
  }
  isEnter.value = true
  isEdit.value = false
  let params = {
    userId: userId.value,
    conversationId: item.conversationId,
    newName: item.conversationName
  }
  chatApi
    .modifyConversationName(params)
    .then((res) => {
      if (res.code === 0) {
        message.success(res.message)
      }
    })
    .catch((error) => {})
}

function copyText(text) {
  let input = document.createElement("textarea")
  input.setAttribute("readonly", "readonly")
  input.value = text
  document.body.appendChild(input)
  input.select()
  if (document.execCommand("copy")) {
    document.execCommand("copy")
    message.success("复制成功")
  }
  document.body.removeChild(input)
}

function startSpeech(text) {
  stopSpeech()
  synthesis.value.text = text
  window.speechSynthesis.speak(synthesis.value)
}

function handleSpeechEnd() {
  console.log("语音朗读结束")
}

function stopSpeech() {
  window.speechSynthesis.cancel()
}
</script>

<style scoped lang="stylus">
.chat-container
  position absolute
  top 60px
  bottom 15px
  left 15px
  right 15px
  overflow hidden
  display flex
  border 1px solid #ccc
  border-radius 5px
  .chat-list
    position relative
    flex  0 0 260px
    &::after
      content ""
      position absolute
      top 0
      right 0
      bottom 0
      width 1px
      background #efeff5
    .top-new
      text-align center
      margin 20px
    .list
      width 260px
      display flex
      flex-direction column
      gap 10px
      padding 0 20px
      height calc(100% - 72px)
      overflow-y auto
      .conversation
        display flex
        align-items center
        gap 10px
        padding 15px 10px
        border 1px solid #e5e7eb
        border-radius 5px
        cursor pointer
        &:hover
          background-color #f5f5f5
        &:first-child
          margin-top 15px
        &:last-child
          margin-bottom 15px
        .part-text
          flex 1
          overflow hidden
          white-space nowrap
          text-overflow ellipsis
      .selected
        border-color #1677ff
        background-color #f5f5f5
        color #1677ff
  .chat-record
    flex 1
    display flex
    flex-direction column
    overflow hidden // 必须设置聊天内容才能随窗口自适应
    //min-width 0
    .no-message
      flex 1
      display flex
      justify-content center
      align-items center
      font-size 20px
    .chat-wrapper
      flex 1
      overflow hidden
    .chat-ul
      padding 15px 15px 0px
    .chat-item
      &:hover .chat-right .chat-copy
        display block
      &:hover .chat-left .chat-copy
        display block
      .chat-right
        padding-bottom 30px
        display flex
        flex-direction row-reverse
        .chat-right-content
          position relative
          margin-right 10px
          min-width 0 // 适应内容宽度
          .chat-right-time
            text-align right
          .chat-content
            padding 8px
            border-radius 5px
            background #c6d3e6
            color rgba(0, 0, 0, 0.85)
            font-size 14px
        .chat-copy
          display none
          position absolute
          left 0
          bottom -22px
          cursor pointer
          color #b4bbc4
          font-size 12px
          .copy
            margin-right 10px
      .chat-left
        padding-bottom 30px
        display flex
        .chat-left-content
          position relative
          margin-left 10px
          min-width 0 // 适应内容宽度
        .chat-copy
          display none
          position absolute
          right 0
          bottom -22px
          cursor pointer
          color #b4bbc4
          font-size 12px
          .copy
            margin-right 10px
      .avatar
        display inline-block
        width 35px
        height 35px
        line-height 35px
        background #82bf64
        border-radius 50%
        color #fff
        text-align center
      .my
        background #7eafdd
      .chat-time
        margin-bottom 5px
        color #b4bbc4
      .chat-marked
        padding 8px
        border-radius 5px
        font-size 14px
        background #d5e6cd
    .chat-bottom
      display flex
      align-items center
      padding 20px 0
      .chat-input
        flex 1
        margin 0 15px
      .chat-send
        margin-right 15px
        display flex
        align-items center
</style>
