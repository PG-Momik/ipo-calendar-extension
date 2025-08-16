<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {useAuthStore} from '../stores/auth';
import {useIpoStore} from '../stores/ipos';
import TheHeader from "../components/TheHeader.vue";
import IpoList from '../components/IpoList.vue';
import Calendar from '../components/Calendar.vue';
import IpoPortfolio from '../components/IpoPortfolio.vue';
import Toast from "../components/Toast.vue";
import Login from "../components/Login.vue";
import GoBack from "../components/GoBack.vue";

const authStore = useAuthStore();
const ipoStore = useIpoStore();

const activeView = ref('IpoList');

const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null);

function showToast(payload: { message: string; type: 'success' | 'error' }) {
  console.log('came');
  toast.value = {message: payload.message, type: payload.type};
  setTimeout(() => {
    toast.value = null;
  }, 2000);
  console.log('done');
}

function handleViewChange(viewName: string) {
  activeView.value = viewName;
}

onMounted(() => {
  authStore.initialize();
});

watch(() => authStore.isAuthenticated, () => {
  ipoStore.fetchIpos(authStore.token ?? null);
}, {immediate: true});

</script>

<template>
  <div class="popup-container">
    <div class="main-view">
      <TheHeader
          @viewChange="handleViewChange"
          @showToast="showToast"
      />

      <IpoList
          v-show="activeView==='IpoList'"
          @showToast="showToast"
          @viewChange="handleViewChange"
      />

      <Calendar
          v-show="activeView==='Calendar'"
          @showToast="showToast"
          @viewChange="handleViewChange"
      />

      <IpoPortfolio
          v-show="activeView==='IpoPortfolio'"
          @showToast="showToast"
          @viewChange="handleViewChange"
      />

      <div class="login-wrapper">
        <GoBack v-show="activeView==='Login'" @viewChange="handleViewChange" />
        <Login v-show="activeView==='Login'" @viewChange="handleViewChange" />
      </div>

      <Transition name="toast-fade">
        <Toast
            v-if="toast"
            :message="toast.message"
            :type="toast.type"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.popup-container {
  width: 380px;
  height: 600px;
  background: rgba(10, 10, 11, 0.85);
  color: #E4E4E7;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.content-body {
  flex: 1;
  overflow-y: auto; /* Allow content to scroll if it's too long */
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #27272A;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.login-wrapper{
  padding: 16px;
}
</style>