<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { usePreferenceStore } from '../stores/preferences';
import { useAuthStore } from '../stores/auth';
import type { UserPreferences } from '../stores/preferences';

const preferenceStore = usePreferenceStore();
const authStore = useAuthStore();

const emit = defineEmits(['showToast', 'viewChange']);

const formState = ref<UserPreferences | null>(null);

onMounted(() => {
  preferenceStore.fetchPreferences();
});


watch(() => preferenceStore.current, (newPrefs) => {
  if (newPrefs) {
    formState.value = JSON.parse(JSON.stringify(newPrefs));
  }
}, { immediate: true });

async function handleSaveChanges() {
  if (!authStore.isAuthenticated) {
    emit('viewChange', 'Login');
    return;
  }

  if (formState.value) {
    const result = await preferenceStore.savePreferences(formState.value);
    emit('showToast', {
      message: result.message || 'An error occurred.',
      type: result.success ? 'success' : 'error'
    });
  }
}
</script>

<template>
  <div class="preferences-view">
    <div v-if="preferenceStore.isLoading" class="state-message">Loading Preferences...</div>
    <div v-else-if="preferenceStore.error" class="state-message error">{{ preferenceStore.error }}</div>

    <div v-else-if="formState" class="preferences-content">
      <div class="preference-section">
        <h3 class="section-title">Issue Types</h3>
        <div class="checkbox-grid">
          <div v-for="ipoType in preferenceStore.options.ipoTypes" :key="ipoType" class="checkbox-item">
            <input type="checkbox" :id="`type-${ipoType}`" :value="ipoType" v-model="formState.visible_ipo_types">
            <label :for="`type-${ipoType}`">{{ ipoType }}</label>
          </div>
        </div>
      </div>

      <div class="preference-section">
        <h3 class="section-title">Sectors</h3>
        <div class="checkbox-grid">
          <div v-for="sector in preferenceStore.options.sectors" :key="sector" class="checkbox-item">
            <input type="checkbox" :id="`sector-${sector}`" :value="sector" v-model="formState.visible_sectors">
            <label :for="`sector-${sector}`">{{ sector }}</label>
          </div>
        </div>
      </div>

      <div class="preference-section">
        <h3 class="section-title">Share Types</h3>
        <div class="checkbox-grid">
          <div v-for="shareType in preferenceStore.options.shareTypes" :key="shareType" class="checkbox-item">
            <input type="checkbox" :id="`share-${shareType}`" :value="shareType" v-model="formState.visible_share_types">
            <label :for="`share-${shareType}`">{{ shareType }}</label>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="handleSaveChanges" class="save-button">
          {{ authStore.isAuthenticated ? 'Update Preferences' : 'Sign In to Update Preferences' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preferences-view {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  font-family: 'Inter', sans-serif;
}
.preferences-view::-webkit-scrollbar { width: 4px; }
.preferences-view::-webkit-scrollbar-thumb { background: #3F3F46; border-radius: 2px; }

.preference-section {
  margin-bottom: 32px;
}
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #E4E4E7;
  margin-bottom: 4px;
}
.section-description {
  font-size: 0.875rem;
  color: #71717A;
  margin-bottom: 16px;
}
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #18181B;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #27272A;
}
.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3B82F6;
  cursor: pointer;
}
.checkbox-item label {
  color: #E4E4E7;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
  text-transform: capitalize;
}
.actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #27272A;
  display: flex;
  justify-content: flex-end;
}
.save-button {
  background-color: #2563EB;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease;
}
.save-button:hover {
  background-color: #1D4ED8;
}

.state-message {
  padding: 48px;
  text-align: center;
  color: #71717A;
}
.state-message.error {
  color: #F87171;
}
</style>