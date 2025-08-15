<script setup lang="ts">
import {ref} from 'vue';
import {onClickOutside} from '@vueuse/core';
import {useAuthStore} from '../stores/auth';

const authStore = useAuthStore();
const isSettingsOpen = ref(false);
const settingsMenu = ref(null);

// This defines the custom events this component can send to its parent.
const emit = defineEmits(['viewChange']);

onClickOutside(settingsMenu, () => {
  isSettingsOpen.value = false;
});

function changeView(viewName: string) {
  emit('viewChange', viewName);
  isSettingsOpen.value = false;
}
</script>

<template>
  <header class="header">
    <div class="logo">
      <div class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="15" width="4" height="6" rx="1" fill="#FFFFFF"/>
          <rect x="10" y="10" width="4" height="11" rx="1" fill="#FFFFFF"/>
          <rect x="17" y="3" width="4" height="18" rx="1" fill="#FFFFFF"/>
        </svg>
      </div>
    </div>
    <h1 class="title">IPO Calendar</h1>

    <div class="settings-container">
      <div>
        <button @click="isSettingsOpen = !isSettingsOpen" class="settings-btn" title="Settings">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>

        <Transition name="fade-scale">
          <div v-if="isSettingsOpen" class="settings-dropdown" ref="settingsMenu">
            <div class="dropdown-section-title">Features</div>
            <!-- Buttons now call the changeView method -->
            <button @click="changeView('IpoList')" class="dropdown-item">
              <span class="item-icon">📄</span>
              <span class="item-text">IPO List</span>
            </button>
            <button @click="changeView('AddToCalendar')" class="dropdown-item">
              <span class="item-icon">🗓️</span>
              <span class="item-text">Add to Calendar</span>
            </button>
            <button @click="changeView('IpoPortfolio')" class="dropdown-item">
              <span class="item-icon">💼</span>
              <span class="item-text">IPO Portfolio</span>
            </button>
            <div class="dropdown-divider"></div>
            <button @click="authStore.logout()" class="dropdown-item dropdown-item--logout">
              <span class="item-icon">🚪</span>
              <span class="item-text">Logout</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dropdown-item {
  /* ... existing styles ... */
  background: none;
  border: none;
  width: 100%;
  font-family: inherit; /* Ensure button inherits font */
  cursor: pointer;
}

.header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #27272A;
  flex-shrink: 0;
  background-color: #0F172A;
}

.logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563EB;
}

.title {
  font-weight: 600;
  font-size: 1rem;
  color: #E4E4E7;
  margin-left: 12px;
}

.settings-container {
  position: relative;
  margin-left: auto;
}

.signin-btn {
  background-color: #2563EB;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.signin-btn:hover {
  background-color: #1D4ED8;
}

.settings-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #71717A;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
  border-radius: 6px;
}

.settings-btn:hover {
  background: #27272A;
  color: #E4E4E7;
}

.settings-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background-color: #18181B;
  border: 1px solid #27272A;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 8px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #71717A;
  padding: 8px 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #E4E4E7;
  transition: background-color 150ms ease;
}

.dropdown-item:hover {
  background-color: #27272A;
}

.item-icon {
  font-size: 1rem;
}

.item-text {
  flex-grow: 1;
}

.item-tag {
  background-color: #3B82F6;
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.dropdown-divider {
  height: 1px;
  background-color: #27272A;
  margin: 4px 0;
}

.dropdown-item--logout {
  color: #F87171;
}

.dropdown-item--logout:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.fade-scale-enter-active, .fade-scale-leave-active {
  transition: all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.fade-scale-enter-from, .fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>