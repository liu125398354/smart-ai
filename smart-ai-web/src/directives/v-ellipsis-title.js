// v-ellipsis-title.js
import store from "@/store"
import { watch } from "vue"

// 核心判断函数，独立出来，便于 mounted和updated 使用
function checkOverflow(el) {
  if (el.scrollWidth > el.clientWidth) {
    el.setAttribute("title", el.textContent.trim())
  } else {
    el.removeAttribute("title")
  }
}

export default {
  mounted(el) {
    // 标记是否已通过 IntersectionObserver 判断过
    el._overflowChecked = false
    el._io = null

    // 监听 store.enableEllipsisObserver，当变为 true 时再挂载 IntersectionObserver
    watch(
      () => store.state.record.enableEllipsisObserver,
      (enabled) => {
        if (enabled && !el._io) {
          // 1️⃣ IntersectionObserver：首次进入视口时判断
          const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !el._overflowChecked) {
                checkOverflow(el)
                el._overflowChecked = true
                io.unobserve(el) // 解绑，之后不再触发
              }
            })
          })

          io.observe(el)
          el._io = io

          // 首屏元素立即判断，暂时不需要
          // const rect = el.getBoundingClientRect()
          // if (rect.bottom > 0 && rect.top < window.innerHeight && !el._overflowChecked) {
          //   checkOverflow(el)
          //   el._overflowChecked = true
          // }
        }
      },
      { immediate: false }
    )

    // 2️⃣ ResizeObserver：监听元素自身尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      if (store.state.record.enableEllipsisObserver) {
        checkOverflow(el)
      }
    })
    resizeObserver.observe(el)
    el._observer = resizeObserver
  },

  updated(el) {
    // 文字内容更新时仍然重新判断
    if (store.state.record.enableEllipsisObserver) {
      checkOverflow(el)
    }
  },

  unmounted(el) {
    // 清理所有观察器
    el._observer?.disconnect()
    el._io?.disconnect()
  }
}
