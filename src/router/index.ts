import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/games',
            name: 'games',
            // lazy-loaded route
            component: () => import('../views/GamesView.vue')
        },
        {
            path: '/news',
            name: 'news',
            component: () => import('../views/NewsView.vue')
        },
        {
            path: '/help',
            name: 'help',
            component: () => import('../views/HelpView.vue')
        },
        {
            path: '/activity',
            name: 'activity',
            component: () => import('../views/ActivityView.vue')
        },
        {
            path: '/discount',
            name: 'discount',
            component: () => import('../views/DiscountView.vue')
        },
        {
            path: '/sell',
            name: 'sell',
            component: () => import('../views/SellView.vue')
        },
        {
            path: '/contact',
            name: 'contact',
            component: () => import('../views/ContactView.vue')
        }
    ]
})

export default router