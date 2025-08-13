import '../popup/styles.css' 
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Options from './Options.vue'

// 1. Create the Pinia instance first. This is crucial for avoiding the "no active Pinia" error.
const pinia = createPinia()

// 2. Create the Vue app, passing in our root component.
const app = createApp(Options)

// 3. Tell the Vue app to use the Pinia instance we just created.
// This makes all the stores available to any component in the app.
app.use(pinia)

// 4. Mount the entire application to the DOM.
app.mount('#app')