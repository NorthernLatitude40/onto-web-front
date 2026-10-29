import Chat from '@/views/Chat.vue'
import Home from '@/views/Home.vue'
import ScraperConfig from '@/views/ScraperConfig.vue'
import FieldMappingDemo from '@/views/FieldMappingDemo.vue'
import FieldMappingTest from '@/views/FieldMappingTest.vue'
import TestSelectView from '@/views/TestSelectView.vue'
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
    component: Chat
  },
  {
    path: '/scraper-config',
    name: 'ScraperConfig',
    component: ScraperConfig
  },
  {
    path: '/field-mapping-demo',
    name: 'FieldMappingDemo',
    component: FieldMappingDemo
  },
  {
    path: '/field-mapping-test',
    name: 'FieldMappingTest',
    component: FieldMappingTest
  },
  {
    path: '/test-select',
    name: 'TestSelectView',
    component: TestSelectView
  },
  {
    path: '/simple-select-test',
    name: 'SimpleSelectTest',
    component: () => import('@/views/SimpleSelectTest.vue')
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router