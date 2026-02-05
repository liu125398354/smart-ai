<script>
	import {
		useSystemStore
	} from '@/stores/system'
	export default {
		onLaunch: function() {
			// console.log('App Launch')
			const systemStore = useSystemStore()
			systemStore.initSystemInfo()
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