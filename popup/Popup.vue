<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {useAuthStore} from '../stores/auth';
import {useIpoStore} from '../stores/ipos';
import TheHeader from "../components/TheHeader.vue";
import IpoList from '../components/IpoList.vue';
import AddToCalendar from '../components/AddToCalendar.vue';
import IpoPortfolio from '../components/IpoPortfolio.vue';

const authStore = useAuthStore();
const ipoStore = useIpoStore();

const activeView = ref('IpoList');

function handleViewChange(viewName: string) {
  activeView.value = viewName;
}


onMounted(() => {
  authStore.initialize();
});

watch(() => authStore.isAuthenticated, (isAuth) => {
  // Always fetch IPOs if the user is logged in, regardless of the view
  if (true) {
    ipoStore.fetchIpos();
  }
}, {immediate: true});
</script>

<template>
  <div class="popup-container">
    <!--    <div v-if="authStore.isLoading" class="state-container">-->
    <!--      <div class="spinner"></div>-->
    <!--    </div>-->

    <div class="main-view">
      <TheHeader @viewChange="handleViewChange"/>

      <IpoList v-show="activeView==='IpoList'"/>
      <AddToCalendar v-show="activeView==='AddToCalendar'"/>
      <IpoPortfolio v-show="activeView==='IpoPortfolio'"/>
    </div>
  </div>
</template>

<style scoped>
.popup-container {
  width: 380px;
  height: 600px;
  background-color: #0F172A;
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
</style>