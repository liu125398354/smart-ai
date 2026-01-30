module.exports = {
	root: true,

	env: {
		browser: true,
		node: true,
		es2021: true
	},

	globals: {
		uni: 'readonly',
		wx: 'readonly',
		plus: 'readonly',
		getApp: 'readonly',
		getCurrentPages: 'readonly',

		// Vue3 <script setup> 宏
		defineProps: 'readonly',
		defineEmits: 'readonly',
		defineExpose: 'readonly',
		withDefaults: 'readonly'
	},

	plugins: ['vue'],

	extends: [
		'eslint:recommended',
		'plugin:vue/vue3-recommended'
	],

	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},

	rules: {
		// === 基础放宽 ===
		'no-console': 'off',
		'no-debugger': 'off',

		// template / script 中未使用变量：警告
		'vue/no-unused-vars': 'warn',
		// 空代码块在 try / catch / 占位逻辑中非常常见
		'no-empty': 'off',
		// === Vue3 / uni-app 常见 ===
		'vue/multi-word-component-names': 'off',
		'vue/no-mutating-props': 'off',

		// setup 常用
		'vue/no-setup-props-destructure': 'off',

		// 模板中允许 v-html（uni-app 常用）
		'vue/no-v-html': 'off'
	}
}