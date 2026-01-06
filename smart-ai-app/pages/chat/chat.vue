<template>
  <view class="container">
    
    <!-- 左侧侧栏 -->
	<view
	  class="sidebar"
	  :style="{ transform: `translateX(${sidebarTranslateX}px)` }"
	  data-area="sidebar"
	  @touchstart="onTouchStart"
	  @touchmove="onTouchMove"
	  @touchend="onTouchEnd"
	>
	  <!-- 滚动列表 -->
	  <scroll-view class="conversations-list" scroll-y>
		<view v-for="(item, index) in conversationsList" 
			:key="item.Id" 
			class="item" 
			:class="{ selected: item.conversationId === selectedConversationId }" 
			@longpress="onLongPressList(index, item.conversationId)"
			@click="selectConversation(item.conversationId)">
				{{ item.conversationName }}
		</view>
	  </scroll-view>

	  <!-- 底部固定信息区 -->
	  <view class="sidebar-bottom">
		<view class="user-info">用户名</view>
		<view class="settings">⚙️</view>
	  </view>
	</view>

    <!-- 主区域 -->
    <view
      class="main"
      :style="{ transform: `translateX(${mainTranslateX}px)` }"
      data-area="main"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @click="handleMainClick"
    >

      <!-- 顶部栏 -->
      <view class="top-bar" :style="{ paddingTop: statusBarHeight + 'px', height: navBarHeight + 'px' }">
        <!-- 注意：这里 .stop 以防按钮点击冒泡触发主区的点击关闭 -->
         <!-- 左侧按钮容器 -->
		<view class="left-buttons">
		  <view class="top-left-btn" @click.stop="toggleSidebar">☰</view>
		  <view class="top-right-btn">＋</view>
		</view>
        <view class="top-title">新对话</view>
      </view>

      <ChatView :messages="messageList"></ChatView>
    </view>

  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import chatApi from "@/api/chat"
import ChatView from "@/components/ChatView.vue"

import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'

const chatStore = useChatStore()
const userStore = useUserStore()

const statusBarHeight = ref(0) // 状态栏高度
const navBarHeight = ref(44) // 导航栏默认高度，单位px
const capsuleTop = ref(0) // 胶囊上边界距顶部距离

// sidebarWidth 改成屏幕宽度 * 0.7（70vw）
const sidebarWidth = uni.getWindowInfo().windowWidth * 0.7

const sidebarOpen = ref(false)

// 动画跟随值（保持原来命名）
// 注意：sidebarWidth 已经是 px 单位，这里直接使用
const mainTranslateX = ref(0)
const sidebarTranslateX = ref(-sidebarWidth)

/* 触摸状态变量 */
let startX = 0
let currentX = 0
let startTime = 0
let dragging = false  // 是否正在拖动

// 新增：记录本次触摸起始区域：'main' 或 'sidebar'
let touchArea = null


const messageList = computed(() => chatStore.getMessageData)
const conversationsList = computed(() => chatStore.getConversationsData)
const selectedConversationId = computed(() => chatStore.getSelectedConversationId)
const userId = computed(() => userStore.getUserId)
const token = computed(() => userStore.getToken)


onMounted(async () => {
	const systemInfo = uni.getSystemInfoSync()
	  statusBarHeight.value = systemInfo.statusBarHeight // 获取状态栏高度
	
	  // 注意：getMenuButtonBoundingClientRect 在微信小程序中可用
	  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
	  if (menuButtonInfo) {
	    // 计算导航栏高度 = 胶囊高度 + (胶囊距顶距离 - 状态栏高度) * 2
	    navBarHeight.value = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight.value) * 2
	    capsuleTop.value = menuButtonInfo.top // 用于后续标题垂直居中计算
	  }
	chatStore.setMessage()
	try {
	    await initConversationsList()
	    await initChatMessages()
	    // chatStore.setSelectedConversationId(selectedConversationId.value)
	  } catch (error) {
	    console.error('加载列表失败:', error)
	  }
})

async function initConversationsList() {
	return chatStore.getConversationsList({ userId: userId.value })
}

function initChatMessages() {
  return chatStore.getChatMessages({ userId: userId.value })
}

async function selectConversation(conversationId) {
	chatStore.setSelectedConversationId(conversationId)
}

function onLongPressList(index, conversationId) {
	uni.showActionSheet({
		itemList: ['删除', '重命名'],
		success: (res) => {
		  switch (res.tapIndex) {
			case 0:
			  showDeleteConfirm(index, conversationId)
			  break
			case 1:
			  reNameConfirm(index, conversationId)
			  break
		  }
		},
		fail: (err) => {
		  console.log('取消选择', err)
		}
	  })
}

function showDeleteConfirm(index, conversationId) {
	uni.showModal({
	    title: '提示',
	    content: '删除后对话不可恢复，确认要删除吗？',
	    confirmText: '删除',
	    confirmColor: '#ff4d4f',
	    success: (res) => {
	      if (res.confirm) {
	        let params = {
				userId: userId.value,
				conversationId: conversationId
			}
			  chatApi
				.delConversations(params)
				.then((res) => {
				  if (res.code === 0) {
					chatStore.delConversationsData(index)
					chatStore.delMessage(conversationId)	
				  }
				})
				.catch(() => {})
	      }
	    }
	  })
}

function reNameConfirm(index, conversationId) {
	
}
 
/* 触摸事件 */

function onTouchStart(e) {
  dragging = true
  startX = e.touches[0].pageX
  currentX = startX
  startTime = Date.now()

  // 记录触摸起始区域（使用 dataset.area）
  // e.currentTarget.dataset.area 在 uni-app 中可用
  if (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.area) {
    touchArea = e.currentTarget.dataset.area
  } else {
    touchArea = null
  }
}

