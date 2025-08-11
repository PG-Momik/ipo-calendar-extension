<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import Login from '../components/Login.vue';

const authStore = useAuthStore();

// When the popup opens, initialize the auth store
onMounted(() => {
  authStore.initialize();
});
</script>

<template>
  <div style="width: 350px; padding: 1rem;">
    <div v-if="authStore.isLoading">
      <p>Loading...</p>
    </div>
    <div v-else>
      <div v-if="authStore.isAuthenticated">
        <!-- This is where the main app UI will go -->
        <h2>Welcome, {{ authStore.user.name }}!</h2>
        <button @click="authStore.logout()">Logout</button>
      </div>
      <Login v-else />
    </div>
  </div>
</template>