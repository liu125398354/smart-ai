<template>
  <div>
    <a-menu v-model:selectedKeys="current" mode="horizontal" :items="items" @click="switchPage" />
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { h, ref, watch } from "vue"
import { useRouter, useRoute } from "vue-router"
import { AliwangwangOutlined, EditOutlined, BarChartOutlined } from "@ant-design/icons-vue"
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

function switchPage(item) {
  router.push({ path: item.key })
}
</script>

<style scoped lang="stylus"></style>
