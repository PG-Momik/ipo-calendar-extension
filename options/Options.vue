<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePreferenceStore } from '../stores/preferences'

const authStore = useAuthStore()
const preferenceStore = usePreferenceStore()

// Local state for the form, initialized as null
const localPreferences = ref<{
  enable_browser_notifications: boolean
  auto_add_to_calendar: boolean
} | null>(null)

// When the component mounts, initialize the auth store to get user data
onMounted(() => {
  authStore.initialize()
})

// Watch for when the user data is loaded from the auth store
// and then populate our local form data.
watch(() => authStore.user, (newUser) => {
  if (newUser && newUser.preferences) {
    localPreferences.value = { ...newUser.preferences }
  }
}, { immediate: true })

function handleSaveChanges() {
  if (localPreferences.value) {
    preferenceStore.savePreferences(localPreferences.value)
  }
}
</script>

<template>
  <div class="options-container">
    <header class="options-header">
      <img src="/images/icon_48.png" alt="IPO Calendar Logo" class="logo">
      <h1>IPO Calendar — Settings</h1>
    </header>

    <main v-if="authStore.isLoading" class="loading-state">
      <p>Loading your settings...</p>
    </main>

    <main v-else-if="!authStore.isAuthenticated" class="login-prompt">
      <h2>Please Log In</h2>
      <p>You must be logged in to manage your settings.</p>
      <!-- You could add a login button here if desired -->
    </main>
    
    <main v-else-if="localPreferences" class="settings-form">
      <div class="setting-item">
        <div class="label-group">
          <label for="browser-notifications">Enable Browser Notifications</label>
          <p class="description">Get an alert in your browser when a new IPO is announced.</p>
        </div>
        <input
          id="browser-notifications"
          v-model="localPreferences.enable_browser_notifications"
          type="checkbox"
          class="toggle-switch"
        />
      </div>

      <div class="setting-item">
        <div class="label-group">
          <label for="auto-add-calendar">Automatically Add to Google Calendar</label>
          <p class="description">
            Immediately add new IPO events to your primary Google Calendar.
            Requires calendar permissions.
          </p>
        </div>
        <input
          id="auto-add-calendar"
          v-model="localPreferences.auto_add_to_calendar"
          type="checkbox"
          class="toggle-switch"
        />
      </div>

      <div class="actions">
        <button @click="handleSaveChanges" :disabled="preferenceStore.isSaving" class="save-button">
          {{ preferenceStore.isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      <div v-if="preferenceStore.successMessage" class="toast success">
        {{ preferenceStore.successMessage }}
      </div>
      <div v-if="preferenceStore.error" class="toast error">
        {{ preferenceStore.error }}
      </div>
    </main>

  </div>
</template>

<style scoped>
.options-container {
  max-width: 600px;
  margin: 2rem auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
}

.options-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  width: 40px;
  height: 40px;
}

h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.settings-form {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
}

.label-group {
  display: flex;
  flex-direction: column;
}

.label-group label {
  font-size: 1rem;
  font-weight: 500;
}

.description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  position: relative;
  appearance: none;
  background-color: #d1d5db;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.toggle-switch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.2s ease-in-out;
}

.toggle-switch:checked {
  background-color: #2563eb;
}

.toggle-switch:checked::before {
  transform: translateX(20px);
}

.actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.save-button {
  padding: 0.5rem 1rem;
  border: none;
  background-color: #2563eb;
  color: white;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: #1d4ed8;
}

.save-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.toast {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  font-weight: 500;
}

.success {
  background-color: #d1fae5;
  color: #065f46;
}

.error {
  background-color: #fee2e2;
  color: #991b1b;
}

.loading-state, .login-prompt {
  text-align: center;
  margin-top: 4rem;
  color: #6b7280;
}
</style>