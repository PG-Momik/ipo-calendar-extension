<script setup lang="ts">
import { useIpoStore, type Ipo } from '../stores/ipos'
import dayjs from 'dayjs' // Using dayjs for nice date formatting

const ipoStore = useIpoStore()

// Helper function to format dates
function formatDate(dateString: string) {
  return dayjs(dateString).format('MMM D, YYYY')
}
</script>

<template>
  <div class="ipo-list-container">
    <div v-if="ipoStore.isLoading" class="loading-state">
      <p>Loading IPOs...</p>
    </div>
    <div v-else-if="ipoStore.error" class="error-state">
      <p>{{ ipoStore.error }}</p>
    </div>
    <div v-else-if="ipoStore.ipos.length === 0" class="empty-state">
      <p>No upcoming IPOs found.</p>
    </div>
    <ul v-else class="ipo-list">
      <li v-for="ipo in ipoStore.ipos" :key="ipo.id" class="ipo-card">
        <div class="ipo-info">
          <h3 class="ipo-name">{{ ipo.name }}</h3>
          <p class="ipo-date">{{ formatDate(ipo.ipo_date) }}</p>
        </div>
        <button
            @click="ipoStore.addToCalendar(ipo.id)"
            :disabled="!!ipoStore.addStatus[ipo.id]"
            class="add-button"
            :class="{
            'is-adding': ipoStore.addStatus[ipo.id] === 'adding',
            'is-success': ipoStore.addStatus[ipo.id] === 'success',
            'is-error': ipoStore.addStatus[ipo.id] === 'error'
          }"
        >
          <!-- Adding Spinner -->
          <div v-if="ipoStore.addStatus[ipo.id] === 'adding'" class="spinner-small"></div>
          <!-- Success Icon -->
          <svg v-else-if="ipoStore.addStatus[ipo.id] === 'success'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <!-- Error Icon -->
          <svg v-else-if="ipoStore.addStatus[ipo.id] === 'error'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <!-- Default Plus Icon -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Scoped styles for the IPO List component */
.ipo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ipo-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #383434;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #4A4545;
}
.ipo-name {
  font-weight: 500;
  color: #F1F5F9;
  font-size: 0.9375rem;
}
.ipo-date {
  font-size: 0.8125rem;
  color: #94A3B8;
  margin-top: 2px;
}
.add-button {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #4A4545;
  color: #94A3B8;
  transition: all 200ms ease-in-out;
}
.add-button:hover:not(:disabled) {
  background-color: #3B82F6;
  color: white;
}
.add-button svg {
  width: 16px;
  height: 16px;
}
.add-button.is-adding {
  cursor: wait;
}
.add-button.is-success {
  background-color: #10B981; /* Green for success */
  color: white;
}
.add-button.is-error {
  background-color: #EF4444; /* Red for error */
  color: white;
}
.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* States */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 48px 0;
  color: #94A3B8;
  font-style: italic;
}
</style>