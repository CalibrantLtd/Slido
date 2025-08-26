<template>
  <div class="report-editor">
    <div class="editor-loading" v-if="loading">
      <div class="loading-spinner"></div>
      <p>Loading report...</p>
    </div>
    <div v-else-if="error" class="editor-error">
      <p>{{ error }}</p>
      <button @click="goBack" class="btn primary">Back to Reports</button>
    </div>
    <iframe
      v-else
      ref="editorFrame"
      :src="editorUrl"
      class="editor-iframe"
      @load="onEditorLoad"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reportService } from '@/services/reportService'

const route = useRoute()
const router = useRouter()
const reportId = route.params.id as string

const loading = ref(true)
const error = ref('')
const report = ref<any>(null)
const editorFrame = ref<HTMLIFrameElement | null>(null)

const editorUrl = computed(() => {
  // The editor will load and we'll communicate with it via postMessage
  return '/editor?mode=report&reportId=' + reportId
})

onMounted(async () => {
  try {
    report.value = await reportService.getReportById(reportId)
    if (!report.value) {
      error.value = 'Report not found'
      return
    }
    if (!report.value.slides) {
      error.value = 'This report cannot be edited (no slides data available)'
      return
    }
    
    
    loading.value = false
  } catch (err) {
    console.error('Error loading report:', err)
    error.value = 'Failed to load report'
    loading.value = false
  }
})

const onEditorLoad = () => {
}

const goBack = () => {
  router.push('/reports')
}


onMounted(() => {
  window.addEventListener('message', handleEditorMessage)
})

const handleEditorMessage = async (event: MessageEvent) => {
  if (event.data.type === 'EDITOR_READY') {
    if (report.value) {
      const slidesData = JSON.parse(JSON.stringify(report.value.slides))
      
      const message = {
        type: 'LOAD_REPORT',
        data: {
          reportId: report.value.id,
          name: report.value.name,
          slides: slidesData,
          slideImages: JSON.parse(JSON.stringify(report.value.slideImages)),
          chartImages: JSON.parse(JSON.stringify(report.value.chartImages || {}))
        }
      }
      
      editorFrame.value?.contentWindow?.postMessage(message, '*')
    }
  } else if (event.data.type === 'SAVE_REPORT') {
    try {
      const { slides } = event.data.data
      
      if (!slides) {
        throw new Error('No slides data received')
      }
      
      const imageData = await generateSlideImages(slides)
      const slideImages = imageData.slideImages
      const chartImages = imageData.chartImages
      const pptData = await generatePPTData(slides)
      
      await reportService.updateReport(reportId, {
        slides,
        slideImages,
        chartImages,
        pptData: new Blob([pptData])
      })
      
      editorFrame.value?.contentWindow?.postMessage({
        type: 'SAVE_SUCCESS'
      }, '*')
    } catch (err) {
      console.error('Error saving report:', err)
      editorFrame.value?.contentWindow?.postMessage({
        type: 'SAVE_ERROR',
        error: 'Failed to save report'
      }, '*')
    }
  }
}

const generateSlideImages = async (slides: any[]): Promise<{ slideImages: string[], chartImages: Record<string, string> }> => {
  try {
    if (editorFrame.value && editorFrame.value.contentWindow) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image generation timeout'))
        }, 30000)
        
        const handleImageResponse = (event: MessageEvent) => {
          if (event.data.type === 'SLIDE_IMAGES_GENERATED') {
            clearTimeout(timeout)
            window.removeEventListener('message', handleImageResponse)
            resolve(event.data.data)
          } else if (event.data.type === 'SLIDE_IMAGES_ERROR') {
            clearTimeout(timeout)
            window.removeEventListener('message', handleImageResponse)
            reject(new Error(event.data.error || 'Image generation failed'))
          }
        }
        
        window.addEventListener('message', handleImageResponse)
        
        editorFrame.value?.contentWindow?.postMessage({
          type: 'GENERATE_SLIDE_IMAGES',
          data: { slides }
        }, '*')
      })
    } else {
      throw new Error('Editor iframe not available')
    }
    
  } catch (error) {
    console.error('Error generating slide images:', error)
    return {
      slideImages: slides.map((_, index) => createPlaceholderSlideImage(index + 1)),
      chartImages: {}
    }
  }
}

const createPlaceholderSlideImage = (slideNumber: number): string => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="1000" height="562.5" viewBox="0 0 1000 562.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="562.5" fill="#f3f4f6"/>
      <text x="500" y="281.25" text-anchor="middle" fill="#6b7280" font-size="24">Slide ${slideNumber}</text>
    </svg>
  `)}`
}

const generatePPTData = async (slides: any[]): Promise<ArrayBuffer> => {
  try {
    if (editorFrame.value && editorFrame.value.contentWindow) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('PPT generation timeout'))
        }, 60000)
        
        const handlePPTResponse = (event: MessageEvent) => {
          if (event.data.type === 'PPT_DATA_GENERATED') {
            clearTimeout(timeout)
            window.removeEventListener('message', handlePPTResponse)
            resolve(event.data.data)
          } else if (event.data.type === 'PPT_DATA_ERROR') {
            clearTimeout(timeout)
            window.removeEventListener('message', handlePPTResponse)
            reject(new Error(event.data.error || 'PPT generation failed'))
          }
        }
        
        window.addEventListener('message', handlePPTResponse)
        
        editorFrame.value?.contentWindow?.postMessage({
          type: 'GENERATE_PPT_DATA',
          data: { slides }
        }, '*')
      })
    } else {
      throw new Error('Editor iframe not available')
    }
    
  } catch (error) {
    console.error('Error generating PPT data:', error)
    throw error
  }
}
</script>

<style scoped>
.report-editor {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.editor-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.editor-loading,
.editor-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f8fafc;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #55B691;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.editor-loading p,
.editor-error p {
  color: #6b7280;
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

</style>

