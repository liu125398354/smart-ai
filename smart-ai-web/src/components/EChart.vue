<template>
  <div>
    <div v-if="codeMessage.end" ref="chartRef" style="width: 100%; height: 400px"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onDeactivated, watch, nextTick } from "vue"
import * as echarts from "echarts"
const cheerio = require("cheerio")

const chartRef = ref(null)
const chart = ref(null)

let $props = defineProps({
  codeMessage: {
    type: Object
  }
})
defineExpose({ filterData })

watch(
  () => $props.codeMessage,
  (item) => {
    console.log("return change---->", item.content)
    if (item.end) {
      nextTick(() => {
        filterData(item.content)
      })
    }
  },
  {
    immediate: false,
    deep: true
  }
)

onDeactivated(() => {
  if (!chart.value) {
    return
  }
  chart.value.dispose()
  chart.value = null
})

function drawChart(chartCode) {
  const chartContainer = chartRef.value
  const chartOptions = new Function("echarts", chartCode)(echarts)

  let chart = echarts.init(chartContainer)
  console.log("aaaa--->", chartOptions)
  chart.setOption(chartOptions)
  window.onresize = function () {
    // 自适应大小
    chart.resize()
  }
}

function filterData(html) {
  var $ = cheerio.load(html)
  var scripts = $("script")
  var scriptContent = ""

  scripts.each(function () {
    scriptContent += $(this).html()
  })
  const setOptionsRegex = /.*setOption\(.*\);.*/
  const updateCode1 = scriptContent.replace(
    setOptionsRegex,
    scriptContent.indexOf("options") > -1 ? "return options;" : "return option"
  )
  const keywordRegex = /.*echarts\.init\(.*\);.*/
  const updateCode2 = updateCode1.replace(keywordRegex, "")

  drawChart(updateCode2)
}
</script>

<style scoped></style>
