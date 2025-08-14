<script setup lang="ts">
import { ref, computed } from 'vue';
import { useIpoStore, type Ipo } from '../stores/ipos';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const ipoStore = useIpoStore();
const activeTab = ref<'thisWeek' | 'upcoming' | 'pipeline'>('thisWeek');

// Computed properties for filtering IPOs into tabs
const thisWeekIpos = computed(() => {
  const now = dayjs();
  const endOfWeek = now.endOf('week');
  return ipoStore.ipos.filter(ipo => dayjs(ipo.ipo_date).isBefore(endOfWeek));
});

const upcomingIpos = computed(() => {
  const now = dayjs();
  const endOfWeek = now.endOf('week');
  const endOfNextMonth = now.add(1, 'month').endOf('month');
  return ipoStore.ipos.filter(ipo => {
    const ipoDate = dayjs(ipo.ipo_date);
    return ipoDate.isAfter(endOfWeek) && ipoDate.isBefore(endOfNextMonth);
  });
});

const pipelineIpos = computed(() => {
  const now = dayjs();
  const endOfNextMonth = now.add(1, 'month').endOf('month');
  return ipoStore.ipos.filter(ipo => dayjs(ipo.ipo_date).isAfter(endOfNextMonth));
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

// Helper for IPO Type badge styling
function getTypeClass(type: Ipo['type']) {
  if (type === 'FPO') return 'type-badge--fpo';
  if (type === 'Mutual Fund') return 'type-badge--mutual';
  return 'type-badge--ipo';
}

// NEW helper for Subscription Status styling
function getSubscriptionClass(status: string) {
  if (status.toLowerCase().includes('over')) return 'sub-status--oversubscribed';
  if (status.toLowerCase().includes('under')) return 'sub-status--undersubscribed';
  return ''; // Default style for other statuses
}

function formatDate(dateString: string): string {
  const date = dayjs(dateString);
  const now = dayjs();
  if (date.diff(now, 'day') < 7) {
    if (date.isSame(now, 'day')) return 'Today';
    return date.fromNow(true);
  }
  if (date.diff(now, 'day') < 14) {
    return 'Next week';
  }
  return date.format('MMM D');
}
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

    <nav class="tabs">
      <button @click="activeTab = 'thisWeek'" :class="{ 'active': activeTab === 'thisWeek' }">This Week</button>
      <button @click="activeTab = 'upcoming'" :class="{ 'active': activeTab === 'upcoming' }">Upcoming</button>
      <button @click="activeTab = 'pipeline'" :class="{ 'active': activeTab === 'pipeline' }">Pipeline</button>
    </nav>

    <div class="content">
      <div v-if="ipoStore.isLoading" class="state-message">Loading...</div>
      <div v-else-if="ipoStore.error" class="state-message error">Could not load IPOs.</div>
      <div v-else-if="currentIpos.length === 0" class="state-message">No IPOs in this category.</div>
      <div v-else class="ipo-list">
        <div class="ipo-card" v-for="ipo in currentIpos" :key="ipo.id">
          <div class="card-top">
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
            <div class="ipo-date">
              <span>{{ formatDate(ipo.ipo_date) }}</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
          <div class="card-bottom">
            <div class="subscription-status" :class="getSubscriptionClass(ipo.subscriptionStatus)">
              <span class="status-icon">
                <template v-if="getSubscriptionClass(ipo.subscriptionStatus) === 'sub-status--oversubscribed'">🔥</template>
                <template v-else>📉</template>
              </span>
              {{ ipo.subscriptionStatus }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Inter', sans-serif;
  background-color: #0F172A;
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

.tabs {
  display: flex; padding: 0 20px; gap: 24px;
  border-bottom: 1px solid #27272A; flex-shrink: 0;
}
.tabs button {
  background: none; border: none; color: #71717A; font-family: 'Inter', sans-serif;
  font-weight: 500; font-size: 0.875rem; padding: 12px 0;
  cursor: pointer; border-bottom: 2px solid transparent; transition: all 150ms ease;
}
.tabs button:hover { color: #E4E4E7; }
.tabs button.active { color: #FFFFFF; border-bottom-color: #3B82F6; }

.content { flex: 1; overflow-y: auto; padding: 0 12px; }
.content::-webkit-scrollbar { width: 0; background: transparent; }

.ipo-list { padding-top: 16px; }
.ipo-card {
  background: #18181B; border-radius: 12px; padding: 16px;
  margin-bottom: 12px; border: 1px solid #27272A;
  transition: all 150ms ease; cursor: pointer;
}
.ipo-card:hover { border-color: #3F3F46; background: #202023; }
.card-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
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

.ipo-date {
  display: flex; align-items: center; gap: 8px; font-weight: 500;
  font-size: 0.875rem; color: #E4E4E7; flex-shrink: 0; padding-top: 2px;
}
.ipo-date svg { color: #52525B; }
.card-bottom {
  display: flex;
  margin-top: 12px;
}
.type-badge {
  padding: 3px 8px; border-radius: 6px; font-size: 0.6875rem;
  font-weight: 700; text-transform: uppercase; line-height: 1; color: white;
}
.type-badge--ipo { background: #3B82F6; }
.type-badge--fpo { background: #8B5CF6; }
.type-badge--mutual { background: #10B981; }

.subscription-status {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 16px; font-size: 0.75rem;
  font-weight: 500; border: 1px solid transparent;
}
.status-icon {
  font-size: 0.875rem;
}
.sub-status--oversubscribed {
  background: rgba(245, 158, 11, 0.1);
  color: #FBBF24;
  border-color: #F59E0B40;
}
.sub-status--undersubscribed {
  background: rgba(239, 68, 68, 0.1);
  color: #F87171;
  border-color: #EF444440;
}

.state-message { text-align: center; color: #71717A; padding: 48px 0; }
.state-message.error { color: #F87171; }
</style>