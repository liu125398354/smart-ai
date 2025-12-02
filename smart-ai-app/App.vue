<script>
	import authApi from "@/api/auth.js"
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// #ifdef MP
			const token = uni.getStorageSync('token')
			if (token) {
				return
			}
			uni.login({
			  provider: 'weixin',
			  success: (res) => {
			    const code = res.code
				console.log(code)
				authApi.login({ code }).then((res) => {
					console.log(res)
					uni.setStorageSync('token', res.data.token)
					uni.setStorageSync('userInfo', res.data.user)
				})
			  }
			})
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
