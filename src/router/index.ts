import ChatWidget from '@/views/ChatWidget.vue'
import Home from '@/views/Home.vue'
import ScraperConfig from '@/views/ScraperConfig.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatWidget
  },
  {
    path: '/scraper-config',
    name: 'ScraperConfig',
    component: ScraperConfig
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router