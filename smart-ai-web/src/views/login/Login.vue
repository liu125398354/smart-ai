<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>智能AI助手</h1>
        <p>欢迎登录您的AI助手平台</p>
      </div>

      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        class="login-form"
        @finish="handleLogin"
      >
        <a-form-item name="username">
          <a-input
            size="large"
            v-model:value="formState.username"
            placeholder="请输入用户名或邮箱"
            @pressEnter="handleLogin"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password">
          <a-input-password
            size="large"
            v-model:value="formState.password"
            placeholder="请输入密码"
            @pressEnter="handleLogin"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            size="large"
            html-type="submit"
            :loading="loading"
            block
            class="login-button"
          >
            {{ loading ? "登录中..." : "登录" }}
          </a-button>
        </a-form-item>

        <div class="login-footer">
          <a @click="showRegister = true">立即注册</a>
          <a href="#" style="margin-left: 20px">忘记密码？</a>
        </div>
      </a-form>
    </div>

    <!-- 注册模态框 -->
    <a-modal
      v-model:open="showRegister"
      title="用户注册"
      @ok="handleRegister"
      :confirm-loading="registerLoading"
    >
      <a-form :model="registerForm" :rules="registerRules" ref="registerFormRef">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="registerForm.username" />
        </a-form-item>

        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="registerForm.email" />
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="registerForm.password" />
        </a-form-item>

        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password v-model:value="registerForm.confirmPassword" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue"
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue"
import { message } from "ant-design-vue"
import { useRouter } from "vue-router"
import { useStore } from "vuex"
import api from "@/api/auth"
import { saveToLocal } from "@/utils/index"
import CryptoJS from "crypto-js"

const router = useRouter()
const store = useStore()
const formRef = ref()
const registerFormRef = ref()
const loading = ref(false)
const registerLoading = ref(false)
const showRegister = ref(false)

// 登录表单数据
const formState = reactive({
  username: "",
  password: ""
})

// 登录表单规则
const rules = {
  username: [{ required: true, message: "请输入用户名或邮箱" }],
  password: [{ required: true, message: "请输入密码" }]
}

// 注册表单数据
const registerForm = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: ""
})

// 注册表单规则
const registerRules = {
  username: [{ required: true, message: "请输入用户名" }],
  email: [
    { required: true, message: "请输入邮箱" },
    { type: "email", message: "请输入有效的邮箱地址" }
  ],
  password: [
    { required: true, message: "请输入密码" },
    { min: 6, message: "密码至少6位" }
  ],
  confirmPassword: [
    { required: true, message: "请确认密码" },
    {
      validator: (_, value) => {
        if (value && value !== registerForm.password) {
          return Promise.reject("两次输入的密码不一致")
        }
        return Promise.resolve()
      }
    }
  ]
}

// 处理登录
const handleLogin = async () => {
  try {
    loading.value = true
    await formRef.value.validate()

    // 对密码进行SHA256哈希处理
    const hashedPassword = CryptoJS.SHA256(formState.password).toString()

    const res = await api.login({
      username: formState.username,
      password: hashedPassword
    })

    if (res.success) {
      store.commit("setToken", res.data.token)
      store.commit("setUserInfo", res.data.user)

      message.success("登录成功")
      router.push("/chat")
    } else {
      message.error(res.message || "登录失败")
    }
  } catch (err) {
    console.error("登录错误:", err)
    message.error("登录失败，请检查用户名和密码")
  } finally {
    loading.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  try {
    registerLoading.value = true
    await registerFormRef.value.validate()

    // 对密码进行SHA256哈希处理
    const hashedPassword = CryptoJS.SHA256(registerForm.password).toString()

    const res = await api.register({
      username: registerForm.username,
      email: registerForm.email,
      password: hashedPassword
    })

    if (res.success) {
      message.success("注册成功")
      showRegister.value = false
      // 清空注册表单
      Object.keys(registerForm).forEach((key) => {
        registerForm[key] = ""
      })
    } else {
      message.error(res.message || "注册失败")
    }
  } catch (err) {
    console.error("注册错误:", err)
    message.error("注册失败")
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped lang="stylus">
.login-container
  display flex
  justify-content center
  align-items center
  min-height 100vh
  background linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  padding 20px

  .login-box
    width 100%
    max-width 400px
    padding 40px 30px
    background rgba(255, 255, 255, 0.95)
    border-radius 10px
    box-shadow 0 15px 35px rgba(0, 0, 0, 0.2)

    .login-header
      text-align center
      margin-bottom 30px

      h1
        font-size 28px
        color #333
        margin-bottom 10px

      p
        color #666
        font-size 14px

    .login-form
      .login-button
        margin-top 10px

    .login-footer
      display flex
      justify-content space-between
      margin-top 15px

      a
        color #667eea
        cursor pointer
        font-size 14px

        &:hover
          text-decoration underline
</style>
