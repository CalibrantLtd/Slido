<template>
  <div class="report-slideshow">
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Loading slideshow...</p>
    </div>
    <div v-else-if="error" class="error-screen">
      <p>{{ error }}</p>
      <button @click="goBack" class="btn primary">Back to Reports</button>
    </div>
    <div v-else class="slideshow-container">
      <div class="slide-display">
        <div class="slide-content" v-if="currentSlideImage">
          <img :src="currentSlideImage" alt="Slide" />
        </div>
        <div v-else class="no-slide">
          <p>No slide available</p>
        </div>
      </div>
      
      <div class="slideshow-controls">
        <button @click="previousSlide" :disabled="currentSlideIndex === 0" class="nav-arrow left-arrow">
          ‹
        </button>
        <span class="slide-counter">
          {{ currentSlideIndex + 1 }} / {{ totalSlides }}
        </span>
        <button @click="nextSlide" :disabled="currentSlideIndex === totalSlides - 1" class="nav-arrow right-arrow">
          ›
        </button>
      </div>
      
      <button @click="exitSlideshow" class="exit-button" title="Exit (ESC)">
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reportService } from '@/services/reportService'
import { KEYS } from '@/configs/hotkey'

const route = useRoute()
const router = useRouter()
const reportId = route.params.id as string

const loading = ref(true)
const error = ref('')
const report = ref<any>(null)
const currentSlideIndex = ref(0)

const currentSlideImage = computed(() => {
  if (!report.value?.slideImages) return null
  return report.value.slideImages[currentSlideIndex.value]
})

const totalSlides = computed(() => {
  return report.value?.slideImages?.length || 0
})

onMounted(async () => {
  try {
    report.value = await reportService.getReportById(reportId)
    if (!report.value) {
      error.value = 'Report not found'
      return
    }
    if (!report.value.slideImages || report.value.slideImages.length === 0) {
      error.value = 'No slides available for this report'
      return
    }
    loading.value = false
    
    try {
      await document.documentElement.requestFullscreen()
    } catch (err) {
      console.warn('Could not enter fullscreen:', err)
    }
    
    document.addEventListener('keydown', keydownListener)
  } catch (err) {
    console.error('Error loading report:', err)
    error.value = 'Failed to load report'
    loading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', keydownListener)
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(err => console.warn('Error exiting fullscreen:', err))
  }
})

const previousSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--
  }
}

const nextSlide = () => {
  if (currentSlideIndex.value < totalSlides.value - 1) {
    currentSlideIndex.value++
  }
}

const exitSlideshow = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(err => console.warn('Error exiting fullscreen:', err))
  }
  goBack()
}

const goBack = () => {
  router.push('/reports')
}

const keydownListener = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase()
  
  if (key === KEYS.ESC) {
    e.preventDefault()
    exitSlideshow()
  } else if (key === KEYS.RIGHT || key === KEYS.DOWN || key === KEYS.PAGEDOWN || key === KEYS.SPACE) {
    e.preventDefault()
    nextSlide()
  } else if (key === KEYS.LEFT || key === KEYS.UP || key === KEYS.PAGEUP) {
    e.preventDefault()
    previousSlide()
  } else if (key === 'HOME') {
    e.preventDefault()
    currentSlideIndex.value = 0
  } else if (key === 'END') {
    e.preventDefault()
    currentSlideIndex.value = totalSlides.value - 1
  }
}
</script>

<style scoped>
.report-slideshow {
  width: 100vw;
  height: 100vh;
  background: #000;
  color: #fff;
  overflow: hidden;
}

.loading-screen,
.error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top: 4px solid #55B691;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-screen p,
.error-screen p {
  color: #ccc;
  font-size: 16px;
  margin: 0 0 16px 0;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #55B691;
  color: white;
  border-color: #55B691;
}

.btn.primary:hover {
  background: #4a9d7a;
  border-color: #4a9d7a;
}

.slideshow-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.slide-display {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.slide-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-content img {
  width: 100vw;
  height: 100vh;
  object-fit: contain;
  aspect-ratio: 1000 / 562.5;
}

.no-slide {
  color: #666;
  font-size: 18px;
}

.slideshow-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
}

.nav-arrow {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-arrow:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.nav-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.slide-counter {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
}

.exit-button {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 30px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.exit-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}
</style>

