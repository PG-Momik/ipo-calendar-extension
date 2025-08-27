<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import type { Ipo } from '../stores/ipos';

dayjs.extend(relativeTime);
dayjs.extend(isBetween);

const props = defineProps<{
  ipo: Ipo,
  activeTab: 'thisWeek' | 'upcoming' | 'pipeline',
  index: number
}>();

const emit = defineEmits(['addToCalendar', 'addToPortfolio']);

// This computed property reactively determines if the card should have interactive hover effects.
// It will re-calculate WHENEVER the `ipo` prop changes (e.g., after the store refreshes).
const isInteractive = computed(() => {
  // Pipeline items are never interactive.
  if (props.activeTab === 'pipeline') {
    return false;
  }
  // A card is interactive if there's at least one action available.
  return props.ipo.canAddToCalendar || props.ipo.canAddToPortfolio;
});

// Helper function to get the status text and class for the date display.
function getIpoStatus(ipo: Ipo): { text: string; class: string } {
  const now = dayjs();
  const start = dayjs(ipo.startDate);
  const end = dayjs(ipo.endDate);

  if (props.activeTab === 'pipeline') {
    return { text: 'Date: TBD', class: 'status--tbd' };
  }
  if (props.activeTab === 'upcoming') {
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
    if (start.isSame(now.add(1, 'day'), 'day'))
      return { text: 'Opens Tomorrow', class: 'status--soon' };
    return { text: `Opens ${start.format('ddd')}`, class: 'status--soon' };
  }
  return { text: 'Status Unknown', class: 'status--tbd' };
}

// Helper function to get a CSS class for the IPO type badge.
function getTypeClass(type: Ipo['type']) {
  if (type === 'FPO') return 'type-badge--fpo';
  if (type === 'Mutual Fund') return 'type-badge--mutual';
  return 'type-badge--ipo';
}
</script>

<template>
  <div
      class="ipo-card"
      :style="{ '--delay': `${index * 50}ms` }"
      :class="{
      'is-closed': getIpoStatus(ipo).class === 'status--closed',
      'is-non-interactive': !isInteractive
    }"
  >
    <div class="card-content">
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

    <div class="actions-overlay">
      <button v-if="ipo.canAddToPortfolio"
              class="action-button"
              :class="{ 'is-full-width': !ipo.canAddToCalendar }"
              @click.stop="emit('addToPortfolio', ipo)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" height="16" width="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 9.563C9 9.254 9.254 9 9.563 9h4.874c.309 0 .563.254.563.563v4.874c0 .309-.254.563-.563.563H9.563A.563.563 0 019 14.437V9.563z"/>
        </svg>
        <span class="action-button--text">Add to Portfolio</span>
      </button>

      <button v-if="ipo.canAddToCalendar"
              class="action-button"
              :class="{ 'is-full-width': !ipo.canAddToPortfolio }"
              @click.stop="emit('addToCalendar', ipo)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" height="16" width="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0H21"/>
        </svg>
        <span class="action-button--text">Add to Calendar</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ipo-card {
  position: relative;
  background: #18181B;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid #27272A;
  transition: border-color 150ms ease, background-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
  overflow: hidden;
  animation: fade-in-up 0.5s both cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-delay: var(--delay);
}

.ipo-card:hover {
  border-color: #3F3F46;
  background: #202023;
  transform: translateY(-2px); /* Lifts the card slightly */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); /* Adds a subtle glow */
}
.ipo-card.is-closed {
  opacity: 0.6;
}
.ipo-card.is-closed:hover {
  opacity: 0.7;
}

.ipo-card.is-non-interactive {
  cursor: default;
}
.ipo-card.is-non-interactive:hover {
  border-color: #27272A;
  background: #18181B;
}
.ipo-card.is-non-interactive:hover .actions-overlay {
  display: none;
}
.ipo-card.is-non-interactive:hover .card-content {
  opacity: 1;
  transform: scale(1);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  transition: opacity 200ms ease 150ms, transform 200ms ease 150ms;
}
.actions-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: row;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  transition: opacity 200ms ease, transform 200ms ease;
}
.ipo-card:hover .card-content {
  opacity: 0;
  transform: scale(0.95);
  transition-delay: 0ms;
}
.ipo-card:hover .actions-overlay {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  transition-delay: 150ms;
}


.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #18181B;
  border: none;
  font-family:  sans-serif;
  font-size: 0.9375rem;
  color: #E4E4E7;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, border-radius 150ms ease;
}

.action-button:first-child:not(:only-child) {
  border-right: 1px solid #27272A;
}

.action-button:hover {
  background-color: #27272A;
}

.action-button--primary {
  color: #60A5FA;
}
.action-button--primary:hover {
  background-color: #2563EB;
  color: white;
}
.actions-complete {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  color: #34D399;
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
  min-width: 0;
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
.type-badge--ipo { background: #3B82F6; }
.type-badge--fpo { background: #8B5CF6; }
.type-badge--mutual { background: #10B981; }

.ipo-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  flex-shrink: 0;
  margin-left: auto;
  text-align: right;
}
.ipo-status svg {
  color: #52525B;
}
.status--ongoing { color: #34D399; }
.status--soon { color: #60A5FA; }
.status--upcoming { color: #E4E4E7; }
.status--closed { color: #71717A; }
.status--tbd { color: #71717A; font-style: italic; }

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
</style>