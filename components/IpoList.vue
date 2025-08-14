<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { type Ipo, useIpoStore } from '../stores/ipos';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(relativeTime);
dayjs.extend(isBetween);

const ipoStore = useIpoStore();
const activeTab = ref<'thisWeek' | 'upcoming' | 'pipeline'>('thisWeek');
const transitionDirection = ref('slide-left');
const tabsContainer = ref<HTMLElement | null>(null);
const activeTabIndicator = ref<HTMLElement | null>(null);

// --- CORRECTED COMPUTED PROPERTIES ---
const thisWeekIpos = computed(() => {
  const now = dayjs();
  const endOfWeek = now.endOf('week');
  // This one was correct: it uses startDate
  return ipoStore.ipos.filter(ipo => dayjs(ipo.startDate).isBefore(endOfWeek));
});

const upcomingIpos = computed(() => {
  const now = dayjs();
  const endOfWeek = now.endOf('week');
  const endOfNextMonth = now.add(1, 'month').endOf('month');
  return ipoStore.ipos.filter(ipo => {
    // BUG FIX: Changed ipo.ipo_date to ipo.startDate
    const ipoStartDate = dayjs(ipo.startDate);
    return ipoStartDate.isAfter(endOfWeek) && ipoStartDate.isBefore(endOfNextMonth);
  });
});

const pipelineIpos = computed(() => {
  const now = dayjs();
  const endOfNextMonth = now.add(1, 'month').endOf('month');
  return ipoStore.ipos.filter(ipo => {
    // BUG FIX: Changed ipo.ipo_date to ipo.startDate
    const ipoStartDate = dayjs(ipo.startDate);
    return ipoStartDate.isAfter(endOfNextMonth);
  });
});

// Returns the correct list based on the active tab
const currentIpos = computed(() => {
  switch (activeTab.value) {
    case 'thisWeek': return thisWeekIpos.value;
    case 'upcoming': return upcomingIpos.value;
    case 'pipeline': return pipelineIpos.value;
    default: return [];
  }
});

// --- Helper functions for dynamic data and styling (No changes below this line) ---

function getIpoStatus(ipo: Ipo): { text: string; class: string } {
  const now = dayjs();
  const start = dayjs(ipo.startDate);
  const end = dayjs(ipo.endDate);

  if (activeTab.value === 'pipeline') {
    return { text: 'Date: TBD', class: 'status--tbd' };
  }
  if (activeTab.value === 'upcoming') {
    return { text: `${start.format('MMM D')} - ${end.format('D')}`, class: 'status--upcoming' };
  }
  if (now.isAfter(end)) {
    return { text: 'Closed', class: 'status--closed' };
  }
  if (now.isBetween(start, end, null, '[]')) {
    const daysRemaining = end.diff(now, 'day');
    if (daysRemaining === 0) return { text: 'Closes Today', class: 'status--ongoing' };
    return { text: `Closes in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`, class: 'status--ongoing' };
  }
  if (start.isAfter(now)) {
    if (start.isSame(now.add(1, 'day'), 'day')) return { text: 'Opens Tomorrow', class: 'status--soon' };
    return { text: `Opens ${start.format('ddd')}`, class: 'status--soon' };
  }
  return { text: 'Status Unknown', class: 'status--tbd' };
}

function getTypeClass(type: Ipo['type']) {
  if (type === 'FPO') return 'type-badge--fpo';
  if (type === 'Mutual Fund') return 'type-badge--mutual';
  return 'type-badge--ipo';
}

function getSubscriptionClass(status: string) {
  if (status.toLowerCase().includes('over')) return 'sub-status--oversubscribed';
  if (status.toLowerCase().includes('under')) return 'sub-status--undersubscribed';
  return '';
}

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

watch(activeTab, async () => {
  await nextTick();
  updateIndicatorPosition();
}, { immediate: true });
</script>

<template>
  <div class="list-view">
    <header class="header">
      <div class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="15" width="4" height="6" rx="1" fill="#FFFFFF"/>
          <rect x="10" y="10" width="4" height="11" rx="1" fill="#FFFFFF"/>
          <rect x="17" y="3" width="4" height="18" rx="1" fill="#FFFFFF"/>
        </svg>
      </div>
      <h1 class="title">IPO Calendar</h1>
      <button class="settings-btn" title="Settings">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>

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
            <div
                class="ipo-card"
                v-for="(ipo, index) in currentIpos"
                :key="ipo.id"
                :style="{ '--delay': `${index * 50}ms` }"
                :class="{ 'is-closed': getIpoStatus(ipo).class === 'status--closed' }"
            >
              <div class="company-logo">{{ ipo.name.charAt(0) }}</div>
              <div class="company-info">
                <div class="company-name-wrapper">
                  <span class="company-name">{{ ipo.name }}</span>
                  <span class="type-badge" :class="getTypeClass(ipo.type)">{{ ipo.type }}</span>
                </div>
                <div class="company-meta">
                  {{ ipo.ticker }} · {{ ipo.minUnits }} Units @ Rs. {{ ipo.pricePerUnit }}
                </div>
              </div>
              <div class="ipo-status" :class="getIpoStatus(ipo).class">
                <span>{{ getIpoStatus(ipo).text }}</span>
                <svg v-if="activeTab !== 'pipeline'" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* --- LAYOUT & HEADER --- */
