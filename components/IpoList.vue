<script setup lang="ts">
import { computed } from 'vue';
import { useIpoStore, type Ipo } from '../stores/ipos';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const ipoStore = useIpoStore();

// Group IPOs into categories based on their date
const groupedIpos = computed(() => {
  const now = dayjs();
  const endOfWeek = now.endOf('week');
  const groups: { [key: string]: { label: string; dateRange: string; ipos: Ipo[] } } = {
    thisWeek: { label: 'This Week', dateRange: `${now.startOf('week').format('MMM D')} - ${endOfWeek.format('D')}`, ipos: [] },
    upcoming: { label: 'Upcoming', dateRange: '', ipos: [] },
    pipeline: { label: 'Pipeline', dateRange: '', ipos: [] },
  };

  ipoStore.ipos.forEach(ipo => {
    const ipoDate = dayjs(ipo.ipo_date);
    if (ipoDate.isBefore(endOfWeek)) {
      groups.thisWeek.ipos.push(ipo);
    } else if (ipoDate.isBefore(now.add(1, 'month'))) {
      groups.upcoming.ipos.push(ipo);
    } else {
      groups.pipeline.ipos.push(ipo);
    }
  });

  // Filter out empty groups
  return Object.values(groups).filter(group => group.ipos.length > 0);
});

// Format date to be relative or absolute based on how far it is
function formatDate(dateString: string): string {
  const date = dayjs(dateString);
  const now = dayjs();
  if (date.diff(now, 'day') < 7) {
    if (date.isSame(now, 'day')) return 'Today';
    return date.fromNow(true); // e.g., "3 days"
  }
  if (date.diff(now, 'day') < 14) {
    return 'Next week';
  }
  return date.format('MMM D'); // e.g., "Apr 24"
}
</script>

<template>
  <div class="list-view">
    <header class="header">
      <h1 class="title">IPO Calendar</h1>
      <button class="settings-btn" title="Settings">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>

    <div class="content">
      <div v-if="ipoStore.isLoading" class="state-message">Loading...</div>
      <div v-else-if="ipoStore.error" class="state-message error">Could not load IPOs.</div>
      <section v-for="group in groupedIpos" :key="group.label" class="ipo-group">
        <header class="group-header">
          <h2 class="group-title">{{ group.label }}</h2>
          <span class="group-date-range" v-if="group.dateRange">{{ group.dateRange }}</span>
        </header>
        <div class="ipo-card" v-for="ipo in group.ipos" :key="ipo.id">
          <div class="card-top">
            <div class="company-logo">{{ ipo.name.charAt(0) }}</div>
            <div class="company-info">
              <div class="company-name">{{ ipo.name }}</div>
              <div class="company-meta">{{ ipo.ticker }} <span v-if="ipo.valuation">· {{ ipo.valuation }}</span></div>
            </div>
            <div class="ipo-date">
              <span>{{ formatDate(ipo.ipo_date) }}</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
          <div class="card-bottom">
            <div class="tags-container">
              <span v-for="tag in ipo.tags" :key="tag" class="tag">{{ tag }}</span>
              <span v-if="ipo.priceRange" class="tag tag--secondary">${{ ipo.priceRange }}</span>
            </div>
            <div class="interest-level">
              <span v-if="ipo.interest === 'High interest'">🔥</span>
              <span v-if="ipo.interest === 'Growing buzz'">~</span>
              {{ ipo.interest }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.list-view { display: flex; flex-direction: column; height: 100%; font-family: 'Inter', sans-serif; }
.header {
  display: flex; align-items: center; padding: 16px 8px;
  border-bottom: 1px solid #27272A; flex-shrink: 0;
}

.title { font-weight: 600; font-size: 1rem; color: #E4E4E7; margin-left: 12px; }
.settings-btn {
  margin-left: auto; width: 32px; height: 32px; border: none; background: transparent;
  color: #71717A; cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all 150ms ease; border-radius: 6px;
}
.settings-btn:hover { background: #27272A; color: #E4E4E7; }
.content { flex: 1; overflow-y: auto; padding: 0 12px; }
.content::-webkit-scrollbar { width: 0; background: transparent; }

.ipo-group { margin-top: 24px; }
.group-header { display: flex; justify-content: space-between; align-items: baseline; padding: 0 8px; margin-bottom: 12px; }
.group-title { font-size: 1.125rem; font-weight: 600; color: #E4E4E7; }
.group-date-range { font-size: 0.8125rem; font-weight: 500; color: #71717A; }

.ipo-card {
  background: #18181B; border-radius: 12px; padding: 16px;
  margin-bottom: 12px; border: 1px solid #27272A;
  transition: all 150ms ease; cursor: pointer;
}
.ipo-card:hover { border-color: #3F3F46; background: #202023; }
.card-top { display: flex; align-items: center; gap: 12px; }
.company-logo {
  width: 40px; height: 40px; background: #27272A; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 1.125rem; color: #A1A1AA; flex-shrink: 0;
}
.company-info { flex-grow: 1; }
.company-name { font-weight: 500; font-size: 1rem; color: #E4E4E7; }
.company-meta { font-size: 0.8125rem; color: #71717A; margin-top: 2px; }
.ipo-date {
  display: flex; align-items: center; gap: 8px; font-weight: 500;
  font-size: 0.875rem; color: #E4E4E7; flex-shrink: 0;
}
.ipo-date svg { color: #52525B; }

.card-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.tags-container { display: flex; align-items: center; gap: 8px; }
.tag {
  background: rgba(99, 102, 241, 0.1); color: #818CF8; padding: 4px 10px;
  border-radius: 12px; font-size: 0.75rem; font-weight: 500;
}
.tag--secondary { background: #27272A; color: #A1A1AA; }
.interest-level {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8125rem; font-weight: 500; color: #71717A;
}
.interest-level span { font-size: 0.75rem; }
.state-message { text-align: center; color: #71717A; padding: 48px 0; }
</style>