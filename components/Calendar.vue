<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import Login from './Login.vue';
const authStore = useAuthStore();
</script>

<template>
  <div class="feature-view">
    <Login v-if="!authStore.isAuthenticated"/>

    <div v-else>
      <h2>Hello from Calendar</h2>
      <p>This is where the manual "Calendar" feature will live.</p>
    </div>

  </div>
</template>

<style scoped>
.feature-view { padding: 24px; text-align: center; }
</style>