<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import { Character } from '@proj-airi/server-shared/types/character';
import { TresCanvas } from '@tresjs/core';
import { OrbitControls } from '@tresjs/cientos';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { AudioContext } from 'standardized-audio-context'; // For Web Audio API
import { VoiceActivityDetector } from '@ricky0123/vad-web'; // Import VAD
import { Client as AiriClient } from '@proj-airi/server-sdk';

const route = useRoute();
const characterId = route.params.id as string;
const character = ref<Character | null>(null);
const chatMessage = ref('');
const chatHistory = ref<{ sender: string; message: string }[]>([]);
const characterRef = ref(null);

const airiClient = new AiriClient({});

let audioContext: AudioContext | null = null;
let vad: VoiceActivityDetector | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

const isRecording = ref(false);

const fetchCharacter = () => {
  airiClient.emit('character:get', { id: characterId });
};

const sendChatMessage = () => {
  if (chatMessage.value.trim() === '') return;

  chatHistory.value.push({ sender: 'user', message: chatMessage.value });
  airiClient.emit('chat:message', {
    characterId: characterId,
    message: chatMessage.value,
    conversationId: 'test-conversation', // TODO: Manage real conversation IDs
  });
  chatMessage.value = '';
};

const handleChatResponse = (payload: any) => {
  chatHistory.value.push({ sender: 'character', message: payload.message });
  // TODO: Trigger TTS for payload.message
};

const handleVoiceAudioChunk = async (payload: any) => {
  // Play audio chunk
  const audioBlob = base64ToBlob(payload.audioChunk, 'audio/mpeg'); // Assuming MP3
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};

const handleEmoteTriggered = (payload: any) => {
  // TODO: Trigger character emote animation
  console.warn(`Character ${payload.characterId} triggered emote: ${payload.emoteName}`);
};

const startRecording = async () => {
  try {
    audioContext = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    vad = new VoiceActivityDetector(audioContext, stream);
    vad.on('speechstart', () => {
      console.warn('Speech started');
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Assuming webm
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data) {
            airiClient.emit('voice:audio', {
              characterId: characterId,
              audioChunk: base64data,
            });
          }
        };
      };
      mediaRecorder.start();
      isRecording.value = true;
    });

    vad.on('speechend', () => {
      console.warn('Speech ended');
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      isRecording.value = false;
    });

    vad.on('noisestart', () => console.warn('Noise started'));
    vad.on('noiseend', () => console.warn('Noise ended'));

  } catch (error) {
    console.error('Error starting recording:', error);
    console.warn('Error starting recording. Please ensure microphone access is granted.');
  }
};

const stopRecording = () => {
  if (vad) {
    vad.destroy();
    vad = null;
  }
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  isRecording.value = false;
};

const triggerEmote = (emoteName: string) => {
  airiClient.emit('emote:trigger', { characterId: characterId, emoteName: emoteName });
};

// Helper function to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

onMounted(() => {
  fetchCharacter();

  airiClient.onEvent('character:data', (payload) => {
    character.value = payload.character;
    if (character.value && character.value.appearance.modelUrl) {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      loader.load(character.value.appearance.modelUrl, (gltf) => {
        const vrm = gltf.userData.vrm;
        if (vrm) {
          characterRef.value = vrm.scene;
          vrm.scene.position.y = -1;
        } else {
          console.warn('VRM model not found in GLTF userData.');
          characterRef.value = gltf.scene;
        }
      }, undefined, (error) => {
        console.error('Error loading 3D model:', error);
      });
    }
  });

  airiClient.onEvent('chat:response', handleChatResponse);
  airiClient.onEvent('voice:audioChunk', handleVoiceAudioChunk);
  airiClient.onEvent('emote:triggered', handleEmoteTriggered);

  airiClient.onEvent('error', (payload) => {
    console.error('Backend error:', payload.message);
    console.warn(`Error: ${payload.message}`);
  });
});

onUnmounted(() => {
  if (vad) {
    vad.destroy();
  }
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  // TODO: Remove event listeners
});
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Character Interaction</h1>

    <div v-if="character">
      <h2 class="text-xl font-semibold">{{ character.name }}</h2>
      <p class="text-gray-600 dark:text-gray-400">{{ character.description }}</p>

      <!-- 3D Character Model Display -->
      <div class="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg my-4">
        <TresCanvas v-if="characterRef">
          <TresPerspectiveCamera :position="[0, 2, 5]" />
          <OrbitControls />
          <TresAmbientLight :intensity="0.5" />
          <TresDirectionalLight :position="[0, 10, 0]" :intensity="1" />
          <primitive :object="characterRef" />
        </TresCanvas>
        <div v-else class="w-full h-full flex items-center justify-center">
          <p>Loading 3D Character Model...</p>
        </div >
      </div>

      <!-- Chat Interface -->
      <div class="border rounded-lg p-4 h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800">
        <div v-for="(msg, index) in chatHistory" :key="index" :class="msg.sender === 'user' ? 'text-right' : 'text-left'">
          <span :class="msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200'" class="inline-block rounded-lg px-3 py-1 my-1">
            {{ msg.message }}
          </span>
        </div>
      </div>

      <div class="mt-4 flex">
        <input
          type="text"
          v-model="chatMessage"
          @keyup.enter="sendChatMessage"
          placeholder="Type your message..."
          class="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
        >
        <button
          @click="sendChatMessage"
          class="rounded-r-md border border-transparent shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 px-4 py-2"
        >
          Send
        </button>
      </div>

      <!-- Voice Input Button -->
      <div class="mt-4 flex justify-center space-x-4">
        <button
          v-if="!isRecording"
          @click="startRecording"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Start Voice Input
        </button>
        <button
          v-else
          @click="stopRecording"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Stop Voice Input
        </button>
      </div>

      <!-- Emote Trigger Buttons -->
      <div class="mt-4 flex flex-wrap gap-2 justify-center">
        <button
          v-for="(animationData, emoteName) in character.emotes"
          :key="emoteName"
          @click="triggerEmote(emoteName)"
          class="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {{ emoteName }}
        </button>
        <p v-if="Object.keys(character.emotes).length === 0" class="text-sm text-gray-500 dark:text-gray-400">No emotes defined for this character.</p>
      </div>

    </div>
    <div v-else>
      <p>Loading character...</p>
    </div>
  </div>
</template>

<style scoped>
/* Add component-specific styles here */
</style>
