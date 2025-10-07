import { createRouter, createWebHashHistory } from "vue-router"
import Layout from "../layouts/index"
const routes = [
  {
    path: "/",
    component: Layout,
    name: "",
    redirect: "chat",
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
    children: [
      {
        path: "drawing",
        name: "drawing",
        component: () => import(/* webpackChunkName: "about" */ "../views/drawing/drawing")
      }
    ]
  },
  {
    path: "/",
    component: Layout,
    name: "",
    children: [
      {
        path: "charts",
        name: "charts",
        component: () => import(/* webpackChunkName: "about" */ "../views/charts/charts")
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
