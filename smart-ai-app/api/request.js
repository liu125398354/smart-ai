// 网络请求封装
import {
	getFromLocal,
	removeLocal
} from '@/utils/index'
import {
	useUserStore
} from '@/stores/user'

const BASE_URL = 'http://192.168.1.10:3000' // 根据实际情况修改

export default {
	// GET请求
	get(url, data = {}, options = {}) {
		return this.request('GET', url, data, options)
	},

	// POST请求
	post(url, data = {}, options = {}) {
		return this.request('POST', url, data, options)
	},

	// 通用请求方法
	request(method, url, data, options) {
		const userStore = useUserStore()

		return new Promise((resolve, reject) => {
			const doRequest = () => {
				// #ifdef MP
				const token = userStore.token
				// #endif

				// #ifdef H5 || APP-PLUS
				const token = localStorage.getItem('token')
				// #endif

				const header = {
					'Content-Type': 'application/json'
				}
				if (token) {
					header['Authorization'] = `Bearer ${token}`
				}
				if (options.requireUserId) {
					const userInfo = getFromLocal('userInfo')
					if (userInfo) {
						data = {
							...data,
							userId: userInfo.id
						}
					}
				}

				uni.request({
					url: BASE_URL + url,
					method,
					header,
					data,
					success: (res) => {
						// ===== 正常成功 =====
						if ((res.statusCode >= 200 && res.statusCode < 300) || res.statusCode === 401) {
							resolve(res.data)
							return
						}
						if (res.statusCode === 403) {
							// 清除登录状态
							// #ifdef MP
							userStore.clearUserInfo()
							// #endif

							// #ifdef H5 || APP-PLUS
							localStorage.removeItem('token')
							// #endif

							uni.showToast({
								title: '请先登录',
								icon: 'none'
							})

							// 避免 toast 还没显示就跳
							setTimeout(() => {
								uni.navigateTo({
									url: '/pages/login/login'
								})
							}, 300)

							reject(new Error('未登录或登录已过期'))
							return
						}
						uni.showToast({
							title: `请求失败: ${res.statusCode}`,
							icon: 'none'
						})
						reject(new Error(`请求失败: ${res.statusCode}`))
					},
					fail: () => {
						uni.showToast({
							title: '网络请求失败',
							icon: 'none'
						})
						reject(new Error('网络请求失败'))
					}
				})
			}

			doRequest()
		})
	}
}