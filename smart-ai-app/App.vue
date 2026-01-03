<script>
	import { useUserStore } from '@/stores/user'
	import authApi from "@/api/auth.js"
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// #ifdef MP
			const userStore = useUserStore()
			
			if (userStore.token) {
			  return
			}
			uni.login({
			  provider: 'weixin',
			  success: async (res) => {
			    const { code } = res
			    const result = await authApi.login({ code })
	  
			    userStore.setToken(result.data.token)
			    userStore.setUserInfo(result.data.user)
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
