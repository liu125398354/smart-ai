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
                <div class="chat-content markdown-body" v-html="marked.parse(item.content)"></div>
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
                <div class="chat-marked markdown-body" v-html="marked.parse(item.content)"></div>
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

import { Marked, Renderer } from "marked"
import { markedHighlight } from "marked-highlight"
import "github-markdown-css/github-markdown.css"
import hljs from "highlight.js"
import "highlight.js/styles/atom-one-dark.css"

import katex from "katex"
import "katex/dist/katex.min.css"
import markedKatexExtension from "marked-katex-extension"

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

// const marked = new Marked(
//   markedHighlight({
//     langPrefix: "hljs language-",
//     gfm: true, // 启动类似于Github样式的Markdown语法
//     tables: true,
//     pedantic: false, // 只解析符合Markdwon定义的，不修正Markdown的错误
//     sanitize: false, // 原始输出，忽略HTML标签（关闭后，可直接渲染HTML标签）
//     highlight(code, lang) {
//       const language = hljs.getLanguage(lang) ? lang : "plaintext"
//       return hljs.highlight(code, { language }).value
//     }
//   })
// )

// const marked = new Marked()

// 1. 创建渲染器实例
const renderer = new Renderer()

// 自定义 KaTeX 选项
const katexOptions = {
  macros: {
    "\\RR": "\\mathbb{R}", // 自定义宏
    "\\abs": ["\\left| #1 \\right|", 1]
  },
  strict: false, // 宽松解析模式
  output: "htmlAndMathml" // 同时输出 HTML 和 MathML
}

renderer.code = (code, lang) => {
  if (lang === "math") {
    try {
      return katex.renderToString(code, {
        ...katexOptions,
        displayMode: true,
        throwOnError: false
      })
    } catch (e) {
      return `<div class="katex-error">${e.message}</div>`
    }
  }
  const validLang = hljs.getLanguage(lang) ? lang : "plaintext"
  const highlighted = hljs.highlight(code, { language: validLang }).value
  return `<pre><code class="hljs">${highlighted}</code></pre>`
}

// 处理行内数学公式 ($...$)
renderer.text = (text) => {
  const inlineRegex = /\$(.*?)\$/g
  return text.replace(inlineRegex, (_, math) => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: false
      })
    } catch (e) {
      return `<span class="katex-error">${math}</span>`
    }
  })
}

// 处理块级数学公式 ($$...$$)
renderer.html = (html) => {
  const blockRegex = /\$\$\s*([\s\S]*?)\s*\$\$/g
  return html.replace(blockRegex, (_, math) => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: true
      })
    } catch (e) {
      return `<div class="katex-error">${math}</div>`
    }
  })
}

// // 保存原始文本渲染器
// const originalTextRenderer = renderer.text.bind(renderer)
//
// // 2. 增强行内公式处理（处理导数等复杂公式）
// renderer.text = (text) => {
//   // 改进的正则表达式，正确处理导数符号和复杂公式
//   const inlineMathRegex = /(?<!\\)\$((?:\\\$|[^$])+?)\$(?!\$)/g
//
//   let output = ""
//   let lastIndex = 0
//   let match
//
//   while ((match = inlineMathRegex.exec(text)) !== null) {
//     // 添加正则匹配之前的文本
//     output += originalTextRenderer(text.slice(lastIndex, match.index))
//
//     try {
//       // 渲染数学公式（包括导数符号）
//       output += katex.renderToString(match[1].replace(/\\\$/g, "$"), {
//         ...katexOptions,
//         displayMode: false,
//         throwOnError: false
//       })
//     } catch (e) {
//       output += `<span class="katex-error">${match[0]}</span>`
//     }
//
//     lastIndex = match.index + match[0].length
//   }
//
//   // 添加剩余文本
//   output += originalTextRenderer(text.slice(lastIndex))
//
//   return output
// }
//
// // 3. 增强块级公式处理（处理矩阵和多行公式）
// renderer.paragraph = (text) => {
//   // 改进的正则表达式，正确处理多行矩阵
//   const blockMathRegex = /^\s*\$\$((.|\n)+?)\$\$\s*$/
//
//   const match = blockMathRegex.exec(text)
//   if (match) {
//     try {
//       return katex.renderToString(match[1].trim(), {
//         ...katexOptions,
//         displayMode: true,
//         throwOnError: false
//       })
//     } catch (e) {
//       return `<div class="katex-error">${match[0]}</div>`
//     }
//   }
//
//   // 处理段落中的行内公式
//   return `<p>${renderer.text(text)}</p>`
// }
//
// // 4. 添加自定义块级渲染器，确保矩阵正确识别
// renderer.html = (html) => {
//   // 处理可能被包裹在HTML标签中的公式
//   const blockMathRegex = /\$\$([\s\S]+?)\$\$/g
//   return html.replace(blockMathRegex, (_, math) => {
//     try {
//       return katex.renderToString(math.trim(), {
//         ...katexOptions,
//         displayMode: true,
//         throwOnError: false
//       })
//     } catch (e) {
//       return `<div class="katex-error">${math}</div>`
//     }
//   })
// }

const marked = new Marked({
  renderer,
  gfm: true,
  pedantic: false,
  sanitize: false,
  tables: true,
  breaks: false,
  smartLists: true,
  smartypants: false
})

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
  renderMath()
})

function renderMath() {
  nextTick(() => {
    const mathEelements = document.querySelectorAll(".math")
    mathEelements.forEach((element) => {
      console.log(element)
      katex.render(element.innerText, element)
    })
  })
}

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

  const response = await fetch("/api/qianfan/getQianFanMessage", {
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
  store.commit("setSelectedConversationId", null)
  // 每次开始新对话时，messageList数据都会清空，scroll就不会起作用，
  // 所以将scroll置空，以便接下来对话中可以不重复的重新初始化
  chatScroll.value = null
}

function selectConversation(id) {
  store.commit("setSelectedConversationId", id)
  if (!chatScroll.value) {
    initScroll()
  }
  scrollBottom()
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
      chatApi.delConversations(params).then((res) => {
        if (res.code === 0) {
          store.commit("delConversationsData", index)
          store.commit("delMessage", conversationId)
          scrollBottom()
          message.success(res.message)
        } else {
          message.error(res.message)
        }
      })
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
  isEnter.value = true
  isEdit.value = false
  let params = {
    userId: userId.value,
    conversationId: item.conversationId,
    newName: item.conversationName
  }
  chatApi.modifyConversationName(params).then((res) => {
    if (res.code === 0) {
      message.success(res.message)
    } else {
      message.error(res.message)
    }
  })
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
          .chat-marked
            padding 8px
            border-radius 5px
            font-size 14px
            background #d5e6cd
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
