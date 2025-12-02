<template>
  <view class="msg-box">
    <view class="chat-right" v-if="item.role === 'user'">
		<view>
			<view class="avatar my">我</view>
		</view>
		<view class="chat-right-content">
			<view class="chat-time chat-right-time">{{ parseTime(item.timestamp) }}</view>
			<!-- <view class="chat-content">{{ item.content }}</view> -->
			<view class="chat-content">
				<towxml :nodes="parsedContent" />
			</view>
		</view>
	</view>
	<view class="chat-left" v-else>
		<view>
		  <view class="avatar">AI</view>
		</view>
		<view class="chat-left-content">
			<view class="chat-time">{{ parseTime(item.timestamp) }}</view>
			<view v-if="item.isChart && item.chartPayload">
				图表渲染
			</view>
			<view v-else class="chat-marked">
				<towxml :nodes="parsedContent" />
				<!-- <view class="chat-marked">{{ item.content }}</view> -->
			</view>
		</view>
	</view>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'
import { parseTime } from '@/utils'
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

// 获取 Vue 实例上下文，以访问挂载的全局属性
const { proxy } = getCurrentInstance()

const parsedContent = computed(() => {
  const result = proxy.$towxml(props.item.content
	  // 块级公式 \[...\] → $$...$$
      .replace(/\\\[(.*?)\\\]/gs, (_, expr) => `$$${expr}$$`)
      // 行内公式 \(...\) → $...$
      .replace(/\\\((.*?)\\\)/gs, (_, expr) => `$${expr}$`), 'markdown', {
			theme:'light',					// 主题，默认`light`
			events:{					// 为元素绑定的事件方法
				tap:(e)=>{
					console.log('tap',e);
				}
			}
		})
  return result
})
</script>

<style lang="scss">
	@import '/wxcomponents/towxml/style/main.wxss';
.msg-box {
  padding: 0 10rpx;
  line-height: 1.6;
}

.chat-right {
	padding-bottom: 30rpx;
	display: flex;
	flex-direction: row-reverse;
	.chat-right-content {
		position: relative;
		margin-right: 10rpx;
		min-width: 0;
		.chat-right-time {
			text-align: right;
		}
		.chat-content {
			padding: 15rpx 30rpx;
			border-radius: 30rpx;
			background: #c6d3e6;
			color: #fff;
			font-size: 30rpx;
		}         
	}
}

.chat-left {
	padding-bottom: 30rpx;
	display: flex;
	.chat-left-content {
		position: relative;
		margin-left: 10rpx;
		min-width: 0; // 适应内容宽度
		flex: 1;
	}
}
    
.avatar {
	display: inline-block;
	width: 70rpx;
	height: 70rpx;
	line-height: 70rpx;
	background: #82bf64;
	border-radius: 50%;
	color: #fff;
	text-align: center;
}
        
.my {
  background: #7eafdd;
}
        
.chat-time {
  margin-bottom: 5rpx;
  color: #ccc;
}

.chat-marked {
  padding: 8rpx;
  border-radius: 5rpx;
  font-size: 30rpx;
}        
</style>
