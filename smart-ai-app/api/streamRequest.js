import { useUserStore } from '@/stores/user'

const BASE_URL = 'http://192.168.1.4:3000'

export function createStreamRequest({
  url,
  data = {},
  method = 'POST',
  headers = {},
  onStart,
  onChunk,
  onComplete,
  onError
}) {
  const userStore = useUserStore()

  const header = {
    'Content-Type': 'application/json',
    ...headers
  }

  if (userStore.token) {
    header.Authorization = `Bearer ${userStore.token}`
  }

  let task = null
  let aborted = false
  let started = false // 防止 onStart 多次触发

  task = uni.request({
    url: BASE_URL + url,
    method,
    data,
    header,
    enableChunked: true,

    success(res) {
      // success = 整个流结束
      if (!aborted && onComplete) {
        onComplete(res)
      }
    },

    fail(err) {
      if (!aborted && onError) {
        onError(err)
      }
    }
  })

  // headers 到达（首包）
  task.onHeadersReceived((res) => {
    if (aborted || started) return
    started = true
    onStart && onStart(res.header || {})
  })

  // chunk 到达
  task.onChunkReceived((res) => {
    if (aborted) return

    try {
      const text = new TextDecoder('utf-8').decode(res.data)
      onChunk && onChunk(text)
    } catch (e) {
      console.error('chunk decode error', e)
    }
  })

  return {
    abort() {
      aborted = true
      task && task.abort()
    }
  }
}
