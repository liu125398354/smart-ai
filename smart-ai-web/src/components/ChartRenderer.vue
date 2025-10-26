<template>
  <div ref="root" :style="{ width: '100%', height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import * as echarts from "echarts"
import "echarts-gl" // ✅ 一次性导入 echarts-gl，支持所有 3D 能力

const props = defineProps({
  type: {
    type: String,
    default: "line"
  },
  options: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: String,
    default: "480px"
  }
})

const root = ref(null)
let instance = null
const registeredMapNames = new Set()

/** 自动 resize */
function handleResize() {
  instance?.resize()
}

/** 判断是否是完整配置 */
function isFullOption(opt) {
  if (!opt || typeof opt !== "object") return false
  if (Array.isArray(opt.series) && opt.series.length) return true
  if (opt.xAxis || opt.yAxis || opt.geo || opt.grid3D) return true
  return false
}

/** 根据类型生成合理的默认配置（自动兜底） */
function getOptionByType() {
  const t = props.type.toLowerCase()
  const opt = props.options || {}

  // ✅ 如果用户提供完整配置，则直接使用
  if (isFullOption(opt)) return JSON.parse(JSON.stringify(opt))

  // ✅ 兜底模板
  const basicXY = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: opt.xData || [] },
    yAxis: { type: "value" },
    series: [{ type: t, data: opt.yData || [] }]
  }

  // -------------------------
  // 🚀 3D 系列自动配置
  // -------------------------
  if (/3d$/.test(t)) {
    const base3D = {
      tooltip: {},
      grid3D: {},
      xAxis3D: { type: "value" },
      yAxis3D: { type: "value" },
      zAxis3D: { type: "value" }
    }
    if (t === "bar3d") {
      return {
        ...base3D,
        visualMap: opt.visualMap || { max: 20, inRange: { color: ["#74add1", "#f46d43"] } },
        series: [
          {
            type: "bar3D",
            data: opt.data || [],
            shading: "lambert",
            itemStyle: { opacity: 0.9 }
          }
        ]
      }
    }
    if (t === "scatter3d") {
      return {
        ...base3D,
        series: [
          {
            type: "scatter3D",
            data: opt.data || [],
            symbolSize: 8,
            itemStyle: { opacity: 0.8 }
          }
        ]
      }
    }
    if (t === "surface3d") {
      return {
        ...base3D,
        series: [
          {
            type: "surface",
            wireframe: { show: false },
            shading: "realistic",
            data: opt.data || []
          }
        ]
      }
    }
    if (t === "map3d" || t === "geo3d") {
      return {
        geo3D: {
          map: opt.mapName || "china",
          shading: "lambert",
          regionHeight: 2,
          realisticMaterial: { roughness: 0.6 },
          viewControl: { distance: 120 },
          environment: "#000"
        },
        series: [
          {
            type: "bar3D",
            coordinateSystem: "geo3D",
            data: opt.data || [],
            shading: "lambert"
          }
        ]
      }
    }
    if (t === "globe") {
      return {
        globe: {
          baseTexture:
            opt.baseTexture ||
            "https://cdn.jsdelivr.net/gh/apache/echarts-examples/public/data-gl/asset/earth.jpg",
          heightTexture:
            opt.heightTexture ||
            "https://cdn.jsdelivr.net/gh/apache/echarts-examples/public/data-gl/asset/bathymetry_bw_composite_4k.jpg",
          shading: "lambert",
          light: {
            main: { intensity: 1.5 },
            ambient: { intensity: 0.3 }
          }
        },
        series: []
      }
    }
  }

  // -------------------------
  // 🌏 地图自动配置
  // -------------------------
  if (t === "map" || t === "geo") {
    const mapName = opt.mapName || "china"
    return {
      tooltip: {},
      visualMap: opt.visualMap || { left: "left", min: 0, max: 100 },
      series: [
        {
          type: "map",
          map: mapName,
          data: opt.data || []
        }
      ]
    }
  }

  // -------------------------
  // 📊 其他图表类型（pie/radar/sankey 等）
  // -------------------------
  if (t === "pie") {
    return {
      tooltip: { trigger: "item" },
      legend: { top: "bottom" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: opt.data || [],
          itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } }
        }
      ]
    }
  }
  if (t === "radar") {
    return {
      tooltip: {},
      radar: { indicator: opt.indicator || [] },
      series: [{ type: "radar", data: opt.data || [] }]
    }
  }
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
  if (t === "tree") {
    return {
      tooltip: {},
      series: [
        {
          type: "tree",
          data: opt.data ? (Array.isArray(opt.data) ? opt.data : [opt.data]) : [],
          top: "5%",
          left: "10%",
          bottom: "5%",
          right: "20%"
        }
      ]
    }
  }

  return basicXY
}

/** 注册地图（支持离线 geoJSON） */
async function ensureMapRegistered(option) {
  try {
    const opt = props.options || {}
    const providedName =
      opt.mapName ||
      option?.series?.find((s) => s?.type === "map")?.map ||
      option?.geo?.map ||
      option?.geo3D?.map

    if (opt.geoJSON && providedName && !registeredMapNames.has(providedName)) {
      echarts.registerMap(providedName, opt.geoJSON)
      registeredMapNames.add(providedName)
      return
    }

    const namesToCheck = new Set()
    if (providedName) namesToCheck.add(providedName)
    for (const name of namesToCheck) {
      if (registeredMapNames.has(name)) continue
      let geoUrl = null
      if (name.toLowerCase() === "china" || name === "中国") {
        geoUrl = "https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=100000_full"
      } else if (name.toLowerCase() === "world") {
        geoUrl = "https://echarts.apache.org/examples/data/asset/geo/world.json"
      }
      if (geoUrl) {
        const res = await fetch(geoUrl)
        if (res.ok) {
          const geojson = await res.json()
          echarts.registerMap(name, geojson)
          registeredMapNames.add(name)
        }
      }
    }
  } catch (e) {
    console.warn("地图注册失败:", e)
  }
}

/** 渲染核心逻辑 */
async function render() {
  if (!root.value) return
  if (!instance) {
    instance = echarts.init(root.value)
    window.addEventListener("resize", handleResize)
  }

  try {
    const option = getOptionByType()
    if (!option || typeof option !== "object") return

    await ensureMapRegistered(option)

    instance.clear()
    instance.setOption(option, true)
    requestAnimationFrame(() => instance?.resize())
  } catch (e) {
    console.error("ECharts render error:", e)
  }
}

onMounted(render)
onBeforeUnmount(() => {
  instance?.dispose()
  instance = null
  window.removeEventListener("resize", handleResize)
})
watch(() => props.options, render, { deep: true })
</script>

<style scoped></style>
