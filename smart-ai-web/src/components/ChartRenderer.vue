<template>
  <div ref="root" :style="{ width: '100%', height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import * as echarts from "echarts"

let $props = defineProps({
  type: {
    type: String,
    default: "line" // 折线图 | 柱状图 | 饼图 | 雷达图
  },
  options: {
    type: Object,
    default() {
      return {}
    }
  },
  height: {
    type: String,
    default: "480px"
  }
})

const root = ref(null)
const widthPx = ref(600)
let instance = null
let resizeObserver = null
let echartsGLLoaded = false
let registeredMapNames = new Set()

function handleResize() {
  if (instance) instance.resize()
}

function getOptionByType() {
  const t = ($props.type || "line").toLowerCase()
  const opt = $props.options || {}

  // 如果模型返回的是完整的 ECharts 配置（包含 series/xAxis/radar 等），则直接使用
  const isFullOption = () => {
    if (!opt || typeof opt !== "object") return false
    if (Array.isArray(opt.series) && opt.series.length) return true
    if (opt.xAxis || opt.yAxis || opt.radar || opt.legend || opt.dataset) return true
    return false
  }
  if (isFullOption()) {
    // 克隆一份，避免直接修改 props
    const option = JSON.parse(JSON.stringify(opt))
    // 如果缺少 series.type，则根据传入的图表类型进行补全（仅补第一个）
    if (Array.isArray(option.series) && option.series.length) {
      option.series = option.series.map((s, idx) => {
        if (!s || typeof s !== "object") return s
        if (!s.type && (t === "line" || t === "bar" || t === "pie" || t === "radar")) {
          return { ...s, type: s.type || (idx === 0 ? t : s.type) }
        }
        return s
      })
    }
    return option
  }
  // 散点图兜底配置
  if (t === "scatter") {
    const points = Array.isArray(opt.points) ? opt.points : []
    const data = points.map((p) => (Array.isArray(p) ? p : p && p.value ? p.value : p))
    return {
      tooltip: { trigger: "item" },
      xAxis: { type: "value" },
      yAxis: { type: "value" },
      series: [{ type: "scatter", data }]
    }
  }
  // 热力图兜底配置
  if (t === "heatmap") {
    const xCategories = opt.xCategories || []
    const yCategories = opt.yCategories || []
    const values = Array.isArray(opt.values) ? opt.values : [] // [xIndex, yIndex, value]
    return {
      tooltip: { position: "top" },
      grid: { height: "70%", top: "10%" },
      xAxis: { type: "category", data: xCategories, splitArea: { show: true } },
      yAxis: { type: "category", data: yCategories, splitArea: { show: true } },
      visualMap: {
        min: opt.min ?? 0,
        max: opt.max ?? 100,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0
      },
      series: [
        {
          name: "heatmap",
          type: "heatmap",
          data: values,
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.4)" } }
        }
      ]
    }
  }
  // 漏斗图兜底配置
  if (t === "funnel") {
    return {
      tooltip: { trigger: "item", formatter: "{b}: {c}" },
      legend: {},
      series: [
        {
          type: "funnel",
          left: "10%",
          top: 20,
          bottom: 20,
          width: "80%",
          min: 0,
          max: opt.max ?? 100,
          sort: opt.sort || "descending",
          gap: 2,
          label: { show: true, position: "inside" },
          data: opt.data || []
        }
      ]
    }
  }
  // K 线图兜底配置（蜡烛图）
  if (t === "candlestick" || t === "kline" || t === "k-line") {
    const categoryData = opt.categoryData || []
    const values = opt.values || [] // [[open, close, low, high], ...]
    return {
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: categoryData, scale: true, boundaryGap: true },
      yAxis: { scale: true },
      series: [{ type: "candlestick", data: values }]
    }
  }
  // 仪表盘兜底配置
  if (t === "gauge") {
    return {
      series: [
        {
          type: "gauge",
          progress: { show: true },
          detail: { valueAnimation: true, formatter: "{value}%" },
          data: opt.data || [{ value: 50, name: "Progress" }]
        }
      ]
    }
  }
  // 树图兜底配置
  if (t === "tree") {
    return {
      tooltip: { trigger: "item", triggerOn: "mousemove" },
      series: [
        {
          type: "tree",
          data: opt.data ? (Array.isArray(opt.data) ? opt.data : [opt.data]) : [],
          top: "5%",
          left: "10%",
          bottom: "5%",
          right: "20%",
          symbolSize: 7,
          label: { position: "left", verticalAlign: "middle", align: "right" },
          leaves: { label: { position: "right", verticalAlign: "middle", align: "left" } },
          expandAndCollapse: true,
          animationDuration: 550,
          animationDurationUpdate: 750
        }
      ]
    }
  }
  // 矩形树图兜底配置
  if (t === "treemap") {
    return {
      tooltip: { formatter: "{b}: {c}" },
      series: [
        {
          type: "treemap",
          data: opt.data || [],
          leafDepth: opt.leafDepth || 1,
          roam: true
        }
      ]
    }
  }
  // 旭日图兜底配置
  if (t === "sunburst") {
    return {
      series: [
        {
          type: "sunburst",
          data: opt.data || [],
          radius: [0, "90%"],
          label: { rotate: "radial" }
        }
      ]
    }
  }
  // 桑基图兜底配置
  if (t === "sankey") {
    return {
      series: [
        {
          type: "sankey",
          data: opt.nodes || [],
          links: opt.links || [],
          emphasis: { focus: "adjacency" }
        }
      ]
    }
  }
  // 关系图兜底配置（默认力引导布局）
  if (t === "graph") {
    return {
      tooltip: {},
      series: [
        {
          type: "graph",
          layout: opt.layout || "force",
          roam: true,
          label: { show: true },
          data: opt.nodes || [],
          links: opt.links || [],
          force: opt.force || { repulsion: 100 }
        }
      ]
    }
  }
  // 地图/地理坐标兜底配置（需要提供 geoJSON 或数据坐标）
  if (t === "map" || t === "geo") {
    const mapName = opt.mapName || "customMap"
    return {
      tooltip: {},
      visualMap: opt.visualMap,
      series: [
        {
          type: "map",
          map: mapName,
          data: opt.data || []
        }
      ]
    }
  }
  if (t === "pie") {
    return {
      tooltip: { trigger: "item" },
      legend: { top: "bottom" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
          label: { show: false, position: "center" },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
          labelLine: { show: false },
          data: opt.data || []
        }
      ]
    }
  }
  if (t === "radar") {
    return {
      tooltip: {},
      radar: { indicator: opt.indicator || [] },
      series: [
        {
          type: "radar",
          data: opt.data || []
        }
      ]
    }
  }
  // line / bar
  return {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: opt.xData || [] },
    yAxis: { type: "value" },
    series: [
      {
        type: t,
        data: opt.yData || []
      }
    ]
  }
}

