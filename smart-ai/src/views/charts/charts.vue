<template>
  <div class="chat-wrapper">
    <ul class="chat-ul">
      <li class="chat-item" v-for="(item, index) in chartMessageList" :key="index">
        <div class="chat-right" v-if="item.role === 'user'">
          <div>
            <span class="avatar my">我</span>
          </div>
          <div class="chat-right-content">
            <p class="chat-time chat-right-time">{{ parseTime(item.createTime) }}</p>
            <div class="chat-content markdown-body" v-html="marked.parse(item.content)"></div>
          </div>
        </div>
        <div class="chat-left" v-else>
          <div>
            <span class="avatar">AI</span>
          </div>
          <div class="chat-left-content">
            <p class="chat-time">{{ parseTime(item.createTime) }}</p>
            <!--            <div v-show="!item.end && sendDisabled">正在绘制中，请稍等...</div>-->
            <!--            <div class="chat-marked markdown-body" v-html="marked.parse(item.content)"></div>-->
            <e-chart class="chat-marked" :code-message="item"></e-chart>
          </div>
        </div>
      </li>
    </ul>
  </div>
  <div class="chat-bottom">
    <div class="chat-input">
      <a-textarea
        v-model:value="text"
        placeholder="请输入绘制图表的相关信息"
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
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue"
import { useStore } from "vuex"
import { parseTime } from "@/utils"

import BScroll from "better-scroll"
import { SendOutlined } from "@ant-design/icons-vue"
import { message } from "ant-design-vue"

import { Marked } from "marked"
import { markedHighlight } from "marked-highlight"
import "github-markdown-css/github-markdown.css"
import hljs from "highlight.js"
import "highlight.js/styles/atom-one-dark.css"

import { v4 as uuidv4 } from "uuid"
import chatApi from "@/api/chat"
import EChart from "@/components/EChart"

const store = useStore()
const chatScroll = ref(null)
const text = ref("")
const sendDisabled = ref(false)

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    gfm: true, // 启动类似于Github样式的Markdown语法
    tables: true,
    pedantic: false, // 只解析符合Markdwon定义的，不修正Markdown的错误
    sanitize: false, // 原始输出，忽略HTML标签（关闭后，可直接渲染HTML标签）
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext"
      return hljs.highlight(code, { language }).value
    }
  })
)

const chartMessageList = computed(() => store.getters.getChartsMessageData)

onMounted(() => {
  store.commit("setUserId")
  store.commit("setChartsMessage")
  initScroll()
})

function initScroll() {
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
      // eventPassthrough: 'vertical'
    })
    chatScroll.value.scrollTo(0, chatScroll.value.maxScrollY)
    chatScroll.value.refresh()
  })
}

function handleKeyDown(event) {
  if (event.keyCode === 13) {
    event.preventDefault()
    this.sendMessage()
    return false
  }
}

function sendMessage() {
  if (sendDisabled.value) {
    return
  }
  if (!text.value) {
    message.warning("请输入内容")
    return
  }
  let altText =
    text.value +
    "，鼠标放上去有提示信息，标明单位，标明图例，用javascript echarts绘制，返回完整的html文档代码"
  sendDisabled.value = true
  let params = {
    userId: store.state.user.userId,
    role: "user",
    content: altText,
    createTime: new Date().getTime()
  }
  let local = JSON.parse(JSON.stringify(params))
  local.content = text.value
  store.commit("addChartsMessage", local)
  text.value = ""
  scrollBottom()
  let uuid = uuidv4()
  let config = {
    onDownloadProgress({ event }) {
      store.commit("updateChartsMessage", {
        uuid: uuid,
        message: event.target.responseText,
        flag: false
      })
      scrollBottom()
    }
  }
  chatApi.sendMessage(params, config).then((res) => {
    store.commit("updateChartsMessage", {
      uuid: uuid,
      message: res,
      flag: true
    })
    scrollBottom()
    sendDisabled.value = false
  })
}

function scrollBottom() {
  nextTick(() => {
    chatScroll.value.refresh()
    chatScroll.value.scrollTo(0, chatScroll.value.maxScrollY)
  })
}
</script>

<style scoped lang="stylus">
.chat-wrapper
  position absolute
  top 50px
  bottom 70px
  width 100%
  overflow hidden
  padding 15px 0
.chat-ul
  margin 15px
.chat-item
  .chat-right
    margin-bottom 15px
    display flex
    flex-direction row-reverse
    .chat-right-content
      margin-right 10px
      .chat-right-time
        text-align right
      .chat-content
        padding 8px
        border-radius 5px
        background #c6d3e6
        color rgba(0, 0, 0, 0.85)
        font-size 14px
  .chat-left
    margin-bottom 15px
    display flex
    .chat-left-content
      flex 1
      margin-left 10px
      .chat-marked
        padding 8px
        border-radius 5px
        font-size 14px
        background #eef1f5
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
  position absolute
  bottom 10px
  width 100%
  display flex
  align-items center
  .chat-input
    flex 1
    margin 0 15px
  .chat-send
    margin-right 15px
    display flex
    align-items center
</style>
