module.exports = {
  root: true,

  env: {
    browser: true,
    node: true,
    es2021: true
  },

  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'plugin:prettier/recommended'],

  rules: {
    /* =========================
     * 基础 JS 行为规则
     * ========================= */

    // 生产环境禁止 console / debugger，开发环境允许
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // 未使用变量：警告即可（开发阶段非常常见）
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],

    // 有些动态注入 / 全局变量项目会用到
    'no-undef': 'warn',

    // 空代码块在 try / catch / 占位逻辑中非常常见
    'no-empty': 'off',

    /* =========================
     * Vue 专属规则（重点）
     * ========================= */

    // 允许单词组件名（index.vue / login.vue / 404.vue）
    'vue/multi-word-component-names': 'off',

    // template / script 中未使用变量：警告
    'vue/no-unused-vars': 'warn',

    // 组件未使用：警告即可（异步组件、动态组件很多）
    'vue/no-unused-components': 'warn',

    // 允许在业务中修改 props（很多老项目、表单场景需要）
    'vue/no-mutating-props': 'off',

    // v-html 风险你是知道的，用 DOMPurify 即可
    'vue/no-v-html': 'off',

    // setup 语法糖下，props / emit 经常“看起来没用”
    'vue/script-setup-uses-vars': 'off',

    /* =========================
     * 格式相关（交给 Prettier）
     * ========================= */

    // 所有格式问题统一降级为 warning
    'prettier/prettier': 'warn'
  }
}
