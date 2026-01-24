<template>
  <scroll-view
    scroll-y
    class="chat-scroll"
    :scroll-with-animation="true"
    :scroll-top="scrollTop"
  >
    <view class="chat-list" :class="{ 'list-hidden': !loading }">
      <view
        v-for="(item, index) in renderMessages"
        :key="item.createTime"
        :id="'msg-' + item.createTime"
        class="msg-row"
      >
        <MessageItem :item="item" @rendered="onItemRendered"/>
      </view>
    </view>
	<view v-if="loading" class="loading-overlay">
	  <view class="spinner"></view>
	  <view class="loading-text">加载中...</view>
	</view>
  </scroll-view>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, getCurrentInstance } from 'vue'
import MessageItem from './MessageItem.vue'

const { proxy } = getCurrentInstance()
const emit = defineEmits(['ready'])

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  switching: {
      type: Boolean,
      default: false
    }
})

const scrollTop = ref(0)
const scrollIntoViewId = ref('')
const loading = ref(true)
const renderedCount = ref(0)
// 内部渲染消息列表
const renderMessages = ref([])


watch(
  () => props.messages,
  async (val) => {
	/**
	 * ① 切换会话
	 */
	
	if (props.switching) {
	  renderedCount.value = 0
	  loading.value = true
	  // 先清空旧列表
	  renderMessages.value = []
	  
	  if (!val || val.length === 0) {
	    loading.value = false
	    return
	  }
	  
	  // 等 Vue 清空 DOM 后再赋值新消息
	  await nextTick()
	  renderMessages.value = val
	  return
	}

	/**
	 * ② 流式 / 普通消息
	 * 不清空、不 loading
	 */
	renderMessages.value = val

	await nextTick()
	scrollToBottom()  
	
  },
  { deep: true }
)

function onItemRendered() {
  renderedCount.value++
  if (renderedCount.value === props.messages.length) {
	nextTick(() => {
		console.log("渲染完成0------》》》》？？？")
	  // 延迟确保 DOM 更新完成
	  setTimeout(() => {
		loading.value = false
		scrollToBottom()
		emit('ready')
	  }, 1000)
	})
  }
}

function scrollToBottom() {
  nextTick(() => {
		const query = uni.createSelectorQuery().in(proxy)
		query.select('.chat-scroll').boundingClientRect()
		query.select('.chat-list').boundingClientRect()
		query.exec(res => {
		  const scrollViewHeight = res[0].height
		  const scrollContentHeight = res[1].height
		  if (scrollContentHeight > scrollViewHeight) {
			scrollTop.value = scrollContentHeight - scrollViewHeight + 200
		  }
		  console.log("scroll---", scrollContentHeight, scrollViewHeight)
		})
	})
}
</script>

<style scoped>
.chat-scroll {
  height: 100%;
  box-sizing: border-box;
}

.chat-list {
  visibility: hidden;
  padding: 30rpx;
  box-sizing: border-box;
}

.list-hidden {
	visibility: visible;
}

/* 每条消息之间的距离 */
.msg-row {
  margin-bottom: 26rpx;
}

.scroll-bottom-anchor {
  height: 10rpx;
  width: 100%;
  visibility: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

/* 旋转动画 */
.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #ccc;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}
</style>
