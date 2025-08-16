<script setup lang="ts">
import {computed} from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isBetween from 'dayjs/plugin/isBetween'
import type {Ipo} from '../stores/ipos'

dayjs.extend(relativeTime)
dayjs.extend(isBetween)

const props = defineProps<{
  ipo: Ipo
  activeTab: 'thisWeek' | 'upcoming' | 'pipeline'
  index: number
  canAddToCalendar: true
  canAddToPortfolio: true
}>()

const emit = defineEmits<{
  (e: 'add-to-calendar', ipo: Ipo): void
  (e: 'add-to-portfolio', ipo: Ipo): void
}>()

function getIpoStatus(ipo: Ipo): { text: string; class: string } {
  const now = dayjs()
  const start = dayjs(ipo.startDate)
  const end = dayjs(ipo.endDate)

  if (props.activeTab === 'pipeline') {
    return {text: 'Date: TBD', class: 'status--tbd'}
  }
  if (props.activeTab === 'upcoming') {
    return {text: `${start.format('MMM D')} - ${end.format('D')}`, class: 'status--upcoming'}
  }
  if (now.isAfter(end)) {
    return {text: 'Closed', class: 'status--closed'}
  }
  if (now.isBetween(start, end, null, '[]')) {
    const daysRemaining = end.diff(now, 'day')
    if (daysRemaining === 0) return {text: 'Closes Today', class: 'status--ongoing'}
    return {text: `Closes in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`, class: 'status--ongoing'}
  }
  if (start.isAfter(now)) {
    if (start.isSame(now.add(1, 'day'), 'day'))
      return {text: 'Opens Tomorrow', class: 'status--soon'}
    return {text: `Opens ${start.format('ddd')}`, class: 'status--soon'}
  }

  return {text: 'Status Unknown', class: 'status--tbd'}
}

function getTypeClass(type: Ipo['type']) {
  if (type === 'FPO') return 'type-badge--fpo'
  if (type === 'Mutual Fund') return 'type-badge--mutual'

  return 'type-badge--ipo'
}

const showOverlay = computed(()=>props.activeTab === 'thisWeek' && (props.canAddToCalendar || props.canAddToPortfolio));

const ipoStatus = computed(() => getIpoStatus(props.ipo))
</script>

<template>
  <div
      class="ipo-card"
      :style="{ '--delay': `${index * 50}ms` }"
      :class="{ 'is-closed': ipoStatus.class === 'status--closed' }"
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

    <div class="ipo-actions-container">
      <div class="ipo-status"
           :class="[ipoStatus.class, { 'ipo-status--hideable': !showOverlay }]">
        <span class="pr-2">{{ ipoStatus.text }}</span>
      </div>

      <div class="actions-wrapper" v-show="showOverlay">
        <button v-if="canAddToCalendar"
                class="action-button add-to-calendar"
                :class="{ 'radius-reset': !canAddToPortfolio }"
                @click.stop="emit('add-to-calendar', ipo)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0H21"/>
          </svg>
          <span class="action-button--text">Add to Calendar</span>
        </button>

        <button v-if="canAddToPortfolio"
                class="action-button add-to-portfolio"
                :class="{ 'radius-reset': !canAddToCalendar }"
                @click.stop="emit('add-to-portfolio', ipo)">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 9.563C9 9.254 9.254 9 9.563 9h4.874c.309 0 .563.254.563.563v4.874c0 .309-.254.563-.563.563H9.563A.563.563 0 019 14.437V9.563z"/>
          </svg>
          <span class="action-button--text">Add to Portfolio</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- IPO CARD --- */
.ipo-card {
  background: #18181B;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #27272A;
  transition: border-color 200ms ease, background-color 200ms ease;
  cursor: pointer;
  animation: fade-in-up 0.5s both cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-delay: var(--delay);
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  transition-delay: 0ms, 0ms;
  position: relative;
}

.ipo-card:hover {
  border-color: #3F3F46;
  background: #202023;
  /* Slightly longer delay before showing actions */
  transition-delay: 100ms, 100ms;
}

.ipo-card.is-closed {
  opacity: 0.5;
  background: #111113;
}

.ipo-card.is-closed:hover {
  opacity: 0.7;
}

.ipo-card.is-non-interactive {
  cursor: default;
}

.ipo-card.is-non-interactive:hover .actions-wrapper {
  transform: scale(0.8);
  opacity: 0;
}

.ipo-card.is-non-interactive:hover {
  border-color: #27272A;
  background: #18181B;
  transition-delay: 0ms, 0ms;
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
  transition: opacity 250ms ease-out 150ms, transform 250ms ease-out 150ms;
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
  /* Delayed entrance for smoother experience */
  transition: opacity 200ms ease-in 150ms, transform 200ms ease-in 150ms;
  display: flex;
}

.ipo-actions-container:hover .ipo-status--hidden {
  opacity: 0;
  transform: scale(0.8);
  transition-delay: 0ms, 0ms;
}

.ipo-actions-container:hover .actions-wrapper {
  opacity: 1;
  transform: scale(1);
  transition-delay: 100ms, 100ms;
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
  /* Specific transitions for button interactions */
  transition: background-color 150ms ease, color 150ms ease, border-radius 150ms ease;
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

.action-button--text {
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
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

.ipo-list-wrapper {
  /* Specific transition for list wrapper instead of "all" */
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.pr-2 {
  padding-right: 12px;
}

.radius-reset {
  border-radius: unset !important;
}

.radius-reset:hover {
  border-radius: unset !important;
}
</style>
