<script setup lang="ts">
import { ref, watch } from 'vue'; // Import watch

import { useRouter } from 'vue-router';
import { Client as AiriClient } from '@proj-airi/server-sdk';


const router = useRouter();

const characterName = ref('');
const description = ref('');
const modelUrl = ref('');
const textureUrl = ref('');
const personalityTraitsInput = ref(''); // New ref for comma-separated input
const personalityTraits = ref<string[]>([]); // Existing ref for array of traits
const backstory = ref('');
const voiceType = ref('preset'); // 'cloned' or 'preset'
const voiceSampleFile = ref<File | null>(null);
const voicePresetId = ref('');
const emotes = ref<Record<string, string>>({}); // { emoteName: animationData }

// Watch for changes in personalityTraitsInput and update personalityTraits array
watch(personalityTraitsInput, (newValue) => {
  personalityTraits.value = newValue.split(',').map(trait => trait.trim()).filter(trait => trait.length > 0);
});

const airiClient = new AiriClient({}); // Get the client instance

const createCharacter = async () => {
  const newCharacter = {
    name: characterName.value,
    description: description.value,
    appearance: {
      modelUrl: modelUrl.value,
      textureUrl: textureUrl.value,
    },
    personality: {
      traits: personalityTraits.value, // Use the parsed array
      backstory: backstory.value,
    },
    voice: {
      type: voiceType.value,
      sampleUrl: voiceType.value === 'cloned' ? '' : undefined, // Placeholder, will be updated after upload
      presetId: voiceType.value === 'preset' ? voicePresetId.value : undefined,
    },
    emotes: emotes.value,
  };

  // TODO: Handle voiceSampleFile upload and get URL
  if (voiceType.value === 'cloned' && voiceSampleFile.value) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const audioData = e.target?.result as string; // Base64 encoded audio
      airiClient.emit('voice:uploadSample', {
        characterId: 'new-character-id', // Placeholder, will get actual ID after character creation
        audioData: audioData.split(',')[1], // Remove data:audio/wav;base64,
        format: voiceSampleFile.value?.type || 'audio/wav',
      });
    };
    reader.readAsDataURL(voiceSampleFile.value);
  }

  airiClient.emit('character:create', { character: newCharacter });

  // Listen for character:created event
  airiClient.onEvent('character:created', (payload) => {
    console.log('Character created:', payload.character);
    router.push(`/character/${payload.character.id}`); // Redirect to character page
  });

  airiClient.onEvent('error', (payload) => {
    console.error('Error creating character:', payload.message);
    alert(`Error: ${payload.message}`);
  });
};

const handleVoiceSampleUpload = (files: File[]) => {
  if (files.length > 0) {
    voiceSampleFile.value = files[0];
    // The actual upload to backend will happen in createCharacter
  }
};
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Create New Character</h1>
    <form @submit.prevent="createCharacter" class="space-y-4">
      <div>
        <label for="characterName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Character Name</label>
        <input type="text" id="characterName" v-model="characterName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" required>
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea id="description" v-model="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"></textarea>
      </div>

      <div>
        <label for="modelUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">3D Model URL</label>
        <input type="url" id="modelUrl" v-model="modelUrl" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" required>
      </div>

      <div>
        <label for="textureUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Texture URL (Optional)</label>
        <input type="url" id="textureUrl" v-model="textureUrl" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
      </div>

      <div>
        <label for="backstory" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Backstory</label>
        <textarea v-model="backstory" rows="3" placeholder="Character backstory..." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"></textarea>
      </div>

      <div>
        <label for="personalityTraits" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Personality Traits (comma-separated)</label>
        <input type="text" id="personalityTraits" v-model="personalityTraitsInput" placeholder="e.g., friendly, curious, sarcastic" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Voice Type</label>
        <div class="mt-1 space-x-4">
          <label class="inline-flex items-center">
            <input type="radio" v-model="voiceType" value="preset" class="form-radio text-primary-600 dark:text-primary-400">
            <span class="ml-2">Preset Voice</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" v-model="voiceType" value="cloned" class="form-radio text-primary-600 dark:text-primary-400">
            <span class="ml-2">Cloned Voice</span>
          </label>
        </div>

        <div v-if="voiceType === 'preset'" class="mt-2">
          <label for="voicePresetId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Voice Preset ID</label>
          <input type="text" id="voicePresetId" v-model="voicePresetId" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
        </div>

        <div v-if="voiceType === 'cloned'" class="mt-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Voice Sample</label>
          <BasicInputFile @files-change="handleVoiceSampleUpload" accept="audio/*" />
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload an audio file (e.g., WAV, MP3) for voice cloning.</p>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Emotes</label>
        <!-- TODO: Add emote definition UI -->
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Define custom emotes for your character.</p>
      </div>

      <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        Create Character
      </button>
    </form>
  </div>
</template>

<style scoped>
/* Add component-specific styles here */
</style>

