<template>
  <div class="chat-container">
    <div class="chat-list" :class="{ 'list-hide': listShow === false }">
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
          <div
            v-if="item.conversationId !== selectedConversationId || !isEdit"
            class="part-text"
            v-ellipsis-title
          >
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
      <div class="toggle-container">
        <LeftOutlined v-if="listShow" class="toggle-btn" @click="toggleBtn('left')"/>
        <RightOutlined v-else class="toggle-btn" @click="toggleBtn('right')"/>
      </div>
      <div class="chat-agent">
        <a-button type="default" @click="toggleChartAgent">{{
          showChartAgent ? "关闭图表智能体" : "开启图表智能体"
        }}</a-button>
        <span v-if="showChartAgent" style="color: #999">已开启：直接用自然语言描述要画的图表</span>
      </div>
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
                <mermaid-renderer class="chat-content" :content="item.content" />
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
                <template v-if="item.isChart && item.chartPayload">
                  <chart-renderer
                    :type="item.chartPayload.type"
                    :options="item.chartPayload.options"
                    height="520px"
                    :initialWidth="720"
                  />
                </template>
                <template v-else>
                  <mermaid-renderer class="chat-marked" :content="item.content" />
                </template>
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
import { BASE_URL } from "@/config/apiConfig"

import BScroll from "better-scroll"
import {
  SendOutlined,
  CopyOutlined,
  BellOutlined,
  MessageOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons-vue"
import { createVNode } from "vue"
import { message, Modal } from "ant-design-vue"

// import MarkdownRenderer from "@/components/MarkdownRenderer"
import MermaidRenderer from "@/components/MermaidRenderer"
import ChartRenderer from "@/components/ChartRenderer.vue"
import { v4 as uuidv4 } from "uuid"
import chatApi from "@/api/chat"
import axios from "axios"

const store = useStore()
const chatScroll = ref(null)
const text = ref("")
const sendDisabled = ref(false)
const synthesis = ref(null)
const showChartAgent = ref(false)
let listShow = ref(true)
let eventSource = null
let isEdit = ref(false)
let isEnter = ref(false)
let nameInput = ref(null)
let currentName = ref("")
let lastHeight = ref(0) // 记录滚动视口高度
let lastScrollTime = ref(0) // 记录时间
const throttleInterval = ref(200) // 每 50ms 最多执行一次
let debounceTimer = ref(null) // 防抖

let controller = new AbortController()
let signal = controller.signal

const messageList = computed(() => store.getters.getMessageData)
const conversationsList = computed(() => store.getters.getConversationsData)
const selectedConversationId = computed(() => store.getters.getSelectedConversationId)
const userId = computed(() => store.getters.getUserId)
const token = computed(() => store.getters.getToken)

onMounted(async () => {
  store.commit("setMessage")
  try {
    await initConversationsList()
    await initChatMessages()
    store.commit("setSelectedConversationId", selectedConversationId.value)
    await scrollToSelectedPosition() // 数据列表加载选中后，再滚动
    store.commit("setEnableEllipsisObserver", true) // 设置初始化是否滚动完成的标志
  } catch (error) {
    console.error("加载列表失败:", error)
  }
  initScroll()
  initSpeech()
})

function initConversationsList() {
  return store.dispatch("getConversationsList")
}

function initChatMessages() {
  return store.dispatch("getChatMessages")
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
    // chatScroll.value.scrollTo(0, chatScroll.value.maxScrollY)
    // chatScroll.value.refresh()
    scrollBottom()
  })
}

function toggleChartAgent() {
  showChartAgent.value = !showChartAgent.value
}

function initSpeech() {
  if ("speechSynthesis" in window) {
    synthesis.value = new SpeechSynthesisUtterance()
    synthesis.value.onend = handleSpeechEnd()
  } else {
    message.error("抱歉，你的浏览器不支持文字转语音功能")
  }
}

// 尝试从包含多余文本的字符串中提取第一个合法的 JSON 对象（需包含 type 与 options）
function extractChartJson(text) {
  if (!text) return null
  // 去掉 ```json/``` 包裹
  let s = text.trim()
  if (s.startsWith("```") && s.endsWith("```")) {
    s = s.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "")
  }
  // 快速命中：整个就是 JSON
  try {
    const obj = JSON.parse(s)
    if (obj && obj.type && obj.options) return obj
  } catch (e) {}
  // 正则扫描第一个大括号对象片段
  const candidates = []
  const stack = []
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === "{") stack.push(i)
    else if (ch === "}" && stack.length) {
      const start = stack.pop()
      if (stack.length === 0) {
        candidates.push(s.substring(start, i + 1))
        if (candidates.length >= 3) break // 最多尝试前三个
      }
    }
  }
  for (const part of candidates) {
    try {
      const obj = JSON.parse(part)
      if (obj && obj.type && obj.options) return obj
    } catch (e) {}
  }
  return null
}

