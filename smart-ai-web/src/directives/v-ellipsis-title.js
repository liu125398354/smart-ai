// v-ellipsis-title.js
export default {
  mounted(el) {
    // 核心判断文字是否溢出
    const checkOverflow = () => {
      if (el.scrollWidth > el.clientWidth) {
        el.setAttribute("title", el.textContent.trim())
      } else {
        el.removeAttribute("title")
      }
    }

    // 1️⃣ 用 IntersectionObserver 懒判断（只在元素进入视口时触发）
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          checkOverflow()
        }
      })
    })
    io.observe(el)
    el._io = io

    // 2️⃣ 监听自身元素尺寸变化或父容器变化，保持响应式
    const resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(el)
    el._observer = resizeObserver
  },

  updated(el) {
    // 内容变化时重新判断
    if (el.scrollWidth > el.clientWidth) {
      el.setAttribute("title", el.textContent.trim())
    } else {
      el.removeAttribute("title")
    }
  },

  unmounted(el) {
    // 清理观察器
    el._observer?.disconnect()
    el._io?.disconnect()
  }
}
