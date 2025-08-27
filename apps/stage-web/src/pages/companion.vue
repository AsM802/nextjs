<template>
  <div class="companion-container">
    <h1>AI Companion</h1>
    <div class="avatar-container">
      <!-- WidgetStage component for 2D/3D model rendering -->
      <WidgetStage
        :focus-at="{ x: 0, y: 0 }"
        :paused="false"
        class="companion-avatar"
      />
    </div>
    <div class="chat-window">
      <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
        {{ message.text }}
      </div>
    </div>
    <input
      v-model="newMessage"
      @keyup.enter="sendMessage"
      placeholder="Type your message..."
      class="message-input"
    />
    <button @click="sendMessage" class="send-button">Send</button>
    <button @click="uploadVoiceSample" class="voice-sample-button">Upload Voice Sample</button>
    <button @click="triggerEmote" class="emote-button">Trigger Emote (Idle)</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { WidgetStage } from "@proj-airi/stage-ui/components/scenes"; // Import WidgetStage component
import { useSettings, useVRM } from '@proj-airi/stage-ui/stores'; // Import stores

const messages = ref<{ role: string; text: string }[]>([]);
const newMessage = ref('');

// Initialize stores
const settings = useSettings();
const vrmStore = useVRM();

// Set stageView to '3d'
settings.stageView = '3d';

// Set a default VRM model (you might want to make this configurable later)
// This path should be relative to the public directory or an absolute URL
vrmStore.modelUrl = '/assets/vrm/models/default.vrm'; // Placeholder: Replace with your actual VRM model path

const sendMessage = async () => {
  if (newMessage.value.trim() === '') return;

  const userMessage = newMessage.value;
  messages.value.push({ role: 'user', text: userMessage });
  newMessage.value = '';

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2', // Or 'mistral' if you downloaded that model
        prompt: userMessage,
        stream: false, // Set to true for streaming responses
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const ollamaResponse = data.response;
    messages.value.push({ role: 'model', text: ollamaResponse });

    // Speak the response using browser-native TTS
    const utterance = new SpeechSynthesisUtterance(ollamaResponse);
    speechSynthesis.speak(utterance);

    // Dynamic emote triggering based on AI response (for VRM)
    const lowerCaseResponse = ollamaResponse.toLowerCase();
    // You'll need to map these to actual VRM expressions
    // For now, we'll leave this as a placeholder for VRM expression triggering.

  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    messages.value.push({ role: 'model', text: 'Error: Could not get a response from Ollama.' });
  }
};

const uploadVoiceSample = () => {
  console.warn('Voice sample upload functionality is a placeholder. This would involve recording/uploading audio for voice cloning.');
  console.warn('Upload Voice Sample button clicked.');
  // In a real scenario, this would trigger a file input or recording interface
  // and send the audio to a backend service for processing.
};

const triggerEmote = () => {
  // For VRM, you'd trigger expressions or animations here
  console.warn('Emote triggering for VRM needs to be implemented. Check your VRM model\'s available expressions/animations.');
  console.warn('Trigger Emote button clicked.');
};
</script>


<style scoped>
.companion-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f0f2f5;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  height: 300px; /* Example height, adjust as needed */
}

.companion-avatar {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.chat-window {
  flex-grow: 1;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 15px;
  overflow-y: auto;
  margin-bottom: 15px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 5px;
  max-width: 80%;
}

.message.user {
  background-color: #e0f7fa;
  align-self: flex-end;
  margin-left: auto;
}

.message.model {
  background-color: #e8f5e9;
  align-self: flex-start;
  margin-right: auto;
}

.message-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.send-button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 10px;
}

.send-button:hover {
  background-color: #0056b3;
}

.voice-sample-button {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 10px;
}

.voice-sample-button:hover {
  background-color: #218838;
}

.emote-button {
  width: 100%;
  padding: 10px;
  background-color: #ffc107;
  color: #333;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.emote-button:hover {
  background-color: #e0a800;
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>

color: #e0a800;
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>

