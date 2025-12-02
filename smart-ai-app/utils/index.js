// 本地存储信息过程中加入了编码
export function saveToLocal(key, value) {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
  } catch (e) {
    console.error('保存到本地存储失败:', e)
  }
}

// 同样地，获取本地存储的信息时，要先解码
export function getFromLocal(key) {
  try {
    const item = uni.getStorageSync(key)
    return item ? JSON.parse(item) : null
  } catch (e) {
    console.error('从本地存储获取失败:', e)
    return null
  }
}

export function removeLocal(key) {
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    console.error('从本地存储删除失败:', e)
  }
}

export function parseTime(time, cFormat) {
  if (arguments.length === 0) {
    return null
  }
  if (!time) return null
  const format = cFormat || "{y}-{m}-{d} {h}:{i}:{s}"
  let date
  if (typeof time === "object") {
    date = time
  } else {
    if (("" + time).length === 10) time = parseInt(time) * 1000
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    if (key === "a") return ["一", "二", "三", "四", "五", "六", "日"][value - 1]
    if (result.length > 0 && value < 10) {
      value = "0" + value
    }
    return value || 0
  })
  return time_str
}