<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import Login from './Login.vue';
const authStore = useAuthStore();
</script>

<template>
  <div class="feature-view">
    <div v-if="authStore.isAuthenticated">
      <h2>Hello from Add to Calendar</h2>
      <p>This is where the manual "Add to Calendar" feature will live.</p>
    </div>
    <Login v-else />
  </div>
</template>

<style scoped>
.feature-view { padding: 24px; text-align: center; }
</style>