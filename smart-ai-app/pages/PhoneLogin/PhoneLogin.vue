<template>
  <view class="phone-container">
    <BaseNavBar
      :show-back="false"
      title="SmartAI"
      :auto-back="false"
      @back="handleBack"
    />
    <view class="login-area">
      <view class="top-content">
        <view class="center">
          <button
            class="btn phone-btn"
            open-type="getPhoneNumber"
            @getphonenumber="onGetPhoneNumber"
          >
            手机号一键登录
          </button>
          <button
            class="btn cancel-btn"
            @click="cancelBtn"
          >
            取消
          </button>
        </view>
      </view>
      <view class="bottom-content">
        <view
          class="pwd-login"
          @click="goPwdLogin"
        >
          密码登录
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
	import BaseNavBar from "@/components/BaseNavBar.vue"
	import authApi from "@/api/auth.js"
	import {
		useUserStore
	} from '@/stores/user'

	const userStore = useUserStore()

	const uniLogin = () => {
		return new Promise((resolve, reject) => {
			uni.login({
				provider: 'weixin',
				success: resolve,
				fail: reject
			})
		})
	}

	function handleBack() {
		uni.reLaunch({
			url: '/pages/chat/chat'
		})
	}

	function cancelBtn() {
		uni.reLaunch({
			url: '/pages/chat/chat'
		})
	}

	async function onGetPhoneNumber(e) {
		console.log(e)
		// #ifdef MP
		if (e.detail.errMsg !== 'getPhoneNumber:ok') {
			uni.showToast({
				title: '用户取消授权',
				icon: 'none'
			})
			return
		}
		try {
			const loginRes = await uniLogin()
			const loginCode = loginRes.code

			const phoneCode = e.detail.code

			uni.showLoading({
				title: '登录中...'
			})

			const result = await authApi.wxPhoneLogin({
				loginCode,
				phoneCode
			})

			if (result.success) {
				const {
					token,
					user
				} = result.data

				userStore.setToken(token)
				userStore.setUserInfo(user)
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
			} else {
				uni.showToast({
					title: result.message || '登录失败',
					icon: 'none'
				})
			}

		} catch (err) {
			console.error(err)
			uni.showToast({
				title: '服务器错误',
				icon: 'none'
			})
		}
		// #endif
	}

	function goPwdLogin() {
		uni.navigateTo({
			url: "/pages/login/login"
		})
	}
</script>

<style lang="scss">
	.phone-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #fff;
	}

	.login-area {
		padding: 0 50px;
		flex: 1;
		display: flex;
		flex-direction: column;
		letter-spacing: 5rpx;
	}

	.top-content {
		flex: 1;
		display: flex;
		align-items: center;
	}

	.center {
		flex: 1;
	}

	.btn {
		height: 96rpx;
		line-height: 96rpx;
		border-radius: 48rpx;
		font-size: 34rpx;
	}

	.phone-btn {
		background: #3b82f7;
		color: #fff;

		&::after {
			border-color: #3b82f7;
		}
	}

	.cancel-btn {
		margin-top: 20rpx;
		background: #f4f5f7;

		&::after {
			border-color: #f4f5f7;
		}
	}

	.bottom-content {
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pwd-login {
		color: #3b82f7;
	}
</style>