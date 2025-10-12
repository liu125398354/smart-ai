// v-ellipsis-title.js
export default {
  mounted(el) {
    const checkOverflow = () => {
      if (el.scrollWidth > el.clientWidth) {
        el.setAttribute("title", el.textContent.trim())
      } else {
        el.removeAttribute("title")
      }
    }

    // 初次判断
    checkOverflow()

    // 监听窗口尺寸变化（可选）
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)

    // 存下来，组件卸载时销毁
    el._observer = observer
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
    el._observer?.disconnect()
  }
}
