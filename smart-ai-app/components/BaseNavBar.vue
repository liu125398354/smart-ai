<template>
  <view
    class="nav-bar"
    :style="{
      paddingTop: statusBarHeight + 'px',
      height: navBarHeight + 'px'
    }"
  >
    <!-- 左 -->
    <view class="nav-left">
      <slot name="left">
        <uni-icons
          v-if="showBack"
          type="left"
          size="22"
          @click="handleBack"
        />
      </slot>
    </view>

    <!-- 中 -->
    <view class="nav-title">
      <slot>
        {{ title }}
      </slot>
    </view>
  </view>
</template>

<script setup>
	import {
		storeToRefs
	} from 'pinia'
	import {
		useSystemStore
	} from '@/stores/system'

	const props = defineProps({
		title: {
			type: String,
			default: ''
		},
		showBack: {
			type: Boolean,
			default: true
		},
		autoBack: {
			type: Boolean,
			default: true
		}, // 是否自动返回
		homePath: {
			type: String,
			default: '/pages/chat/chat'
		}
	})

	const emit = defineEmits(['back'])

	const systemStore = useSystemStore()
	const {
		statusBarHeight,
		navBarHeight
	} = storeToRefs(systemStore)

	function handleBack() {
		emit('back')
		if (!props.autoBack) return
		const pages = getCurrentPages()
		if (pages.length > 1) {
			uni.navigateBack()
		} else {
			uni.reLaunch({
				url: props.homePath
			})
		}
	}
</script>

<style scoped lang="scss">
	.nav-bar {
		width: 100%;
		display: flex;
		align-items: center;
		background: #fff;
		position: relative;
	}

	.nav-left {
		position: absolute;
		display: flex;
		align-items: center;
		margin-left: 18rpx;
	}

	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 32rpx;
		font-weight: 500;
	}
</style>