import { createPinia } from 'pinia'; // 1. 引入 createPinia
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

const pinia = createPinia() // 2. 創建 Pinia 實例
app.use(pinia)              // 3. 必須在 mount 之前掛載 Pinia

app.use(router)
app.mount('#app')           // 4. 最後再掛載應用