// 滚动到列表选中的位置
function scrollToSelectedPosition() {
  return new Promise((resolve) => {
    // 等待 DOM 渲染完成（例如 v-for 的 li 全部出来）
    setTimeout(() => {
      const target = document.querySelector(".selected")
      if (target) {
        target.scrollIntoView({
          behavior: "smooth", // 平滑滚动
          block: "start" // 将目标元素对齐到视口顶部
        })
      }
      // 平滑滚动是异步动画，这里延迟一点点等待动画结束
      // 包含缓冲时间，确保滚动完全稳定
      setTimeout(resolve, 500)
    }, 100)
  })
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
    userId: userId.value,
    role: "user",
    content: text.value,
    createTime: new Date().getTime()
  }
  // 开启图表智能体则传标志，让后端切换到图表模式
  if (showChartAgent.value) {
    params.chartAgent = true
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
    const response = await fetch(`${BASE_URL}/qianfan/getQianFanMessage`, {
      signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json", // 明确指定 JSON 格式
        Authorization: token.value ? `Bearer ${token.value}` : ""
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
    scrollToBottomThrottle()
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
      scrollToBottomThrottle()
    }
    // 如果是图表智能体，尝试解析模型的最终 JSON，并把最后一条 AI 文本替换为图表渲染
    if (showChartAgent.value) {
      try {
        const payload = extractChartJson(totalMessage)
        if (payload && payload.type && payload.options) {
          store.commit("convertLastAssistantToChart", {
            conversationId: params.conversationId,
            chartPayload: payload
          })
          // 等消息节点渲染后，触发一次全局 resize，保证 ECharts 以正确宽度渲染
          nextTick(() => {
            requestAnimationFrame(() => {
              try {
                window.dispatchEvent(new Event("resize"))
              } catch (e) {}
            })
          })
        }
      } catch (e) {
        console.warn("未能解析为图表配置，将保留文本输出", e)
      }
    }
    sendDisabled.value = false
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("请求被终止")
    } else {
      console.log("发生了其他错误", error)
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

// 防抖 + 节流
function scrollToBottomThrottle() {
  // 节流部分：消息不断到达时，每隔 50ms 节流刷新一次滚动，保持实时跟随
  const now = Date.now()
  if (now - lastScrollTime.value >= throttleInterval.value) {
    lastScrollTime.value = now
    // 执行刷新和滚动操作
    nextTick(() => {
      chatScroll.value.refresh()
      chatScroll.value.scrollTo(0, chatScroll.value.maxScrollY)
    })
  }

  // 防抖部分：消息停止后，300ms 内无新消息 → 防抖触发最后一次滚动，确保滚到最底
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    nextTick(() => {
      chatScroll.value.refresh()
      chatScroll.value.scrollTo(0, chatScroll.value.maxScrollY)
    })
  }, 300) // 消息流停止 300ms 后再执行
}

// 轮询计算高度，直到高度不再变化时，才去滚动到最底部
function scrollBottom() {
  nextTick(() => {
    const content = document.querySelector(".chat-wrapper")
    const height = content.scrollHeight
    if (height !== lastHeight.value) {
      lastHeight.value = height
      setTimeout(scrollBottom, 50)
    } else {
      chatScroll.value.refresh()
      chatScroll.value.scrollTo(0, chatScroll.value.maxScrollY)
    }
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
  currentName.value = item.conversationName
  isEdit.value = true
  nextTick(() => {
    nameInput.value[0].focus()
  })
}

function inputBlur(index, item) {
  /**
   * 此处需要单独特殊处理：
   * 1、失焦过后，如果名称还是空的话，那就相当于默认没有做任何修改
   * 2、原因：这里不能像按回车一样给出"请输入对话名称"的提示，因为无论是点击切换到其他对话而失的焦
   * 还是点击到其他任何地方而失的焦，都不能让对话名称为空(否则页面看起来不符合用户需求)
   * */
  if (!item.conversationName.trim()) {
    item.conversationName = currentName.value
    isEdit.value = false
    return
  }
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
  // 对话名称没有任何修改，则取消编辑的状态并返回，且不用发起请求
  if (item.conversationName === currentName.value) {
    isEdit.value = false
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

function toggleBtn(direction) {
  listShow.value = direction !== "left"
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
  .list-hide
    flex 0 0 0 !important
    width 0 !important
    transform translateX(-260px)
    transition-duration 0.3s
  .chat-list
    position relative
    flex  0 0 260px
    width 260px
    transition-duration 0.3s
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
    position relative
    flex 1
    display flex
    flex-direction column
    //overflow hidden // 必须设置聊天内容才能随窗口自适应
    //min-width 0
    .toggle-container
      position absolute
      left 0
      top 50%
      width 24px
      height 24px
      transform translate(-50%, -50%)
      background #ffffff
      border 1px solid rgb(239, 239, 245)
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .06)
      border-radius 50%
      cursor pointer
      z-index 1
      .toggle-btn
        display inline-block
        width 24px
        height 24px
        line-height 24px
        text-align center
        color #b4bbc4
    .chat-agent
      padding 10px
      border-bottom 1px solid #efeff5
      display flex
      gap 10px
      align-items center
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
          flex 1
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
