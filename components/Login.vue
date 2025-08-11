<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
const authStore = useAuthStore();
</script>

<template>
  <div class="login-container">
    <h2>Welcome to IPO Notifier</h2>
    <p>Sign in to get started.</p>
    <button @click="authStore.handleLogin">
      Sign In with Google
    </button>
  </div>
</template>

<style>
  /* Add some basic styling */
</style>