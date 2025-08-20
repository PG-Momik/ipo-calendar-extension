<script setup lang="ts">
import {ref, watch} from 'vue';

const props = defineProps({
  show: Boolean,
  title: String,
  message: String,
  confirmText: {type: String, default: 'Confirm'},
  cancelText: {type: String, default: 'Cancel'},
});

const emit = defineEmits(['confirm', 'cancel']);

const isVisible = ref(false);

watch(() => props.show, (newValue) => {
  isVisible.value = newValue;
}, {immediate: true});

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  // Same for cancel.
  emit('cancel');
}
</script>

<template>
  <!-- The transition now watches our internal `isVisible` state -->
  <Transition name="modal-fade">
    <div v-if="isVisible" class="modal-backdrop" @click.self="handleCancel">
      <div class="modal-content">
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-actions">
          <button @click="handleCancel" class="btn btn--secondary">{{ cancelText }}</button>
          <button @click="handleConfirm" class="btn btn--danger">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(10, 10, 11, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #18181B;
  border: 1px solid #27272A;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 340px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #E4E4E7;
  margin-bottom: 8px;
}

.modal-message {
  font-size: 0.875rem;
  color: #A1A1AA;
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--secondary {
  background-color: #3F3F46;
  color: #E4E4E7;
}

.btn--secondary:hover {
  background-color: #52525B;
}

.btn--danger {
  background-color: #DC2626;
  color: white;
}

.btn--danger:hover {
  background-color: #B91C1C;
}

/* Modal animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 200ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95);
}

.modal-backdrop { /* ... */ }
.modal-content { /* ... */ }

/* Ensure the fade out animation is defined */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease;
}
.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 200ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: translateY(10px) scale(0.98);
}
</style>