function onTouchMove(e) {
  if (!dragging) return
  currentX = e.touches[0].pageX

  let delta = currentX - startX

  /**
   * 关键修复逻辑：
   * - 如果触摸起始在 main 区：
   *     - 当侧栏关闭时，只响应向右滑（delta > 0）用于打开；delta < 0 时不响应（return）
   *     - 当侧栏打开时，只响应向左滑（delta < 0）用于关闭；delta > 0 时不响应（return）
   * - 如果触摸起始在 sidebar 区（侧栏）：
   *     - 只有当侧栏打开时才有效，并且只响应向左滑（delta < 0）用于关闭；delta > 0 时不响应（return）
   * - 其他情况（未识别区域）保持兼容原逻辑：按旧规则处理（减少风险）
   */

  if (touchArea === 'main') {
    if (!sidebarOpen.value && delta <= 0) {
      // 主区且侧栏关闭，向左滑无效（不响应）
      return
    }
    if (sidebarOpen.value && delta >= 0) {
      // 主区且侧栏打开，向右滑无效（不响应）
      return
    }
  } else if (touchArea === 'sidebar') {
    // 如果从侧栏开始触摸，只有在侧栏打开时才处理；并且只响应左滑关闭
    if (!sidebarOpen.value) {
      // 侧栏本来是关闭状态（通常侧栏不可见），忽略
      return
    }
    if (delta >= 0) {
      // 从侧栏起始且向右滑，不响应
      return
    }
  } else {
    // touchArea 为空（兼容情况），保持老逻辑的方向判断
    if (!sidebarOpen.value && delta < 0) return
    if (sidebarOpen.value && delta > 0) return
  }

  // 计算目标偏移（跟随手指移动）
  let offset = sidebarOpen.value
    ? sidebarWidth + delta   // 侧栏打开时左滑（delta<0）
    : delta                  // 侧栏关闭时右滑（delta>0）

  // 限制最大/最小值
  offset = Math.min(sidebarWidth, Math.max(0, offset))

  // 跟随移动
  mainTranslateX.value = Math.round(offset)
  sidebarTranslateX.value = Math.round(-(sidebarWidth - offset))
}

function onTouchEnd() {
  dragging = false

  const delta = currentX - startX
  const duration = Date.now() - startTime
  const velocity = delta / Math.max(1, duration)  // px/ms，避免除0

  // 快速滑动触发（轻轻一划也能开关）
  const fastSwipe = Math.abs(velocity) > 0.25

  // 阈值（超过 30% 则打开/关闭）
  const threshold = sidebarWidth * 0.3

  if (!sidebarOpen.value) {
    // 当前是关闭状态 → 尝试打开（只有当起始区域允许打开时才判断）
    // （起始区域 'main' 且向右滑，或 fastSwipe 向右）
    if ((touchArea === 'main' && delta > threshold) || (fastSwipe && delta > 0)) {
      openSidebar()
    } else {
      closeSidebar()
    }
  } else {
    // 当前是打开状态 → 尝试关闭（只有当起始区域允许关闭时才判断）
    // （起始区域 'main' 或 'sidebar' 且向左滑，或 fastSwipe 向左）
    if (((touchArea === 'main' || touchArea === 'sidebar') && delta < -threshold) || (fastSwipe && delta < 0)) {
      closeSidebar()
    } else {
      openSidebar()
    }
  }

  // 清除起始区域，防止下一次误判
  touchArea = null
}


function openSidebar() {
  sidebarOpen.value = true
  mainTranslateX.value = sidebarWidth
  sidebarTranslateX.value = 0
}

function closeSidebar() {
  sidebarOpen.value = false
  mainTranslateX.value = 0
  sidebarTranslateX.value = -sidebarWidth
}

// 切换开关（按钮使用）
function toggleSidebar() {
  sidebarOpen.value ? closeSidebar() : openSidebar()
}

// 点击主区域关闭侧栏
function handleMainClick() {
  if (sidebarOpen.value) closeSidebar()
}
</script>

<style lang="scss">
.container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 左侧侧栏 */
.sidebar {
  width: 70vw;
  height: 100vh;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  transition: transform .25s cubic-bezier(.25,.8,.25,1);
  display: flex;
  flex-direction: column;
  border-right: 1rpx solid #ccc;
}

/* 滚动列表，占满顶部到底部区域 */
.conversations-list {
  flex: 1;
  padding-top: 20rpx;
  overflow: hidden;
}

/* 每行单行显示，多余用省略号 */
.item {
  height: 70rpx;
  line-height: 70rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 50rpx;
  margin-bottom: 30rpx;
  margin-left: 20rpx;
  margin-right: 20rpx;
}

.selected {
	background-color: #eee;
	border-radius: 20rpx;
}

/* 底部固定区域 */
.sidebar-bottom {
  height: 100rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15rpx;
  border-top: 1rpx solid #ccc;
}

/* 用户信息 & 设置 */
.user-info {
  font-size: 28rpx;
}

.settings {
  font-size: 32rpx;
}

/* 主区域保持原样 */
.main {
  width: 100%;
  height: 100vh;
  position: absolute;
  left: 0;
  top: 0;
  transition: transform .25s cubic-bezier(.25,.8,.25,1);
}

.content {
  padding: 20rpx;
}

.top-bar {
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
  border-bottom: 1rpx solid #ccc;
}

.left-buttons {
  display: flex;
  align-items: center;
  /* 可以调整左侧间距 */
  margin-left: 16rpx;
}

.top-left-btn, .top-right-btn {
  /* 按钮样式 */
  font-size: 40rpx;
  margin-right: 20rpx;
}

.top-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 40rpx;
}
</style>