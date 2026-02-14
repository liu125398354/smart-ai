<template>
  <view class="setting-container">
    <!-- 顶部标题 -->
    <BaseNavBar title="账户信息" />
    <view class="content">
      <button
        class="loginout-btn"
        @click="handleLogout"
      >
        退出登录
      </button>
    </view>
  </view>
</template>

<script setup>
	import BaseNavBar from "@/components/BaseNavBar.vue"
	import {
		useUserStore
	} from '@/stores/user'

	const userStore = useUserStore()

	function handleLogout() {
		userStore.clearUserInfo()
		uni.navigateTo({
			url: '/pages/PhoneLogin/PhoneLogin'
		})
	}
</script>

<style lang="scss">
	.setting-container {
		height: 100vh;
		background: #fff;
	}

	.content {
		padding: 0 40rpx;
	}

	.loginout-btn {
		margin-top: 40rpx;
		height: 96rpx;
		line-height: 96rpx;
		background: #f7f7f7;
		font-size: 32rpx;
	}
</style>