<template>
  <div class="voice-cloner">
    <h2>Voice Cloner</h2>
    <div class="controls">
      <button @click="startRecording">{{ isRecording ? 'Stop Recording' : 'Start Recording' }}</button>
      <input type="text" v-model="textToSynthesize" placeholder="Enter text to synthesize" />
      <select v-model="selectedInbuiltVoice">
        <option disabled value="">Select an inbuilt voice</option>
        <option v-for="voice in inbuiltVoices" :key="voice.id" :value="voice.id">{{ voice.name }}</option>
      </select>
      <button @click="convertVoice">Convert</button>
      <button @click="applyVoice">Apply</button>
    </div>
    <div v-if="recordedAudioBlob" class="audio-preview">
      <h3>Recorded Audio:</h3>
      <audio :src="window.URL.createObjectURL(recordedAudioBlob)" controls></audio>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const textToSynthesize = ref('');
const selectedInbuiltVoice = ref('');
const inbuiltVoices = ref([
  { id: 'voice1', name: 'Voice 1' },
  { id: 'voice2', name: 'Voice 2' },
]);

const isRecording = ref(false);
let mediaRecorder: MediaRecorder | null = null;
const audioChunks: Blob[] = [];
const recordedAudioBlob = ref<Blob | null>(null);

const startRecording = async () => {
  if (isRecording.value) {
    stopRecording();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks.length = 0; // Clear previous chunks

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      recordedAudioBlob.value = new Blob(audioChunks, { type: 'audio/webm' });
      // You can now do something with recordedAudioBlob.value, e.g., upload it
      console.log('Recorded audio blob:', recordedAudioBlob.value);
    };

    mediaRecorder.start();
    isRecording.value = true;
    console.log('Recording started...');
  } catch (err) {
    console.error('Error accessing microphone:', err);
    alert('Could not access microphone. Please ensure it is connected and permissions are granted.');
  }
};

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
    console.log('Recording stopped.');
  }
};

const convertVoice = () => {
  alert('Convert functionality not yet implemented.');
};

const applyVoice = () => {
  alert('Apply functionality not yet implemented.');
};
</script>

<style scoped>
.voice-cloner {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 600px;
  margin: 20px auto;
  text-align: center;
}

.controls button,
.controls input,
.controls select {
  margin: 10px;
  padding: 8px 15px;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.controls button {
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

.controls button:hover {
  background-color: #0056b3;
}
</style>
