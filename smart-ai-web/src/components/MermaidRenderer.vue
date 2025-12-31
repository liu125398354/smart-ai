<template>
  <div class="markdown-body-custom">
    <Viewer :value="safeContent" :plugins="plugins" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Viewer } from '@bytemd/vue-next'

// 插件
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import math from '@bytemd/plugin-math'
import mermaid from '@bytemd/plugin-mermaid'
import breaks from '@bytemd/plugin-breaks'
import frontmatter from '@bytemd/plugin-frontmatter'

// 样式
import 'bytemd/dist/index.css'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

// ✅ 让 highlight.js 认识 mermaid，避免警告
import hljs from 'highlight.js'
hljs.registerLanguage('mermaid', function () {
  return { name: 'mermaid', contains: [] }
})

// props
let props = defineProps({
  content: {
    type: String,
    required: true
  }
})

// 插件
const plugins = [gfm(), highlight(), math(), mermaid(), breaks(), frontmatter()]

/* 计算属性 */
const safeContent = computed(() => {
  // 块级 \[…\] → $$...$$
  // 行内 \(...\) → $...$
  return (
    props.content
      // 块级公式 \[...\] → $$...$$
      .replace(/\\\[(.*?)\\\]/gs, (_, expr) => `$$${expr}$$`)
      // 行内公式 \(...\) → $...$
      .replace(/\\\((.*?)\\\)/gs, (_, expr) => `$${expr}$`)
  )
})
</script>

<style scoped lang="stylus">
.markdown-body-custom
  color inherit
  font-family 'Segoe UI', 'Helvetica Neue', Arial, 'PingFang SC', sans-serif
  font-size 15px
  line-height 1.7
  padding 1.2rem
  overflow-x hidden

/* 段落与标题优化 */
:deep(p)
  margin 0.6em 0

:deep(h1)
  font-size 1.9em
  margin 1em 0 0.6em
  font-weight 700
  border-bottom 2px solid rgba(0,0,0,0.08)
  padding-bottom 0.3em

:deep(h2)
  font-size 1.5em
  margin 1em 0 0.5em
  font-weight 600
  border-bottom 1px solid rgba(0,0,0,0.05)
  padding-bottom 0.2em

:deep(h3)
  font-size 1.2em
  margin 0.8em 0 0.4em
  font-weight 600

/* 列表 */
:deep(ul), :deep(ol)
  padding-left 1.5rem

/* 表格样式 */
:deep(table)
  border-collapse collapse
  margin 1em 0
  width 100%

:deep(th), :deep(td)
  border 1px solid rgba(180,180,180,0.3)
  padding 0.5em 0.7em

:deep(th)
  background rgba(240,240,240,0.6)
  font-weight 600

/* ✅ 代码块 — 改为浅色风格 */
:deep(pre)
  background #f6f8fa
  color #24292e
  border-radius 6px
  padding 0.75em 1em
  overflow-x auto
  font-size 0.9em
  border 1px solid rgba(0,0,0,0.05)
  box-shadow 0 2px 4px rgba(0,0,0,0.04)

:deep(code)
  font-family 'Fira Code', Consolas, monospace
  background rgba(0,0,0,0.05)
  border-radius 4px
  padding 0.15em 0.3em

/* Mermaid 图表 */
:deep(.mermaid)
  background transparent
  margin 1.2em 0
  text-align center
  overflow-x auto

/* KaTeX 数学公式 */
:deep(.katex-display)
  overflow-x auto
  padding 0.5em 0
  text-align center

/* 引用块 */
:deep(blockquote)
  border-left 4px solid rgba(0,0,0,0.15)
  padding-left 1em
  color rgba(0,0,0,0.75)
  background rgba(0,0,0,0.03)
  margin 0.8em 0

/* Mermaid 图自动居中 */
:deep(.bytemd-mermaid) {
  display flex
  justify-content center
  background-color #fff
  border-radius 6px
  padding 0.5rem
}
</style>
