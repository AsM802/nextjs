<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateToCreateCharacter = () => {
  router.push('/creator/new');
};
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Creator Dashboard</h1>
    <p>Welcome, content creator! Here you can manage your characters.</p>
    <button
      @click="navigateToCreateCharacter"
      class="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Create New Character
    </button>
    <!-- TODO: Add a list of existing characters -->
  </div>
</template>

<style scoped>
/* Add component-specific styles here */
</style>
