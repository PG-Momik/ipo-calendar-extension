<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useIpoStore } from '../stores/ipos';
import Login from '../components/Login.vue';
import IpoList from '../components/IpoList.vue';

const authStore = useAuthStore();
const ipoStore = useIpoStore();
const activeView = ref('dashboard'); // 'dashboard' or 'ipos'

onMounted(() => {
  authStore.initialize();
  // Tell the IPO store to start listening for real-time changes
  ipoStore.listenForUpdates();
});

// When the user authenticates, fetch the initial IPO list
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    ipoStore.fetchIpos();
  } else {
    // Clear IPOs on logout to prevent showing stale data
    ipoStore.ipos = [];
  }
});

function showIpoList() {
  activeView.value = 'ipos';
}
</script>

<template>
  <div class="popup-container">
    <!-- Loading State -->
    <div v-if="authStore.isLoading" class="state-container state-container--loading">
      <div class="spinner"></div>
      <p class="loading-text">Loading...</p>
    </div>

    <div v-else class="content-wrapper">
      <!-- Unauthenticated State -->
      <Login v-if="!authStore.isAuthenticated" />

      <!-- Authenticated State -->
      <div v-else class="dashboard">
        <header class="dashboard__header">
          <div class="user-info">
            <div class="user-info__avatar">{{ authStore.user?.name.charAt(0) }}</div>
            <span class="user-info__welcome">Welcome, {{ authStore.user?.name.split(' ')[0] }}</span>
          </div>
          <button @click="authStore.logout()" class="logout-button" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l-3-3m0 0l-3 3m3-3V12" />
            </svg>
          </button>
        </header>

        <!-- Main Content (Switches between Dashboard and IPO List) -->
        <main v-if="activeView === 'dashboard'" class="dashboard__main">
          <div class="metrics-grid">
            <div class="metric-card">
              <span class="metric-card__value">{{ ipoStore.ipos.length }}</span>
              <span class="metric-card__label">Upcoming IPOs</span>
            </div>
            <div class="metric-card">
              <span class="metric-card__value">0</span>
              <span class="metric-card__label">In Your Calendar</span>
            </div>
          </div>
          <button @click="showIpoList" class="view-all-button">View All IPOs</button>
        </main>

        <main v-else-if="activeView === 'ipos'" class="ipo-view">
          <button @click="activeView = 'dashboard'" class="back-button">&larr; Back to Dashboard</button>
          <IpoList />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

.popup-container { width: 350px; min-height: 450px; background-color: #2C2828; color: #F1F5F9; font-family: 'Poppins', sans-serif; display: flex; align-items: center; justify-content: center; }
.content-wrapper { width: 100%; height: 100%; padding: 24px; display: flex; flex-direction: column; }
.state-container--loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
.loading-text { font-weight: 500; color: #94A3B8; }
.spinner { width: 32px; height: 32px; border: 3px solid #4A4545; border-top-color: #3B82F6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.dashboard { width: 100%; height: 100%; display: flex; flex-direction: column; }
.dashboard__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.user-info { display: flex; align-items: center; gap: 12px; }
.user-info__avatar { width: 36px; height: 36px; border-radius: 50%; background-color: #3B82F6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; }
.user-info__welcome { font-weight: 500; color: #CBD5E1; }
.logout-button { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #383434; border: none; border-radius: 8px; color: #94A3B8; cursor: pointer; transition: all 200ms ease-in-out; }
.logout-button:hover { background: #4A4545; color: white; transform: scale(1.05); }
.logout-button svg { width: 18px; height: 18px; }
.dashboard__main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.ipo-view { display: flex; flex-direction: column; gap: 16px; height: 100%; }
.back-button { background: none; border: none; color: #94A3B8; font-weight: 500; cursor: pointer; align-self: flex-start; padding: 4px 0; }
.back-button:hover { color: #F1F5F9; }
.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.metric-card { background-color: #383434; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 4px; border: 1px solid #4A4545; }
.metric-card__value { font-size: 2rem; font-weight: 600; color: white; }
.metric-card__label { font-size: 0.8125rem; font-weight: 400; color: #94A3B8; }
.view-all-button { width: 100%; padding: 12px; background: linear-gradient(to right, #3B82F6, #60A5FA); color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: all 0.2s; margin-top: 16px; }
.view-all-button:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25); }
</style>