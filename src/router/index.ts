import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/editor'
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/Editor/index.vue')
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/Reports/index.vue')
    },
    {
      path: '/templates',
      name: 'templates',
      component: () => import('@/views/Templates/index.vue')
    },
    {
      path: '/template/:id',
      name: 'template-view',
      component: () => import('@/components/TemplateViewer/TemplateViewer.vue')
    }
  ]
})

export default router
