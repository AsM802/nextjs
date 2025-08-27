<script setup lang="ts">
import Screen from '../Misc/Screen.vue'
import Live2DCanvas from './Live2D/Canvas.vue'
import Live2DModel from './Live2D/Model.vue'

import '../../utils/live2d-zip-loader'
import { ref } from 'vue' // Add ref import

withDefaults(defineProps<{
  modelSrc?: string
  modelFile?: File | null

  paused?: boolean
  mouthOpenSize?: number
  focusAt?: { x: number, y: number }
  disableFocusAt?: boolean
  xOffset?: number | string
  yOffset?: number | string
  scale?: number
}>(), {
  paused: false,
  focusAt: () => ({ x: 0, y: 0 }),
  mouthOpenSize: 0,
  scale: 1,
})

const _emits = defineEmits<{
  (e: 'modelLoaded'): void
}>()

const live2dModelRef = ref<InstanceType<typeof Live2DModel> | null>(null)

defineExpose({
  setMotion: (motionName: string, index?: number) => {
    live2dModelRef.value?.setMotion(motionName, index)
  },
  listMotionGroups: () => {
    return live2dModelRef.value?.listMotionGroups() || []
  },
  getCoreModel: () => {
    return live2dModelRef.value?.getCoreModel()
  }
})
</script>

<template>
  <Screen v-slot="{ width, height }" relative>
    <Live2DCanvas
      v-slot="{ app }"
      :width="width"
      :height="height"
      :resolution="2"
      max-h="100dvh"
    >
      <Live2DModel
        ref="live2dModelRef"
        :model-src="modelSrc"
        :model-file="modelFile"
        :app="app"
        :mouth-open-size="mouthOpenSize"
        :width="width"
        :height="height"
        :paused="paused"
        :focus-at="focusAt"
        :x-offset="xOffset"
        :y-offset="yOffset"
        :scale="scale"
        :disable-focus-at="disableFocusAt"
      />
    </Live2DCanvas>
  </Screen>
</template>
