<script setup lang="ts">
import { ref, onMounted, watch, defineProps, defineEmits } from 'vue';
import type { Holding } from '../stores/portfolio';
import dayjs from 'dayjs';

const props = defineProps<{
  show: boolean,
  holding: Holding | null
}>();

const emit = defineEmits(['close', 'save']);

const formData = ref({
  units_allotted: 10,
  purchase_price: 100,
  purchase_date: '',
});


onMounted(() => {
  if (props.holding) {
    formData.value.units_allotted = props.holding.unitsAllotted;
    formData.value.purchase_price = props.holding.purchasePrice;
    formData.value.purchase_date = dayjs(props.holding.purchaseDate).format('YYYY-MM-DD');
  }
});
watch(() => props.holding, (newHolding) => {
  if (newHolding) {
    formData.value.units_allotted = newHolding.unitsAllotted;
    formData.value.purchase_price = newHolding.purchasePrice;
    formData.value.purchase_date = dayjs(newHolding.purchaseDate).format('YYYY-MM-DD');
  }
}, { immediate: true });

function handleSave() {
  if (props.holding) {
    emit('save', {
      ipoId: props.holding.id,
      data: formData.value
    });
  }
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-content">
        <h3 class="modal-title">Edit Portfolio Entry</h3>
        <p class="modal-subtitle">{{ holding?.name }}</p>

        <form @submit.prevent="handleSave" class="edit-form">
          <div class="form-group">
            <label for="purchase-date">Purchase Date</label>
            <input type="date" id="purchase-date" v-model="formData.purchase_date" />
          </div>

          <div class="form-group">
            <label for="units">Units Allotted</label>
            <input type="number" id="units" v-model.number="formData.units_allotted" />
          </div>

          <div class="form-group">
            <label for="price">Purchase Price (per unit)</label>
            <input type="number" step="0.01" id="price" v-model.number="formData.purchase_price" />
          </div>

          <div class="modal-actions">
            <button type="button" @click="emit('close')" class="btn btn--secondary">Cancel</button>
            <button type="submit" class="btn btn--primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* For Firefox */
input[type=number] {
  -moz-appearance: textfield;
}

/* Styles for the modal, form, and inputs */
.modal-backdrop {   position: fixed;
  inset: 0;
  background-color: rgba(10, 10, 11, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000; }
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
.modal-subtitle { font-size: 0.875rem; color: #A1A1AA; margin-bottom: 24px; }
.edit-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-weight: 500; font-size: 0.8125rem; color: #A1A1AA; }
.form-group input {
  background-color: #27272A; border: 1px solid #3F3F46;
  border-radius: 6px; padding: 10px; color: #E4E4E7;
  font-family: 'Inter', sans-serif; font-size: 0.875rem;
}
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 12px; }
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}
.btn--primary { background-color: #2563EB; color: white; }
.btn--primary:hover { background-color: #1D4ED8; }
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