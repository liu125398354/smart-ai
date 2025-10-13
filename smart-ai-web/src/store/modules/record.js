/**
 * Created by liunannan on 2025/10/13.
 */
const record = {
  state: {
    enableEllipsisObserver: false // 初始化是否滚动到指定选中元素完成后的标志
  },
  mutations: {
    setEnableEllipsisObserver(state, val) {
      state.enableEllipsisObserver = val
    }
  },
  actions: {},
  getters: {}
}

export default record
