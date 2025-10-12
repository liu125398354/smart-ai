// v-ellipsis-title.js
export default {
  mounted(el) {
    // 核心判断函数
    const checkOverflow = () => {
      if (el.scrollWidth > el.clientWidth) {
        el.setAttribute("title", el.textContent.trim())
      } else {
        el.removeAttribute("title")
      }
    }

    // 标记是否已通过 IntersectionObserver 判断过
    el._overflowChecked = false

    // 1️⃣ IntersectionObserver：首次进入视口时判断
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !el._overflowChecked) {
          console.log("zoule----")
          checkOverflow()
          el._overflowChecked = true
          io.unobserve(el) // 解绑，之后不再触发
        }
      })
    })
    io.observe(el)
    el._io = io

    // 2️⃣ ResizeObserver：监听元素自身尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow()
    })
    resizeObserver.observe(el)
    el._observer = resizeObserver
  },

  updated(el) {
    // 文字内容更新时仍然重新判断
    checkOverflow(el)
  },

  unmounted(el) {
    // 清理所有观察器
    el._observer?.disconnect()
    el._io?.disconnect()
  }
}

// 独立函数，便于 updated 使用
function checkOverflow(el) {
  if (el.scrollWidth > el.clientWidth) {
    el.setAttribute("title", el.textContent.trim())
  } else {
    el.removeAttribute("title")
  }
}
