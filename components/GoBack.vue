<script setup lang="ts">
const emit = defineEmits(['viewChange']);

function changeView(viewName: string) {
  emit('viewChange', viewName);
  isSettingsOpen.value = false;
}
</script>

<template>
  <button type="button" @click="changeView('IpoList')" title="Home" class="home-button">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         aria-label="Home icon">
      <path d="M3 11.5L12 4l9 7.5"/>
      <path d="M5 12v7a2 2 0 0 0 2 2h3v-5h4v5h3a2 2 0 0 0 2-2v-7"/>
    </svg>

  </button>
</template>

<style scoped>
 .home-button{
   border: none;
   background: none;
   color: white;
   cursor: pointer;
   border-radius: 8px;
   padding: 8px;
 }

 .home-button:hover{
   background-color: #3F3F46;
   color: #FFFFFF;
 }
</style>