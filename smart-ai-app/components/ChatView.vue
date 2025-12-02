<template>
  <scroll-view
    scroll-y
    class="chat-scroll"
    :scroll-with-animation="true"
    :scroll-into-view="scrollIntoView"
  >
    <view class="chat-list">
      <view
        v-for="item in messages"
        :key="item.id"
        :id="'msg-' + item.id"
        class="msg-row"
      >
        <MessageItem :item="item" />
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import MessageItem from './MessageItem.vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  }
})

/** 自动滚动定位 ID */
const scrollIntoView = ref('')

/**
 * 监听消息变化
 * 每次增加消息 → 自动滚动到最后一条
 */
watch(
  () => props.messages,
  (val) => {
    if (!val || val.length === 0) return
    const lastId = val[val.length - 1].id

    nextTick(() => {
      scrollIntoView.value = 'msg-' + lastId
    })
  },
  { deep: true }
)
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
</style>
