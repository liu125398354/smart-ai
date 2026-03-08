import request from "@/api/request"
import {
	useUserStore
} from '@/stores/user'

const BASE_URL = 'http://192.168.1.3:3000'

export default {

	/**
	 * 修改昵称
	 */
	updateNickname(nickname) {
		return request.post("/user/update-nickname", {
			nickname
		})
	},

	/**
	 * 上传头像
	 */
	uploadAvatar(filePath) {

		const userStore = useUserStore()

		return new Promise((resolve, reject) => {

			const token = userStore.token

			uni.uploadFile({
				url: BASE_URL + "/user/upload-avatar",
				filePath: filePath,
				name: "file",

				header: {
					Authorization: `Bearer ${token}`
				},

				success(res) {

					const data = JSON.parse(res.data)

					resolve(data)

				},

				fail(err) {
					reject(err)
				}
			})

		})
	}

}