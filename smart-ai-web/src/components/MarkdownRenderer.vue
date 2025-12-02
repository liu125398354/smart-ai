<template>
  <div class="markdown-body" v-html="safeContent"></div>
</template>

<script setup>
import { computed } from "vue"

import "github-markdown-css/github-markdown.css"
import hljs from "highlight.js"
import "highlight.js/styles/atom-one-dark.css"
// import 'highlight.js/styles/github.css'

import MarkdownIt from "markdown-it"
import mk from "markdown-it-katex"
import texmath from "markdown-it-texmath"
import "katex/dist/katex.min.css"
import katex from "katex"

import DOMPurify from "dompurify"

/* 定义属性 */
let props = defineProps({
  content: {
    type: String,
    required: true
  }
})

// 创建 markdown-it 实例并配置 KaTeX 插件
const md = new MarkdownIt({
  html: true, // 允许 HTML 标签
  linkify: true, // 自动转换 URL 为链接
  typographer: true, // 优化排版
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang }).value +
          "</code></pre>"
        )
      } catch (err) {
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
      }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
  }
})

// 块级公式 \[...\] → $$...$$
// 行内 \(...\) → $...$
const safeContent = computed(() => {
  let processedContent = props.content
    // 块级公式 \[...\] → $$...$$
    .replace(/\\\[(.*?)\\\]/gs, (_, expr) => `$$${expr}$$`)
    // 行内公式 \(...\) → $...$
    .replace(/\\\((.*?)\\\)/gs, (_, expr) => `$${expr}$`)
    
  const html = md.render(processedContent)
  return DOMPurify.sanitize(html)
})
</script>

<style scoped lang="stylus">
/* 防止公式溢出容器 */
:deep(.katex-display)
  overflow-x: auto
  overflow-y: hidden
  padding 0.5rem 0
</style>
