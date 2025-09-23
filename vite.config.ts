import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
      vue()
  ],
  define: {
    __VUE_OPTIONS_API__: JSON.stringify(true),
    __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
  test: {
    environment: 'jsdom', // or 'happy-dom'
    setupFiles: ['./vitest.setup.ts'],
    globals: true, // if you want to use global test functions without imports
  },
})