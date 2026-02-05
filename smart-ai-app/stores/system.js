import {
	defineStore
} from 'pinia'

export const useSystemStore = defineStore('system', {
	state: () => ({
		statusBarHeight: 0, // 状态栏高度
		navBarHeight: 44, // 导航栏默认高度，单位px
		capsuleTop: 0 // 胶囊上边界距顶部距离
	}),
	actions: {
		initSystemInfo() {
			const systemInfo = uni.getSystemInfoSync()
			this.statusBarHeight = systemInfo.statusBarHeight || 0 // 获取状态栏高度

			// 微信小程序才有胶囊
			// #ifdef MP-WEIXIN
			const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
			if (menuButtonInfo) {
				// 计算导航栏高度 = 胶囊高度 + (胶囊距顶距离 - 状态栏高度) * 2
				this.navBarHeight =
					menuButtonInfo.height +
					(menuButtonInfo.top - this.statusBarHeight) * 2
				this.capsuleTop = menuButtonInfo.top // 用于后续标题垂直居中计算
			}
			// #endif
		}
	}
})