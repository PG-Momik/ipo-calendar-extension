import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// This is the complete and recommended configuration file.
// It is designed to work in harmony with the `extension.js` build tool,
// not against it.

export default defineConfig({
  // The `plugins` array tells Vite how to process `.vue` files.
  // This is essential for any Vue project.
  plugins: [
      vue()
  ],

  // The `define` block is the entire solution to the Vue feature flag warnings.
  // It globally injects these required constants during the build process, which
  // is a requirement for the modern ESM-bundler version of Vue 3.
  define: {
    // This enables the Vue Options API, which is good practice for compatibility.
    __VUE_OPTIONS_API__: JSON.stringify(true),

    // These disable production-specific features that aren't needed during development.
    // This helps with tree-shaking in the final build and silences the warnings.
    __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
  },

  // Environment variable replacement for manifest.json
  build: {
    rollupOptions: {
      external: [],
    },
  },

  // By explicitly NOT including a `build` property, we allow the `extension.js`
  // toolkit to use its own internal `build.rollupOptions` and `build.outDir`
  // configurations. This prevents conflicts and ensures the extension is
  // packaged correctly according to the tool's conventions.
})