module.exports = {
  // 一行最大长度
  printWidth: 100,

  // 使用 2 空格缩进
  tabWidth: 2,
  useTabs: false,

  // 语句末尾不加分号
  semi: false,

  // 字符串使用单引号
  singleQuote: true,

  // JSX / Vue template 中也使用单引号
  jsxSingleQuote: true,

  // 对象、数组等末尾不加逗号（避免 diff 噪音）
  trailingComma: 'none',

  // 对象花括号内是否加空格 { foo: bar }
  bracketSpacing: true,

  // HTML / Vue 标签的 > 是否换行
  bracketSameLine: false,

  // 箭头函数只有一个参数时也加括号
  arrowParens: 'always',

  // HTML / Vue 中的空格敏感度
  htmlWhitespaceSensitivity: 'ignore',

  // 是否强制每个属性一行（false = 交给 printWidth 决定）
  singleAttributePerLine: false,

  // 换行符，统一 LF，避免 Windows / Linux 冲突
  endOfLine: 'lf',

  // 嵌入语言格式化（如 <style>、<script>）
  embeddedLanguageFormatting: 'auto'
}
