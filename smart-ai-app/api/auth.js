import request from "@/api/request"

export default {
  login(params, config) {
    return request.post("/auth/wxlogin", params)
  }
}