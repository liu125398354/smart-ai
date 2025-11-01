<template>
  <div>
    <a-layout>
      <a-layout-header class="header">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="items"
          @click="switchPage"
          class="menu"
        />
        <div class="user-info" v-if="userInfo">
          <span>欢迎, {{ userInfo.username }}</span>
          <a-button type="primary" @click="handleLogout" style="margin-left: 15px"
            >退出登录</a-button
          >
        </div>
      </a-layout-header>
      <a-layout-content>
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup>
import { h, ref, watch, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useStore } from "vuex"
import { AliwangwangOutlined, EditOutlined, BarChartOutlined } from "@ant-design/icons-vue"

const store = useStore()
const current = ref([useRoute().name])
const items = ref([
  {
    key: "chat",
    icon: () => h(AliwangwangOutlined),
    label: "AI Chat",
    title: "AI Chat"
  },
  {
    key: "drawing",
    icon: () => h(EditOutlined),
    label: "AI 绘画",
    title: "AI 绘画"
  }
])
const router = useRouter()

const userInfo = computed(() => store.getters.getUserInfo)

function switchPage(item) {
  router.push({ path: item.key })
}

function handleLogout() {
  // 清除store中的用户信息
  store.commit("clearUserInfo")

  // 跳转到登录页
  router.push("/login")
}
</script>

<style scoped lang="stylus">
.header
  height 50px
  display flex
  align-items center
  justify-content space-between
  background #fff
  padding 0 20px
  color #000
  border-bottom 1px solid #e8e8e8

  .menu
    line-height 50px
    flex 1
    margin 0 20px

  .user-info
    display flex
    align-items center
</style>
