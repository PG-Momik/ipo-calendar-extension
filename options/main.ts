// popup/main.ts (Corrected Version)

import './styles.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Popup from './Popup.vue'

// 1. Create the Pinia instance first.
const pinia = createPinia()

// 2. Create the Vue app.
const app = createApp(Popup)

// 3. Tell the app to use the Pinia instance we already created.
app.use(pinia)

// 4. Mount the app.
app.mount('#app')