.list-view {
  display: flex; flex-direction: column; height: 100%;
  font-family: 'Inter', sans-serif; background-color: #0F172A;
}
.header {
  display: flex; align-items: center; padding: 16px 20px;
  border-bottom: 1px solid #27272A; flex-shrink: 0;
}
.logo {
  width: 28px; height: 28px; border-radius: 6px; display: flex;
  align-items: center; justify-content: center; background: #2563EB;
}
.title { font-weight: 600; font-size: 1rem; color: #E4E4E7; margin-left: 12px; }
.settings-btn {
  margin-left: auto; width: 32px; height: 32px; border: none; background: transparent;
  color: #71717A; cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all 150ms ease; border-radius: 6px;
}
.settings-btn:hover { background: #27272A; color: #E4E4E7; }

/* --- TABS --- */
.tabs {
  position: relative; display: flex; padding: 0 20px; gap: 24px;
  border-bottom: 1px solid #27272A; flex-shrink: 0;
}
.tabs button {
  background: none; border: none; color: #71717A; font-family: 'Inter', sans-serif;
  font-weight: 500; font-size: 0.875rem; padding: 12px 0;
  cursor: pointer; transition: color 150ms ease; position: relative; z-index: 1;
}
.tabs button:hover { color: #E4E4E7; }
.tabs button.active { color: #FFFFFF; }
.active-tab-indicator {
  position: absolute; bottom: -1px; left: 0; height: 2px;
  background-color: #3B82F6; border-radius: 1px;
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* --- CONTENT & LIST --- */
.content { flex: 1; overflow-y: auto; padding: 0 12px; }
.content::-webkit-scrollbar { width: 0; background: transparent; }
.ipo-list { padding-top: 16px; }

/* --- IPO CARD --- */
.ipo-card {
  background: #18181B; border-radius: 12px; padding: 16px;
  margin-bottom: 12px; border: 1px solid #27272A;
  transition: all 150ms ease; cursor: pointer;
  display: flex; align-items: center; gap: 12px;
  animation: fade-in-up 0.5s both cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-delay: var(--delay);
}
.ipo-card:hover { border-color: #3F3F46; background: #202023; }
.ipo-card.is-closed { opacity: 0.5; background: #111113; }
.ipo-card.is-closed:hover { opacity: 0.7; }

.company-logo {
  width: 40px; height: 40px; background: #27272A; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 1.125rem; color: #A1A1AA; flex-shrink: 0;
}
.company-info { flex-grow: 1; }
.company-name-wrapper {
  display: flex; align-items: baseline; gap: 8px;
  flex-wrap: wrap; margin-bottom: 4px;
}
.company-name { font-weight: 600; font-size: 1rem; color: #E4E4E7; line-height: 1.3; }
.company-meta { font-size: 0.8125rem; color: #71717A; }

.type-badge {
  padding: 3px 8px; border-radius: 6px; font-size: 0.6875rem;
  font-weight: 700; text-transform: uppercase; line-height: 1; color: white;
}
.type-badge--ipo { background: #3B82F6; }
.type-badge--fpo { background: #8B5CF6; }
.type-badge--mutual { background: #10B981; }

/* --- IPO STATUS --- */
.ipo-status {
  display: flex; align-items: center; gap: 8px; font-weight: 500;
  font-size: 0.875rem; flex-shrink: 0; margin-left: auto; text-align: right;
}
.ipo-status svg { color: #52525B; }
.status--ongoing { color: #34D399; }
.status--soon { color: #60A5FA; }
.status--upcoming { color: #E4E4E7; }
.status--closed { color: #71717A; }
.status--tbd { color: #71717A; font-style: italic; }

/* --- ANIMATIONS & STATES --- */
.ipo-list-wrapper { transition: all 0.3s ease-in-out; }
.slide-left-enter-active, .slide-right-enter-active { transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.slide-left-leave-active, .slide-right-leave-active { transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.slide-left-enter-from, .slide-right-leave-to { opacity: 0; transform: translateX(20px); }
.slide-left-leave-to, .slide-right-enter-from { opacity: 0; transform: translateX(-20px); }

.loading-bar-container { width: 100%; padding: 48px 0; }
.loading-bar { position: relative; width: 80%; height: 4px; margin: 0 auto; background-color: #27272A; border-radius: 2px; overflow: hidden; }
.loading-bar::before {
  content: ''; position: absolute; top: 0; left: 0; height: 100%; width: 50%;
  background-color: #3B82F6; border-radius: 2px;
  animation: loading-bar-animation 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes loading-bar-animation {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(150%); }
  100% { transform: translateX(-100%); }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.state-message { text-align: center; color: #71717A; padding: 48px 0; }
.state-message.error { color: #F87171; }
</style>