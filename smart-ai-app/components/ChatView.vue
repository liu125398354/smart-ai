<template>
  <scroll-view
    ref="scrollViewRef"
    scroll-y
    class="chat-scroll"
    :scroll-with-animation="true"
    :scroll-into-view="scrollIntoViewId"
  >
    <view class="chat-list">
      <view
        v-for="(item, index) in renderMessages"
        :key="item.createTime"
        :id="'msg-' + item.createTime"
        class="msg-row"
      >
        <MessageItem :item="item" @rendered="onItemRendered"/>
      </view>
    </view>
	<!-- 底部锚点元素 -->
	<view id="scroll-bottom-anchor" class="scroll-bottom-anchor"></view>
	<view v-if="loading" class="loading-overlay">
	  <view class="spinner"></view>
	  <view class="loading-text">加载中...</view>
	</view>
  </scroll-view>
  
</template>

<script setup>
import { ref, nextTick, watch, onMounted, getCurrentInstance } from 'vue'
import MessageItem from './MessageItem.vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  }
})

const scrollViewRef = ref(null)
const scrollIntoViewId = ref('')
const loading = ref(true)
const renderedCount = ref(0)
// 内部渲染消息列表
const renderMessages = ref([])

/**
 * 监听消息变化
 * 每次增加消息 → 自动滚动到最后一条
 */
watch(
  () => props.messages,
  async (val) => {
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
	
  },
  { deep: true }
)

function onItemRendered() {
  renderedCount.value++
  if (renderedCount.value === props.messages.length) {
    loading.value = false
	nextTick(() => {
		
	      // 延迟确保 DOM 更新完成
	      setTimeout(() => {
	        scrollToBottom()
	      }, 50)
	    })

  }
}

function scrollToBottom() {
  if (props.messages.length === 0) return
  
  // 使用锚点方式
  scrollIntoViewId.value = 'scroll-bottom-anchor'
  
  // 重置以便下次可以再次触发
  nextTick(() => {
    scrollIntoViewId.value = ''
  })
}
</script>

<style scoped>
.chat-scroll {
  height: calc(100vh - 80rpx); /* 上面预留你的 top-bar */
  box-sizing: border-box;
}

.chat-list {
  padding: 30rpx;
  box-sizing: border-box;
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
