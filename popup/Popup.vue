<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useIpoStore } from '../stores/ipos';
import Login from '../components/Login.vue';
import IpoList from '../components/IpoList.vue';

const authStore = useAuthStore();
const ipoStore = useIpoStore();

onMounted(() => {
  authStore.initialize();
});

// Fetch IPOs once the user is authenticated
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    ipoStore.fetchIpos();
  }
}, { immediate: true });
</script>

<template>
  <div class="popup-container">
    <div v-if="authStore.isLoading" class="state-container">
      <div class="spinner"></div>
    </div>
    <Login v-else-if="!authStore.isAuthenticated" />
    <IpoList v-else />
  </div>
</template>

<style scoped>
.popup-container {
  padding: 4px;
  width: 380px;
  height: 600px;
  background: rgba(10, 10, 11, 0.85);
  color: #E4E4E7;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* This is a generic container for both Login and IpoList to live in */
.popup-container > *:not(.state-container) {
  flex: 1;
  overflow: hidden;
}

.state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #27272A;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>