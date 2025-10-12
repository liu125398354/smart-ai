<template>
  <div ref="aiChart" :style="{ width: '100%', height: '300px' }"></div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue"
import * as echarts from "echarts"

let $props = defineProps({
  chartType: {
    type: String,
    default() {
      return "line"
    }
  },
  chartData: {
    type: Object
  }
})
const chart = ref(null),
  aiChart = ref(null)

onMounted(() => {
  nextTick(() => {
    initChart()
    window.onresize = function () {
      // 自适应大小
      chart.value.resize()
    }
  })
})

function initChart() {
  chart.value = echarts.init(aiChart.value, "dark")
  setOptions($props.chartData)
}

function setOptions({ xData, yData } = {}) {
  chart.value.setOption({
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xData
    },
    yAxis: {
      type: "value"
    },
    series: [
      {
        data: yData,
        type: $props.chartType
      }
    ]
  })
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="stylus"></style>
