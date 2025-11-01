// 检查用户是否已登录
export function isLoggedIn() {
  const token = localStorage.getItem('token')
  return !!token
}

// 获取存储的token
export function getToken() {
  return localStorage.getItem('token')
}

// 获取用户信息
export function getUserInfo() {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 设置用户信息
export function setUserInfo(userInfo) {
  localStorage.setItem('userInfo', JSON.stringify(userInfo))
}

// 清除认证信息
export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
}

export default {
  isLoggedIn,
  getToken,
  getUserInfo,
  setUserInfo,
  clearAuth
}