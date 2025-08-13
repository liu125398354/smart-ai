<template>
  <div class="markdown-body" v-html="testHtml"></div>
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


// 使用示例
const rawContent =
    "### **1. 极限定义（标准定义）**\n" +
    "函数 \\( f(x) \\) 在点 \\( x = a \\) 处的导数记作 \\( f'(a) \\) 或 \\( \\frac{df}{dx}\\bigg|_{x=a} \\)，定义为：\n\n" +
    "\\[\n" +
    "f'(a) = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}\n" +
    "\\]\n" +
    "如果该极限存在，则称 \\( f(x) \\) 在 \\( x = a \\) 处**可导**。";
let testHtml
try {
  testHtml = md.render(rawContent);
} catch (error) {
  console.log("error--->", error)
}



// // 使用 KaTeX 插件
// md.use(mk, {
//   // // 行内公式分隔符配置
//   // inlineMath: [
//   //   ["\\(", "\\)"], // 反斜杠语法
//   //   ["$", "$"] // 可选：保留美元符号语法
//   // ],
//   //
//   // // 块级公式分隔符配置
//   // displayMath: [
//   //   ["\\\\[", "\\\\]"], // 双反斜杠块语法
//   //   ["$$", "$$"] // 可选：保留双美元符号
//   // ],
//   throwOnError: false, // 公式错误时不抛出异常
//   // KaTeX 原生选项
//   // katexOptions: {
//   //   strict: false, // 宽松解析模式
//   //   macros: {
//   //     // 自定义宏
//   //     "\\RR": "\\mathbb{R}"
//   //   }
//   // },
//   // 启用多种分隔符
//   delimiters: {
//     inline: [
//       { left: '$', right: '$', display: false },
//       { left: '\\(', right: '\\)', display: false }
//     ],
//     block: [
//       { left: '$$', right: '$$', display: true },
//       { left: '\\[', right: '\\]', display: true }
//     ]
//   },
//   errorColor: "#cc0000", // 错误公式显示颜色
//   // displayMode: true, // 确保块级公式使用 katex-display
//   output: "mathml" // 解决类名缺失问题
// })

/* 计算属性 */
const safeContent = computed(() => {
  try {
    const rendered = md.render(props.content)
    return DOMPurify.sanitize(rendered)
  } catch (error) {
    console.error("Markdown渲染错误:", error)
    return `<div class="error">内容渲染失败</div>`
  }
})
</script>

<style scoped lang="stylus"></style>
