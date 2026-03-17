<template>
  <view class="setting-container">
    <!-- 顶部标题 -->
    <BaseNavBar title="账户信息" />
    <view class="content">
      <!-- 头像 -->
      <view class="avatar-box">
        <view>头像</view>
        <view class="avatar-wrapper">
          <button
            class="avatar-btn"
            open-type="chooseAvatar"
            @chooseavatar="onChooseAvatar"
          >
            <image
              :src="userInfo?.avatar || '/static/default-avatar.png'"
              class="avatar"
            />
            <view>
              <uni-icons
                type="right"
                size="22"
              />
            </view>
          </button>
        </view>
      </view>

      <!-- 昵称 -->
      <view class="avatar-box avatar-bottom">
        <view>昵称</view>
        <view
          class="nick-name"
          @click="changeNickName"
        >
          <view>{{ userInfo?.nickname }}</view>
          <view>
            <uni-icons
              type="right"
              size="22"
            />
          </view>
        </view>
      </view>
      <button
        class="loginout-btn"
        @click="handleLogout"
      >
        退出登录
      </button>
    </view>
    <uni-popup
      ref="nickNamePopup"
      type="dialog"
    >
      <uni-popup-dialog
        v-model="nickname"
        mode="input"
        title="修改昵称"
        placeholder="请输入新昵称"
        :before-close="true"
        @close="closeNickName"
        @confirm="confirmNickName"
      />
    </uni-popup>
  </view>
</template>

<script setup>
	import {
		ref,
		computed
	} from "vue"
	import BaseNavBar from "@/components/BaseNavBar.vue"
	import {
		useUserStore
	} from '@/stores/user'
	import userApi from "@/api/user"

	const userStore = useUserStore()

	const userInfo = computed(() => userStore.getUserInfo)
	const nickname = ref("")
	const nickNamePopup = ref(null)

	async function onChooseAvatar(e) {
		const filePath = e.detail.avatarUrl
		const res = await userApi.uploadAvatar(filePath)

		if (res.success) {
			userStore.updateAvatar(res.data.avatar)
			uni.showToast({
				title: "头像更新成功"
			})

		}
	}

	function changeNickName() {
		nickname.value = userInfo.value.nickname
		nickNamePopup.value.open()
	}

	function handleLogout() {
		userStore.clearUserInfo()
		uni.reLaunch({
			url: '/pages/PhoneLogin/PhoneLogin'
		})
	}

	function closeNickName() {
		nickNamePopup.value.close()
	}

	async function confirmNickName(value) {
		let changedValue = value.trim()
		if (!changedValue) {
			uni.showToast({
				title: "昵称不能为空",
				icon: "none"
			})
			return
		}
		const res = await userApi.updateNickname(changedValue)

		if (res.success) {
			uni.showToast({
				title: "修改成功"
			})
			userStore.setUserInfo({
				id: userInfo.value.id,
				avatar: userInfo.value.avatar,
				nickname: value.trim()
			})
			nickNamePopup.value.close()
		} else {
			uni.showToast({
				title: "修改失败"
			})
		}
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

	.avatar-box {
		height: 80rpx;
		display: flex;
		align-items: center;
		padding: 10rpx 0;
		border-bottom: 1px solid #ddd;
	}

	.avatar-bottom {
		margin-bottom: 20rpx;
	}

	.avatar-wrapper {
		flex: 1;
	}

	.avatar {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
	}

	.avatar-btn {
		background: none;
		padding-left: 0;
		padding-right: 0;
		display: flex;
		align-items: center;
		justify-content: flex-end;

		&::after {
			border: none;
		}
	}

	.nick-name {
		flex: 1;
		display: flex;
		justify-content: flex-end;
	}

	.loginout-btn {
		margin-top: 40rpx;
		height: 96rpx;
		line-height: 96rpx;
		background: #f7f7f7;
		font-size: 32rpx;
	}
</style>