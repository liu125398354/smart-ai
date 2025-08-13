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

md.use(texmath, {
  engine: katex,
  delimiters: ["dollars", "brackets", "doxygen", "gitlab", "julia", "kramdown", "beg_end"],
  katexOptions: {
    strict: false,
    output: "html",
    macros: {
      "\\diag": "\\operatorname{diag}",
      "\\rank": "\\operatorname{rank}"
    },
    throwOnError: false,
    errorColor: "#cc0000"
  }
})

// 修正公式前后的空行
function fixBlockMathNewlines(mdText) {
  // 处理 \[ 前面换行
  mdText = mdText.replace(/(\n*)\\\[/g, (match, prevNewlines) => {
    const count = prevNewlines.length
    if (count >= 2) {
      return prevNewlines + "\\[" // 已经够两个换行
    } else {
      return "\n".repeat(2) + "\\[" // 不够补齐到两个换行
    }
  })

  // 处理 \] 后面至少一个换行
  mdText = mdText.replace(/\\\](?!\n)/g, "\\]\n")

  return mdText
}

/* 计算属性 */
const safeContent = computed(() => {
  try {
    const rendered = md.render(fixBlockMathNewlines(props.content))
    return DOMPurify.sanitize(rendered)
  } catch (error) {
    console.error("Markdown渲染错误:", error)
    return `<div class="error">内容渲染失败</div>`
  }
})
</script>

<style scoped lang="stylus">
/* 防止公式溢出容器 */
:deep(.katex-display)
  overflow-x: auto
  overflow-y: hidden
  padding 0.5rem 0
</style>
