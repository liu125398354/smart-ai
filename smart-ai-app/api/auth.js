import request from "@/api/request"

export default {
	login(params) {
		return request.post("/auth/wxlogin", params)
	},

	wxPhoneLogin(params) {
		return request.post("/auth/wx-phone-login", params)
	}
}