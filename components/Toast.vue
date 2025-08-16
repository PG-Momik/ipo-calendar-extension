<script setup lang="ts">
defineProps({
  type: {
    type: String,
    default: 'success'
  },
  message: {
    type: String,
    default: ''
  }
});
</script>

<template>
  <div class="toast" :class="`toast--${type}`">
    {{ message }}
  </div>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background-color: #27272A;
  border: 1px solid #3F3F46;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  white-space: nowrap;
}

.toast--success {
  background-color: #10B981;
  border-color: #059669;
}

.toast--warning {
  background-color: rgba(255, 215, 65, 0.84);
  border-color: rgba(255, 208, 18, 0.84);
}

.toast--error {
  background-color: #EF4444;
  border-color: #DC2626;
}
</style>