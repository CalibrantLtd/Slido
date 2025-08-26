<template>
  <div 
    class="performance-chart-element"
    :style="{
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
      left: elementInfo.left + 'px',
      top: elementInfo.top + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div 
        class="element-content"
        :style="{
          width: elementInfo.width + 'px',
          height: elementInfo.height + 'px',
        }"
      >
        <div 
          v-if="currentChartImage"
          class="chart-image"
          :style="{
            width: '100%',
            height: '100%',
            backgroundImage: `url('${currentChartImage}')`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1001
          }"
        ></div>
        <!-- Fallback to mock SVG -->
        <div 
          v-else
          class="mock-chart"
          :style="{
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/images/mock-chart-performance.svg)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSlidesStore } from '@/store'
import type { PPTPerformanceChartElement } from '@/types/slides'

const props = defineProps<{
  elementInfo: PPTPerformanceChartElement
}>()

const slidesStore = useSlidesStore()

const currentChartImage = computed(() => {
  if (!slidesStore.chartImages || typeof slidesStore.chartImages !== 'object') {
    return null
  }
  
  const image: string | undefined = slidesStore.chartImages[props.elementInfo.id]
  
  let imageString: string | undefined = image
  if (image && typeof image === 'object' && image !== null) {
    imageString = (image as any).value || (image as any).toString()
  }
  
  if (typeof imageString === 'string' && imageString.startsWith('data:image')) {
    return imageString
  }
  
  return null
})
</script>

<style scoped>
.performance-chart-element {
  position: absolute;
  cursor: pointer;
}

.element-content {
  position: relative;
  overflow: hidden;
}

.rotate-wrapper {
  width: 100%;
  height: 100%;
}
</style>
