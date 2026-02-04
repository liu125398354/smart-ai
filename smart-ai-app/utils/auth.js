import {
	useUserStore
} from '@/stores/user'

/**
 * 是否已登录
 */
export function isLoggedIn() {
	const userStore = useUserStore()
	return !!userStore.token
}