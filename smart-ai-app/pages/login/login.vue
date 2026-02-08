<template>
  <view class="login-container">
    <!-- 顶部标题 -->
    <BaseNavBar
      title="密码登录"
      :auto-back="false"
      @back="handleBack"
    />

    <view class="content">
      <!-- 欢迎文案 -->
      <view class="welcome">
        <text class="welcome-text">
          您好，
        </text>
        <text class="welcome-text bold">
          欢迎使用 SmartAI
        </text>
      </view>

      <!-- 表单区域 -->
      <view class="form">
        <input
          v-model="phone"
          class="input"
          type="number"
          maxlength="11"
          placeholder="请输入用户名"
        >

        <input
          v-model="password"
          class="input"
          type="password"
          placeholder="请输入密码"
        >

        <button
          class="login-btn"
          :class="{ disabled: !canSubmit }"
          @click="handleLogin"
        >
          登录
        </button>

        <!-- 切换登录方式 -->
        <view
          class="switch"
          @click="toCodeLogin"
        >
          用验证码登录
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
	import {
		ref,
		computed
	} from 'vue'

	import {
		useUserStore
	} from '@/stores/user'

	import authApi from "@/api/auth.js"
	import BaseNavBar from "@/components/BaseNavBar.vue"

	const phone = ref('')
	const password = ref('')
	const userStore = useUserStore()

	/**
	 * 校验规则
	 */

	// 用户名（字母/数字/下划线 3~20）
	const usernameReg = /^[a-zA-Z0-9_]{3,20}$/

	// 邮箱
	const emailReg =
		/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

	const isValidUsername = computed(() => {
		const value = phone.value.trim()
		return usernameReg.test(value) || emailReg.test(value)
	})

	const isValidPassword = computed(() => {
		return password.value.length >= 6
	})

	// 是否允许提交
	const canSubmit = computed(() => {
		return isValidUsername.value && isValidPassword.value
	})

	function handleLogin() {
		if (!phone.value.trim()) {
			uni.showToast({
				title: '请输入用户名或邮箱',
				icon: 'none'
			})
			return
		}

		if (!isValidUsername.value) {
			uni.showToast({
				title: '用户名或邮箱格式不正确',
				icon: 'none'
			})
			return
		}

		if (!password.value) {
			uni.showToast({
				title: '请输入密码',
				icon: 'none'
			})
			return
		}

		if (!isValidPassword.value) {
			uni.showToast({
				title: '密码至少 6 位',
				icon: 'none'
			})
			return
		}

		uni.showLoading({
			title: '登录中...'
		})

		// #ifdef MP
		uni.login({
			provider: 'weixin',
			success: async (res) => {
				const {
					code
				} = res
				const result = await authApi.login({
					code
				})

				userStore.setToken(result.data.token)
				userStore.setUserInfo(result.data.user)
				setTimeout(() => {
					uni.hideLoading()
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})

					uni.reLaunch({
						url: '/pages/chat/chat'
					})
				}, 1000)
			}
		})
		// #endif
	}

	function toCodeLogin() {
		uni.navigateTo({
			url: '/pages/login/code-login'
		})
	}

	function handleBack() {
		uni.reLaunch({
			url: '/pages/chat/chat'
		})
	}
</script>


<style lang="scss">
	.login-container {
		height: 100vh;
		background: #fff;
	}

	.content {
		padding: 0 40rpx
	}

	.welcome {
		margin-top: 80rpx;
		margin-bottom: 80rpx;

		.welcome-text {
			display: block;
			font-size: 48rpx;
			line-height: 1.4;
		}

		.bold {
			font-weight: bold;
		}
	}

	.form {
		.input {
			height: 100rpx;
			border-bottom: 1rpx solid #eee;
			font-size: 32rpx;
			margin-bottom: 40rpx;
		}

		.login-btn {
			margin-top: 40rpx;
			height: 96rpx;
			line-height: 96rpx;
			background: #3b82f6;
			color: #fff;
			border-radius: 48rpx;
			font-size: 34rpx;

			&.disabled {
				background: #cbd5e1;
			}
		}
	}

	.switch {
		margin-top: 40rpx;
		color: #3b82f6;
		font-size: 28rpx;
	}
</style>