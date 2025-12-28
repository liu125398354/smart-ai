<template>
  <div class="err-container">
    <div class="err-wrapper">
      <div class="err-left">
        <img
          class="err-pic"
          :src="pic404"
          loading="lazy"
          alt="404"
        >
        <img
          class="pic-404-child left"
          :src="pic404Cloud"
          alt="404"
          loading="lazy"
        >
        <img
          class="pic-404-child mid"
          :src="pic404Cloud"
          alt="404"
          loading="lazy"
        >
        <img
          class="pic-404-child right"
          :src="pic404Cloud"
          alt="404"
          loading="lazy"
        >
      </div>
      <div class="err-right">
        <div class="err-page">
          Page Not Found
        </div>
        <div class="err-not-found">
          您访问的页面可能被删除或者不存在了
        </div>
        <div class="err-index">
          <a-button
            class="back-btn"
            type="primary"
            shape="round"
            @click="returnIndex"
          >
            返回首页
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

import pic404 from '@/assets/img/404.png'
import pic404Cloud from '@/assets/img/404_cloud.png'

const router = useRouter()
const returnIndex = () => router.push('/')
</script>

<style lang="stylus" scoped>
.err-container
  position: relative
  background: #f0f2f5
  height: 100%
  display: flex
  justify-content: center
  align-items: center
  padding: 20px

.err-wrapper
  display: flex
  flex-direction: row
  align-items: center
  justify-content: center
  width: 100%
  max-width: 1200px
  gap: clamp(20px, 5vw, 50px)
  flex-wrap: nowrap

.err-left, .err-right
  flex: 1 1 0
  min-width: 0  /* 允许缩小不换行 */

.err-left
  position: relative
  display: flex
  justify-content: center
  img.err-pic
    width: clamp(200px, 35vw, 600px)
  .pic-404-child
    position: absolute
    will-change: transform, opacity
  .left
    width: clamp(50px, 8vw, 80px)
    top: -60px
    left: 25%
    transform: translate(32%,10%)
    opacity: 0
    animation-name: cloudLeft
    animation-duration: 2s
    animation-timing-function: linear
    animation-fill-mode: forwards
    animation-delay: 1s
  .mid
    width: clamp(30px, 5vw, 46px)
    top: -60px
    left: 45%
    transform: translate(52%,10%)
    opacity: 0
    animation-name: cloudMid
    animation-duration: 2s
    animation-timing-function: linear
    animation-fill-mode: forwards
    animation-delay: 1.2s
  .right
    width: clamp(40px, 6vw, 62px)
    top: -60px
    left: 55%
    transform: translate(60%,40%)
    opacity: 0
    animation-name: cloudRight
    animation-duration: 2s
    animation-timing-function: linear
    animation-fill-mode: forwards
    animation-delay: 1s

.err-right
  display: flex
  flex-direction: column
  justify-content: center
  gap: 1rem
  .err-page
    font-size: clamp(24px, 4vw, 40px)
    font-weight: 400
    color: #3D96FF
    opacity: 0
    animation-name: slideUp
    animation-duration: 1s
    animation-fill-mode: forwards
  .err-not-found
    font-size: clamp(14px, 2vw, 20px)
    font-weight: 200
    color: #666666
    opacity: 0
    animation-name: slideUp
    animation-duration: 1s
    animation-delay: 0.1s
    animation-fill-mode: forwards
  .err-index
    opacity: 0
    animation-name: slideUp
    animation-duration: 1s
    animation-delay: 0.2s
    animation-fill-mode: forwards
    .back-btn
      width: clamp(80px, 15vw, 110px)
      height: clamp(28px, 5vw, 35px)
      font-size: clamp(12px, 2vw, 13px)

/* 云彩动画使用 transform 百分比，随容器缩放 */
@keyframes cloudLeft
  0%   { transform: translate(32%,10%); opacity:0; }
  20%  { transform: translate(20%,25%); opacity:1; }
  80%  { transform: translate(-20%,65%); opacity:1; }
  100% { transform: translate(-30%,80%); opacity:0; }

@keyframes cloudMid
  0%   { transform: translate(52%,10%); opacity:0; }
  20%  { transform: translate(46%,40%); opacity:1; }
  70%  { transform: translate(28%,130%); opacity:1; }
  100% { transform: translate(22%,160%); opacity:0; }

@keyframes cloudRight
  0%   { transform: translate(60%,40%); opacity:0; }
  20%  { transform: translate(56%,48%); opacity:1; }
  80%  { transform: translate(44%,80%); opacity:1; }
  100% { transform: translate(40%,100%); opacity:0; }

@keyframes slideUp
  0% { transform: translateY(80px); opacity:0; }
  100% { transform: translateY(0); opacity:1; }
</style>