async function maybeLoadEchartsGL(option) {
  // 判断是否包含 3D 能力，若包含则按需加载 echarts-gl
  const has3D = !!(
    option &&
    (option.grid3D ||
      option.geo3D ||
      option.globe ||
      (Array.isArray(option.series) &&
        option.series.some((s) => s && typeof s.type === "string" && /3d$/i.test(s.type))))
  )
  if (has3D && !echartsGLLoaded) {
    try {
      await import(/* webpackChunkName: "echarts-gl" */ "echarts-gl")
      echartsGLLoaded = true
    } catch (e) {
      console.warn("未能加载 echarts-gl，3D 图表可能无法渲染。")
    }
  }
}

async function render() {
  instance = echarts.init(root.value)
  window.addEventListener("resize", handleResize)
  if (!instance) return
  try {
    const option = getOptionByType()
    if (!option || typeof option !== "object") return
    // 注册地图（优先使用传入的 geoJSON，否则按常见名称尝试在线获取）
    await ensureMapRegistered(option)
    await maybeLoadEchartsGL(option)
    // 自动为直角坐标系增加合理的上内边距，避免标题贴近图表
    try {
      const hasXAxis = typeof option.xAxis !== "undefined"
      const hasYAxis = typeof option.yAxis !== "undefined"
      if (hasXAxis || hasYAxis) {
        const gridObj = option.grid && !Array.isArray(option.grid) ? option.grid : {}
        const hasGridTop = typeof gridObj.top !== "undefined"
        const hasTitle = typeof option.title !== "undefined"
        if (!hasGridTop) {
          const topGap = hasTitle ? 70 : 50
          option.grid = { ...gridObj, top: gridObj.top ?? topGap }
        }
        if (hasTitle && typeof option.title.top === "undefined") {
          option.title.top = 10
        }
      }
    } catch (e) {}
    instance.setOption(option, true)
    // 设置完配置后在下一帧再 resize，避免在主流程中调用导致告警
    requestAnimationFrame(() => {
      if (instance) instance.resize()
    })
  } catch (e) {
    // 捕获渲染异常，避免影响整页运行
    console.error("ECharts render error:", e)
  }
}

async function ensureMapRegistered(option) {
  try {
    const opt = $props.options || {}
    // 1) 如果 props 中直接提供了 geoJSON，则优先注册
    const providedName =
      opt.mapName ||
      (option && option.series && option.series.find((s) => s && s.type === "map")?.map) ||
      (option && option.geo && option.geo.map)
    if (opt && opt.geoJSON && providedName && !registeredMapNames.has(providedName)) {
      echarts.registerMap(providedName, opt.geoJSON)
      registeredMapNames.add(providedName)
      return
    }
    // 2) 如果没有提供 geoJSON，但使用了常见的 china/world，则尝试在线获取
    const namesToCheck = new Set()
    if (providedName) namesToCheck.add(providedName)
    if (option && Array.isArray(option.series)) {
      option.series.forEach((s) => {
        if (s && s.type === "map" && s.map) namesToCheck.add(s.map)
      })
    }
    if (option && option.geo && option.geo.map) namesToCheck.add(option.geo.map)
    for (const name of namesToCheck) {
      if (registeredMapNames.has(name)) continue
      let geoUrl = null
      if (name.toLowerCase() === "china" || name === "中国") {
        // 阿里数据服务中国边界（全国）
        geoUrl = "https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=100000_full"
      } else if (name.toLowerCase() === "world") {
        geoUrl = "https://echarts.apache.org/examples/data/asset/geo/world.json"
      }
      if (geoUrl) {
        try {
          const res = await fetch(geoUrl)
          if (res.ok) {
            const geojson = await res.json()
            echarts.registerMap(name, geojson)
            registeredMapNames.add(name)
          }
        } catch (e) {
          // 忽略网络错误，保持原有报错提示由 ECharts 抛出
        }
      }
    }
  } catch (e) {
    // 忽略地图注册过程中的异常
  }
}

onMounted(() => {
  render()
})

onBeforeUnmount(() => {
  if (instance) {
    instance.dispose()
    instance = null
  }
  window.removeEventListener("resize", handleResize)
  if (resizeObserver) {
    try {
      resizeObserver.disconnect()
    } catch (e) {}
    resizeObserver = null
  }
})
</script>

<style scoped lang="stylus"></style>
