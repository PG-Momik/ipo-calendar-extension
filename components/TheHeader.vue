<script setup lang="ts">
import {ref} from 'vue';
import {onClickOutside} from '@vueuse/core';
import {useAuthStore} from '../stores/auth';

const authStore = useAuthStore();
const isSettingsOpen = ref(false);
const settingsMenu = ref(null);

const emit = defineEmits(['viewChange', 'showToast', 'logout']);

onClickOutside(settingsMenu, () => {
  isSettingsOpen.value = false;
});

function handleIpoListMenuItemClick(){
  changeView('IpoList');
}
function handleCalendarMenuItemClick(){
  if(authStore.isAuthenticated){
    changeView('Calendar');

    return
  }

  redirectToLogin()
}
function handleIpoPortfolioMenuItemClick(){
  if(authStore.isAuthenticated){
    changeView('IpoPortfolio');

    return
  }

  redirectToLogin()
}
function redirectToLogin(){
  emit('showToast', {
    message: 'Login to use this feature.',
    type: 'warning'
  });

  changeView('Login')

  return;
}

function changeView(viewName: string) {
  emit('viewChange', viewName);
  isSettingsOpen.value = false;
}

function handleLogout() {
  isSettingsOpen.value = false;
  emit('logout');
}

</script>

<template>
  <header class="header">
    <h1 class="title" @click="changeView('IpoList')">IPO Calendar</h1>

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
            <div class="dropdown-section-title">Menu</div>

            <button type="button" @click="handleIpoListMenuItemClick" class="dropdown-item">
              <span class="item-text">IPO List</span>
            </button>

            <button type="button" @click="handleCalendarMenuItemClick" class="dropdown-item">
              <span class="item-text">Calendar</span>
              <span v-if="!authStore.isAuthenticated" class="tooltip-trigger">
                <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 18.0039V17C19 15.8954 18.1046 15 17 15C15.8954 15 15 15.8954 15 17V18.0039M10 21H4C4 17.134 7.13401 14 11 14C11.3395 14 11.6734 14.0242 12 14.0709M15.5 21H18.5C18.9659 21 19.1989 21 19.3827 20.9239C19.6277 20.8224 19.8224 20.6277 19.9239 20.3827C20 20.1989 20 19.9659 20 19.5C20 19.0341 20 18.8011 19.9239 18.6173C19.8224 18.3723 19.6277 18.1776 19.3827 18.0761C19.1989 18 18.9659 18 18.5 18H15.5C15.0341 18 14.8011 18 14.6173 18.0761C14.3723 18.1776 14.1776 18.3723 14.0761 18.6173C14 18.8011 14 19.0341 14 19.5C14 19.9659 14 20.1989 14.0761 20.3827C14.1776 20.6277 14.3723 20.8224 14.6173 20.9239C14.8011 21 15.0341 21 15.5 21ZM15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="tooltip-text">Sign in to use this feature</span>
              </span>
            </button>

            <button type="button" @click="handleIpoPortfolioMenuItemClick" class="dropdown-item">
              <span class="item-text">IPO Portfolio</span>
              <span v-if="!authStore.isAuthenticated" class="tooltip-trigger">
                <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 18.0039V17C19 15.8954 18.1046 15 17 15C15.8954 15 15 15.8954 15 17V18.0039M10 21H4C4 17.134 7.13401 14 11 14C11.3395 14 11.6734 14.0242 12 14.0709M15.5 21H18.5C18.9659 21 19.1989 21 19.3827 20.9239C19.6277 20.8224 19.8224 20.6277 19.9239 20.3827C20 20.1989 20 19.9659 20 19.5C20 19.0341 20 18.8011 19.9239 18.6173C19.8224 18.3723 19.6277 18.1776 19.3827 18.0761C19.1989 18 18.9659 18 18.5 18H15.5C15.0341 18 14.8011 18 14.6173 18.0761C14.3723 18.1776 14.1776 18.3723 14.0761 18.6173C14 18.8011 14 19.0341 14 19.5C14 19.9659 14 20.1989 14.0761 20.3827C14.1776 20.6277 14.3723 20.8224 14.6173 20.9239C14.8011 21 15.0341 21 15.5 21ZM15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="tooltip-text">Sign in to use this feature</span>
              </span>
            </button>

            <div class="dropdown-divider"></div>

            <button @click="handleLogout" class="dropdown-item dropdown-item--logout">
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
  background: none;
  border: none;
  width: 100%;
  font-family: inherit;
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
  background: rgba(10, 10, 11, 0.85);
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
}

.title:hover {
  cursor: pointer;
}

.settings-container {
  position: relative;
  margin-left: auto;
}

.settings-btn {
  width: 24px;
  height: 24px;
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
  text-align: left;
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

.tooltip-trigger {
  position: relative;
  display: flex;
  align-items: start;
}

.tooltip-trigger .tooltip-text {
  visibility: hidden;
  opacity: 0;
  width: fit-content;
  background-color: #27272A;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 8px;
  position: absolute;
  z-index: 1;
  bottom: 100%;
  right: 50%;
  transition: opacity 150ms ease;
  font-size: 0.75rem;
  font-weight: 400;
  pointer-events: none; /* So it doesn't interfere with clicks */
}

/* Arrow for the tooltip */
.tooltip-trigger .tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #27272A transparent transparent transparent;
}

.tooltip-trigger:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

/* Animation */
.fade-scale-enter-active, .fade-scale-leave-active {
  transition: all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.fade-scale-enter-from, .fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>