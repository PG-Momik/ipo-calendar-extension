<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from 'vue';
import dayjs from 'dayjs';
import IpoCard from "./IpoCard.vue";
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import {useAuthStore} from "../stores/auth";
import {Ipo, useIpoStore} from '../stores/ipos';
import ConfirmModal from "./ConfirmModal.vue";

dayjs.extend(relativeTime);
dayjs.extend(isBetween);

const emit = defineEmits(['showToast']);

const authStore = useAuthStore();
const ipoStore = useIpoStore();

const activeTab = ref<'thisWeek' | 'upcoming' | 'pipeline'>('thisWeek');

const transitionDirection = ref('slide-left');
const tabsContainer = ref<HTMLElement | null>(null);
const activeTabIndicator = ref<HTMLElement | null>(null);

const calendarModal = ref({
  isVisible: false,
  withGoogleEvent: true,
});
const portfolioModal = ref({
  isVisible: false,
});

const selectedIpo = ref<Ipo | null>(null);
const loadingIpoId = ref<number | null>(null);

const thisWeekIpos = computed(() => {
  const now = dayjs();
  const endOfWeek = now.endOf('week');

  return ipoStore.ipos.filter(ipo => dayjs(ipo.startDate).isBefore(endOfWeek));
});
const upcomingIpos = computed(() => {
  const now = dayjs();
  const endOfWeek = now.endOf('week');
  const endOfNextMonth = now.add(1, 'month').endOf('month');

  return ipoStore.ipos.filter(ipo => {
    const ipoStartDate = dayjs(ipo.startDate);
    return ipoStartDate.isAfter(endOfWeek) && ipoStartDate.isBefore(endOfNextMonth);
  });
});
const pipelineIpos = computed(() => {
  const now = dayjs();
  const endOfNextMonth = now.add(1, 'month').endOf('month');

  return ipoStore.ipos.filter(ipo => {
    const ipoStartDate = dayjs(ipo.startDate);
    return ipoStartDate.isAfter(endOfNextMonth);
  });
});
const currentIpos = computed(() => {
  switch (activeTab.value) {
    case 'thisWeek':
      return thisWeekIpos.value;
    case 'upcoming':
      return upcomingIpos.value;
    case 'pipeline':
      return pipelineIpos.value;
    default:
      return [];
  }
});

function switchTab(newTab: 'thisWeek' | 'upcoming' | 'pipeline') {
  const tabs = ['thisWeek', 'upcoming', 'pipeline'];
  const currentIndex = tabs.indexOf(activeTab.value);
  const newIndex = tabs.indexOf(newTab);
  transitionDirection.value = newIndex > currentIndex ? 'slide-left' : 'slide-right';
  activeTab.value = newTab;
}

function updateIndicatorPosition() {
  if (!tabsContainer.value || !activeTabIndicator.value) return;
  const activeTabElement = tabsContainer.value.querySelector('button.active') as HTMLElement;
  if (activeTabElement) {
    const containerRect = tabsContainer.value.getBoundingClientRect();
    const activeRect = activeTabElement.getBoundingClientRect();
    activeTabIndicator.value.style.width = `${activeRect.width}px`;
    activeTabIndicator.value.style.transform = `translateX(${activeRect.left - containerRect.left}px)`;
  }
}

function handleAddToCalendar(ipo: Ipo) {
  console.log('eta');
  console.log(authStore);
  if (!authStore.isAuthenticated) {
    redirectToLogin()
    return;
  }

  selectedIpo.value = ipo;
  calendarModal.value.isVisible = true;
}

async function confirmAddToCalendar() {
  if (!selectedIpo.value) return;

  const ipoToProcess = selectedIpo.value;
  const shouldCreateGoogleEvent = calendarModal.value.withGoogleEvent;

  calendarModal.value.isVisible = false;
  loadingIpoId.value = ipoToProcess.id;

  const response = await ipoStore.addToCalendar(ipoToProcess.id, authStore.token, shouldCreateGoogleEvent);
  emit('showToast', { message: response.message, type: response.status });

  loadingIpoId.value = null;
}

function handleAddToPortfolio(ipo: Ipo) {
  if (!authStore.isAuthenticated) {
    redirectToLogin()
    return;
  }
  selectedIpo.value = ipo;
  portfolioModal.value.isVisible = true;
}

async function confirmAddToPortfolio() {
  if (!selectedIpo.value) return;

  const ipoToProcess = selectedIpo.value;
  portfolioModal.value.isVisible = false;
  loadingIpoId.value = ipoToProcess.id;

  const response = await ipoStore.addToPortfolio(ipoToProcess.id, authStore.token);
  emit('showToast', { message: response.message, type: response.status });

  loadingIpoId.value = null;
}

