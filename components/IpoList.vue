<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from 'vue';
import {type Ipo, useIpoStore} from '../stores/ipos';
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

function getIpoStatus(ipo: Ipo): { text: string; class: string } {
  const now = dayjs();
  const start = dayjs(ipo.startDate);
  const end = dayjs(ipo.endDate);

  if (activeTab.value === 'pipeline') {
    return {text: 'Date: TBD', class: 'status--tbd'};
  }
  if (activeTab.value === 'upcoming') {
    return {text: `${start.format('MMM D')} - ${end.format('D')}`, class: 'status--upcoming'};
  }
  if (now.isAfter(end)) {
    return {text: 'Closed', class: 'status--closed'};
  }
  if (now.isBetween(start, end, null, '[]')) {
    const daysRemaining = end.diff(now, 'day');
    if (daysRemaining === 0) return {text: 'Closes Today', class: 'status--ongoing'};
    return {text: `Closes in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`, class: 'status--ongoing'};
  }
  if (start.isAfter(now)) {
    if (start.isSame(now.add(1, 'day'), 'day')) return {text: 'Opens Tomorrow', class: 'status--soon'};
    return {text: `Opens ${start.format('ddd')}`, class: 'status--soon'};
  }
  return {text: 'Status Unknown', class: 'status--tbd'};
}

function getTypeClass(type: Ipo['type']) {
  if (type === 'FPO') return 'type-badge--fpo';
  if (type === 'Mutual Fund') return 'type-badge--mutual';
  return 'type-badge--ipo';
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
}, {immediate: true});

onMounted(() => {
})

function handleAddToCalendar(ipo){

}
function handleAddToPortfolio(ipo){

}
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
            <!-- This is the new structure for your .ipo-card div -->
            <!-- This is the new structure for your .ipo-card div -->
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

              <!-- THE REFACTORED RIGHT-HAND SIDE -->
              <div class="ipo-actions-container">
                <!-- The date/status is visible by default -->
                <div class="ipo-status" :class="getIpoStatus(ipo).class">
                  <span>{{ getIpoStatus(ipo).text }}</span>
                  <svg v-if="activeTab !== 'pipeline'" width="16" height="16" fill="none" viewBox="0 0 24 24"
                       stroke-width="3" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                  </svg>
                </div>

                <div class="actions-wrapper">
                  <button class="action-button add-to-calendar" @click.stop="handleAddToCalendar(ipo)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                         stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0H21"/>
                    </svg>
                    <span>
                      Add to Calendar
                    </span>
                  </button>
                  <button class="action-button add-to-portfolio" @click.stop="handleAddToPortfolio(ipo)">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                         stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M9 9.563C9 9.254 9.254 9 9.563 9h4.874c.309 0 .563.254.563.563v4.874c0 .309-.254.563-.563.563H9.563A.563.563 0 019 14.437V9.563z"/>
                    </svg>
                    <span>
                      Add to Portfolio
                    </span>
                  </button>
                </div>
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

/* --- LAYOUT & TABS --- */
.list-view-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
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

/* --- IPO CARD --- */
.ipo-card {
  background: #18181B;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #27272A;
  transition: all 150ms ease;
  cursor: pointer;
  animation: fade-in-up 0.5s both cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-delay: var(--delay);
  display: flex;
  align-items: center;
  gap: 12px;
}

.ipo-card:hover {
  border-color: #3F3F46;
  background: #202023;
}

.ipo-card.is-closed {
  opacity: 0.5;
  background: #111113;
}

.ipo-card.is-closed:hover {
  opacity: 0.7;
}

.company-logo {
  width: 40px;
  height: 40px;
  background: #27272A;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
  color: #A1A1AA;
  flex-shrink: 0;
}

.company-info {
  flex-grow: 1;
  min-width: 0; /* Prevents text overflow issues */
}

.company-name-wrapper {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.company-name {
  font-weight: 600;
  font-size: 1rem;
  color: #E4E4E7;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-meta {
  font-size: 0.8125rem;
  color: #71717A;
}

.type-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1;
  color: white;
  flex-shrink: 0;
}

.type-badge--ipo {
  background: #3B82F6;
}

.type-badge--fpo {
  background: #8B5CF6;
}

.type-badge--mutual {
  background: #10B981;
}

/* --- RHS ACTION CONTAINER STYLES --- */
.ipo-actions-container {
  flex-shrink: 0;
  margin-left: auto;
  width: 100px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-radius: 50px;
}

.ipo-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  padding-right: 4px;
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.actions-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #27272A;
  border-radius: 8px;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 200ms ease-in, transform 200ms ease-in;
  display: flex;
}

.ipo-actions-container:hover .ipo-status {
  opacity: 0;
  transform: scale(0.8);
}

.ipo-actions-container:hover .actions-wrapper {
  opacity: 1;
  transform: scale(1);
}

.action-button {
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #A1A1AA;
  cursor: pointer;
  transition: all 150ms ease;
  gap: 8px;
}
.action-button:hover {
  background-color: #3F3F46;
  color: #FFFFFF;
}
.add-to-calendar:hover {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  color: #FFFFFF;
}
.add-to-portfolio:hover {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  color: #FFFFFF;
}
.action-button svg {
  width: 18px;
  height: 18px;
}
.ipo-status svg {
  color: #52525B;
}
.status--ongoing {
  color: #34D399;
}

.status--soon {
  color: #60A5FA;
}

.status--upcoming {
  color: #E4E4E7;
}

.status--closed {
  color: #71717A;
}

.status--tbd {
  color: #71717A;
  font-style: italic;
}

/* --- ANIMATIONS & STATES --- */
.ipo-list-wrapper {
  transition: all 0.3s ease-in-out;
}

.slide-left-enter-active, .slide-right-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-leave-active, .slide-right-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
</style>