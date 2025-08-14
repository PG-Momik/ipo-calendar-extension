<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
const authStore = useAuthStore();
</script>

<template>
  <div class="login-content">
    <div class="login-content__header">
      <h1 class="login-content__title">IPO Calendar</h1>
      <p class="login-content__subtitle">Stay ahead of the market. Never miss an IPO.</p>
    </div>

    <div class="login-content__action">
      <button
          @click="authStore.handleLogin"
          class="google-button"
          :disabled="authStore.isLoading"
      >
        <svg class="google-button__icon" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span v-if="!authStore.isLoading">Sign in with Google</span>
        <span v-else class="loading-text">
          Authenticating<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
        </span>
      </button>
    </div>

    <div class="login-content__footer">
      <p>By signing in, you agree to our Terms of Service & Privacy Policy.</p>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600&family=Poppins:wght@400;500&display=swap');

.login-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  height: 100%;
}

.login-content__header {
  margin-bottom: 48px;
}

.login-content__title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 2rem;
  color: #F1F5F9; /* Off-white for high contrast */
  margin-bottom: 8px;
}

.login-content__subtitle {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 0.9375rem;
  color: #94A3B8; /* Muted gray for subtitle */
}

.login-content__action {
  margin-bottom: 48px;
}

.google-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border: 1px solid #4A4545; /* Darker border */
  border-radius: 8px;
  background: rgba(10, 10, 11, 0.85);
  color: #F1F5F9;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.google-button:hover:not(:disabled) {
  transform: scale(1.02);
  border-color: #5A5555;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.google-button:active:not(:disabled) {
  transform: scale(0.98);
}

.google-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-button__icon {
  width: 24px;
  height: 24px;
}

.loading-text .dot { animation: blink 1.4s infinite both; }
.loading-text .dot:nth-child(2) { animation-delay: 0.2s; }
.loading-text .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }

.login-content__footer {
  margin-top: auto;
}

.login-content__footer p {
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  color: #64748B;
  line-height: 1.5;
}
</style>