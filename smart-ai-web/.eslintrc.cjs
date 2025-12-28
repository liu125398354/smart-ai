module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: ["eslint:recommended", 'plugin:vue/vue3-recommended'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // Vue
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'warn',
    'vue/no-unused-components': 'warn',
    'vue/no-mutating-props': 'off',

    // JS
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'no-empty': 'warn'
  }
}
