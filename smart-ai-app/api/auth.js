import request from "@/api/request"

export default {
	login(params) {
		return request.post("/auth/wxlogin", params)
	}
}