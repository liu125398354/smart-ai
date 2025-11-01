import { createRouter, createWebHashHistory } from "vue-router"
import Layout from "../layouts/index"

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/login/Login.vue"),
    meta: { requiresGuest: true }
  },
  {
    path: "/",
    component: Layout,
    name: "",
    redirect: "chat",
    meta: { requiresAuth: true },
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    children: [
      {
        path: "chat",
        name: "chat",
        component: () => import(/* webpackChunkName: "about" */ "../views/chat/chat.vue")
      }
    ]
  },
  {
    path: "/",
    component: Layout,
    name: "",
    meta: { requiresAuth: true },
    children: [
      {
        path: "drawing",
        name: "drawing",
        component: () => import(/* webpackChunkName: "about" */ "../views/drawing/drawing")
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token")

  // 需要认证的路由
  if (to.meta.requiresAuth && !token) {
    next("/login")
  }
  // 已登录用户访问登录页时重定向到首页
  else if (to.meta.requiresGuest && token) {
    next("/")
  }
  // 其他情况放行
  else {
    next()
  }
})

export default router
