<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import { useCalendarStore } from '../stores/calendar';
import dayjs from 'dayjs';
import 'v-calendar/style.css';
import { Calendar as VCalendar } from 'v-calendar';
import ConfirmModal from './ConfirmModal.vue';
import {useAuthStore} from "../stores/auth";

const authStore = useAuthStore();
const calendarStore = useCalendarStore();

const isModalVisible = ref(false);
const ipoToRemove = ref<number | null>(null);
const removingIpoId = ref<number | null>(null);

onMounted(() => {
  if (authStore.isAuthenticated) {
    calendarStore.fetchTrackedIpos();
  } else {
    const unwatch = watch(() => authStore.isAuthenticated, (isAuth) => {
      if (isAuth) {
        calendarStore.fetchTrackedIpos();
        unwatch();
      }
    });
  }
});

const calendarAttributes = computed(() => {
  const colors = ['blue', 'purple', 'green', 'orange', 'red', 'teal'];
  return calendarStore.trackedIpos.map((ipo, index) => ({
    key: ipo.id,
    bar: { color: colors[index % colors.length] },
    dates: { start: new Date(ipo.startDate), end: new Date(ipo.endDate) },
    popover: { label: ipo.name, visibility: 'hover' },
  }));
});

function promptRemove(ipoId: number) {
  if (removingIpoId.value !== null) return;
  ipoToRemove.value = ipoId;
  isModalVisible.value = true;
}

async function confirmRemove() {
  isModalVisible.value = false;

  if (ipoToRemove.value !== null) {
    removingIpoId.value = ipoToRemove.value;
    await calendarStore.removeFromCalendar(removingIpoId.value);
    removingIpoId.value = null;
  }
}

function closeModal() {
  isModalVisible.value = false;
  ipoToRemove.value = null;
}
</script>

<template>
  <div class="calendar-view">
    <div v-if="calendarStore.isLoading" class="state-message">Loading Your Calendar...</div>
    <div v-else-if="calendarStore.error" class="state-message error">Could not load data.</div>
    <div v-else class="calendar-content-wrapper">
      <div class="calendar-wrapper">
        <VCalendar
            :attributes="calendarAttributes"
            borderless
            transparent
            is-dark
            expanded
            title-position="left"
        />
      </div>

      <div class="tracked-list">
        <h3 class="list-title">IPOs in Your Calendar</h3>

        <div v-if="calendarStore.trackedIpos.length === 0" class="empty-list">
          No IPOs added to your calendar yet.
        </div>

        <TransitionGroup v-else tag="ul" name="list-fade" class="item-list-scroll-wrapper">
          <li v-for="ipo in calendarStore.trackedIpos" :key="ipo.id" class="tracked-item">
            <div class="item-info">
              <span class="item-name">{{ ipo.name }}</span>
              <span class="item-date">
                {{ dayjs(ipo.startDate).format('MMM D') }} - {{ dayjs(ipo.endDate).format('D') }}
              </span>
            </div>

            <button
                @click="promptRemove(ipo.id)"
                class="remove-btn"
                :disabled="removingIpoId === ipo.id"
                title="Remove from Calendar"
            >
              <div v-if="removingIpoId === ipo.id" class="spinner-small"></div>
              <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
              </svg>
            </button>
          </li>
        </TransitionGroup>

      </div>
    </div>

    <ConfirmModal
        :show="isModalVisible"
        title="Confirm Removal"
        message="Are you sure you want to remove this IPO from your calendar? This will also delete the event from your Google Calendar."
        confirmText="Yes, Remove"
        @confirm="confirmRemove"
        @cancel="closeModal"
    />
  </div>
</template>

<style scoped>
.calendar-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-wrapper {
  padding: 0 16px 16px;
  border-bottom: 1px solid #27272A;
  flex-shrink: 0;
}

/* --- v-calendar THEME OVERRIDES --- */
:deep(.vc-dark) {
  --vc-bg: #27272A;
  --vc-content-bg: #27272A;
  --vc-header-title-color: #27272A;
  --vc-weekday-color: #71717A;
  --vc-day-content-hover-bg: #27272A;
  --vc-popover-content-bg: #27272A;
  --vc-popover-content-color: #E4E4E7;
  --vc-popover-caret-bg: #27272A;
  --vc-bar-height: 22px;
}

:deep(.vc-title){
  background: #E4E4E7;
  color: rgba(10, 10, 11, 0.85);
}

:deep(.vc-arrow) {
  color: #E4E4E7;
  background: transparent;
  border-radius: 6px;
  transition: all 150ms ease;
}

:deep(.vc-arrow:hover) {
  color: #E4E4E7;
  background: #27272A;
}

:deep(.vc-day-content) {
  color: #E4E4E7;
  border-radius: 6px;
}

:deep(.vc-day.is-not-in-month .vc-day-content) {
  color: #52525B;
  opacity: 0.6;
  pointer-events: none;
}

:deep(.vc-day.is-today .vc-day-content) {
  background-color: transparent;
  border: 1px solid #3B82F6;
  color: #60A5FA;
  font-weight: 600;
}

:deep(.vc-nav-title) {
  color: rgba(10, 10, 11, 0.85);
}

:deep(.vc-nav-title:hover) {
  background: #3B82F6;
  color: white;
}

:deep(.vc-nav-arrow:hover) {
  background: #3B82F6;
  color: white;
}

:deep(.vc-nav-item:hover) {
  background: #3B82F6;
  color: white;
}

/* -------------------------------------------------------------------------- */

:deep(.vc-popover-content) {
  text-align: left;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.tracked-list {
  padding: 16px 20px;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.list-title {
  font-size: 1rem;
  font-weight: 600;
  color: #E4E4E7;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.item-list-scroll-wrapper {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
}

.item-list-scroll-wrapper::-webkit-scrollbar {
  width: 4px;
}

.item-list-scroll-wrapper::-webkit-scrollbar-thumb {
  background: #3F3F46;
  border-radius: 2px;
}

.item-list-scroll-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.empty-list {
  text-align: center;
  color: #71717A;
  font-style: italic;
  padding-top: 32px;
}

.tracked-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px;
  border-bottom: 1px solid #27272A;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 500;
  color: #E4E4E7;
}

.item-date {
  font-size: 0.8125rem;
  color: #71717A;
  margin-top: 2px;
}

.remove-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid #3F3F46;
  border-radius: 6px;
  color: #A1A1AA;
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;
  position: relative;
}

.remove-btn:disabled {
  cursor: wait;
  background-color: #3F3F46;
}

.remove-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #EF4444;
  color: #F87171;
}

.remove-btn svg {
  width: 16px;
  height: 16px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #F87171; /* Red spinner */
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.state-message {
  padding: 48px;
  text-align: center;
  color: #71717A;
}

.state-message.error {
  color: #F87171;
}

.list-fade-move,
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

/* This ensures the layout doesn't jump when an item is removed */
.list-fade-leave-active {
  position: absolute;
}
</style>