/**
 * Created by liunannan on 2025/10/13.
 */
import { defineStore } from "pinia"

export const useRecordStore = defineStore("record", {
  state: () => ({
    enableEllipsisObserver: false // 初始化是否滚动到指定选中元素完成后的标志
  }),
  
  actions: {
    setEnableEllipsisObserver(val) {
      this.enableEllipsisObserver = val
    }
  }
})