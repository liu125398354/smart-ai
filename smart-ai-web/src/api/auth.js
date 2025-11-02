import service from "@/service/axios"

// 用户登录
export function login(data) {
  return service({
    url: "/auth/login",
    method: "post",
    data
  })
}

// 用户注册
export function register(data) {
  return service({
    url: "/auth/register",
    method: "post",
    data
  })
}

// 验证token
export function verifyToken() {
  return service({
    url: "/auth/verify",
    method: "get"
  })
}

export default {
  login,
  register,
  verifyToken
}