function redirectToLogin(){
  emit('showToast', {
    message: 'Login to use this feature.',
    type: 'warning'
  });

  changeView('Login')

  return;
}

function changeView(viewName: string) {
  emit('viewChange', viewName);
}

onMounted(() => {
  updateIndicatorPosition();
});

watch(activeTab, async () => {
  await nextTick();
  updateIndicatorPosition();
}, {immediate: true});

</script>

<template>
  <div class="list-view">
    <nav class="tabs" ref="tabsContainer">
      <button @click="switchTab('thisWeek')" :class="{ 'active': activeTab === 'thisWeek' }">This Week</button>
      <button @click="switchTab('upcoming')" :class="{ 'active': activeTab === 'upcoming' }">Upcoming</button>
      <button @click="switchTab('pipeline')" :class="{ 'active': activeTab === 'pipeline' }">Pipeline</button>
      <div class="active-tab-indicator" ref="activeTabIndicator"></div>
    </nav>

    <div class="content">
      <div v-if="ipoStore.isLoading" class="loading-bar-container">
        <div class="loading-bar"></div>
      </div>

      <div v-else-if="ipoStore.error" class="state-message error">Could not load IPOs.</div>

      <Transition :name="transitionDirection" mode="out-in">
        <div :key="activeTab" class="ipo-list-wrapper">
          <div v-if="!currentIpos.length && !ipoStore.isLoading" class="state-message">
            No IPOs in this category.
          </div>

          <div v-else class="ipo-list">
            <IpoCard
                v-for="(ipo, index) in currentIpos"
                :key="ipo.id"
                :ipo="ipo"
                :active-tab="activeTab"
                :index="index"
                :is-loading="loadingIpoId === ipo.id"
                @add-to-calendar="handleAddToCalendar(ipo)"
                @add-to-portfolio="handleAddToPortfolio(ipo)"
            />
          </div>

        </div>
      </Transition>

    </div>

    <ConfirmModal
        :show="calendarModal.isVisible"
        title="Add to Your Calendar?"
        message="This will track the IPO in your list and can optionally create an event in your Google Calendar."
        confirmText="Continue"
        @confirm="confirmAddToCalendar"
        @cancel="calendarModal.isVisible = false"
    >
      <template #extra-options>
        <div class="checkbox-wrapper">
          <input type="checkbox" id="google-event-checkbox" v-model="calendarModal.withGoogleEvent">
          <label for="google-event-checkbox">Also create Google Calendar event</label>
        </div>
      </template>
    </ConfirmModal>

    <ConfirmModal
        :show="portfolioModal.isVisible"
        title="Add to Portfolio?"
        message="This will add the IPO to your portfolio with a default of 10 units at the issue price. You can edit this later."
        confirmText="Continue"
        @confirm="confirmAddToPortfolio"
        @cancel="portfolioModal.isVisible = false"
    />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.list-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.tabs {
  position: relative;
  display: flex;
  padding: 0 20px;
  gap: 24px;
  border-bottom: 1px solid #27272A;
  flex-shrink: 0;
}

.tabs button {
  background: none;
  border: none;
  color: #71717A;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 12px 0;
  cursor: pointer;
  transition: color 150ms ease;
  position: relative;
  z-index: 1;
}

.tabs button:hover {
  color: #E4E4E7;
}

.tabs button.active {
  color: #FFFFFF;
}

.active-tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 2px;
  background-color: #3B82F6;
  border-radius: 1px;
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* --- CONTENT & LIST --- */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

.content::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

.ipo-list {
  padding-top: 16px;
}

/* --- ANIMATIONS & STATES --- */
.slide-left-enter-active, .slide-right-enter-active {
  transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-leave-active, .slide-right-leave-active {
  transition: opacity 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from, .slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.slide-left-leave-to, .slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.loading-bar-container {
  width: 100%;
  padding: 48px 0;
}

.loading-bar {
  position: relative;
  width: 80%;
  height: 4px;
  margin: 0 auto;
  background-color: #27272A;
  border-radius: 2px;
  overflow: hidden;
}

.loading-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 50%;
  background-color: #3B82F6;
  border-radius: 2px;
  animation: loading-bar-animation 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes loading-bar-animation {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(150%);
  }
  100% {
    transform: translateX(-100%);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.state-message {
  text-align: center;
  color: #71717A;
  padding: 48px 0;
}

.state-message.error {
  color: #F87171;
}

.checkbox-wrapper {
  margin-top: 16px;
  margin-bottom: 16px;
  padding-top: 16px;
  padding-bottom: 16px;
  border-top: 1px solid #27272A;
  display: flex;
  align-items: center;
  gap: 12px;
}

#google-event-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3B82F6;
}

.checkbox-wrapper label {
  font-size: 0.875rem;
  color: #A1A1AA;
  cursor: pointer;
}

</style>