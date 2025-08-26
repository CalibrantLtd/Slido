<template>
  <div class="slidoai-editor">
    <div class="layout-content">
      <Thumbnails class="layout-content-left" />
      <div class="layout-content-center">
        <CanvasTool class="center-top" />
        <CanvasToolTop class="center-tops" />
        <Canvas class="center-body" :style="{ height: `calc(100% - ${remarkHeight+ 73 + 40}px)` }" />
        <CanvasToolBottom class="center-top" />
        <Remark v-if="false"
          class="center-bottom" 
          v-model:height="remarkHeight" 
          :style="{ height: `${remarkHeight}px` }"
        />
      </div>
      <Toolbar class="layout-content-right" />
    </div>
  </div>

  <SelectPanel v-if="showSelectPanel" />
  <SearchPanel v-if="showSearchPanel" />
  <NotesPanel v-if="showNotesPanel" />
  <MarkupPanel v-if="showMarkupPanel" />

  <Modal
    :visible="!!dialogForExport" 
    :width="680"
    @closed="closeExportDialog()"
  >
    <ExportDialog />
  </Modal>

  <Modal
    :visible="showAIPPTDialog" 
    :width="680"
    :closeOnClickMask="false"
    :closeOnEsc="false"
    closeButton
    @closed="closeAIPPTDialog()"
  >
    <AIPPTDialog />
  </Modal>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useGlobalHotkey from '@/hooks/useGlobalHotkey'
import usePasteEvent from '@/hooks/usePasteEvent'

import Canvas from './Canvas/index.vue'
import CanvasTool from './CanvasTool/index.vue'
import CanvasToolBottom from './CanvasToolBottom/index.vue'
import CanvasToolTop from './CanvasToolTop/index.vue'
import Thumbnails from './Thumbnails/index.vue'
import Toolbar from './Toolbar/index.vue'
import Remark from './Remark/index.vue'
import ExportDialog from './ExportDialog/index.vue'
import SelectPanel from './SelectPanel.vue'
import SearchPanel from './SearchPanel.vue'
import NotesPanel from './NotesPanel.vue'
import MarkupPanel from './MarkupPanel.vue'
import AIPPTDialog from './AIPPTDialog.vue'
import Modal from '@/components/Modal.vue'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { dialogForExport, showSelectPanel, showSearchPanel, showNotesPanel, showMarkupPanel, showAIPPTDialog } = storeToRefs(mainStore)
const closeExportDialog = () => mainStore.setDialogForExport('')
const closeAIPPTDialog = () => mainStore.setAIPPTDialogState(false)

const remarkHeight = ref(0)

useGlobalHotkey()
usePasteEvent()

const handleMessage = async (event: MessageEvent) => {
  
  if (event.data.type === 'PING') {
    // Respond to ping to confirm editor is ready
    window.parent.postMessage({ type: 'PONG' }, '*')
    return
  }
  
  if (event.data.type === 'LOAD_REPORT') {
    const { reportId, name, slides, slideImages, chartImages } = event.data.data
    
    
    if (slides && Array.isArray(slides)) {
      slidesStore.setSlides(slides)
      slidesStore.updateSlideIndex(0)
      
      // Store slideImages for use in elements
      if (slideImages && Array.isArray(slideImages)) {
        slidesStore.setSlideImages(slideImages)
      }

      // Store chartImages for use in elements
      if (chartImages && typeof chartImages === 'object') {
        slidesStore.setChartImages(chartImages)
      }
      
      if (name) {
        document.title = name + ' - Sybil Editor'
      }
    } else {
      console.error('Editor: Invalid slides data:', slides)
    }
  } else if (event.data.type === 'SAVE_REPORT') {
    try {
      const { reportId } = event.data.data
      await saveReportToParent(reportId)
    } catch (error) {
      window.parent.postMessage({
        type: 'SAVE_ERROR',
        error: 'Failed to save report'
      }, '*')
    }
  } else if (event.data.type === 'GENERATE_SLIDE_IMAGES') {
    try {
      const { slides } = event.data.data
      const slideImages = await generateSlideImagesFromEditor(slides)
      const chartImages = await generateChartImagesFromEditor(slides)
      
      window.parent.postMessage({
        type: 'SLIDE_IMAGES_GENERATED',
        data: {
          slideImages,
          chartImages
        }
      }, '*')
    } catch (error) {
      window.parent.postMessage({
        type: 'SLIDE_IMAGES_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, '*')
    }
  } else if (event.data.type === 'GENERATE_PPT_DATA') {
    try {
      const { slides } = event.data.data
      const pptData = await generatePPTDataFromEditor(slides)
      
      window.parent.postMessage({
        type: 'PPT_DATA_GENERATED',
        data: pptData
      }, '*')
    } catch (error) {
      window.parent.postMessage({
        type: 'PPT_DATA_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, '*')
    }
  }
}

const saveReportToParent = async (reportId: string) => {
  try {
    const currentSlides = slidesStore.slides
    const slidesData = JSON.parse(JSON.stringify(currentSlides))
    
    window.parent.postMessage({
      type: 'SAVE_REPORT',
      data: {
        reportId,
        slides: slidesData
      }
    }, '*')
    } catch (error) {
      throw error
    }
}

const generateSlideImagesFromEditor = async (slides: any[]): Promise<string[]> => {
  try {
    const slideImages: string[] = []
    const canvas = document.querySelector('.canvas') as HTMLElement
    if (!canvas) {
      throw new Error('Canvas not found')
    }
    
    const originalSlides = slidesStore.slides
    const originalSlideIndex = slidesStore.slideIndex
    
    try {
      slidesStore.setSlides(slides)
      
      for (let i = 0; i < slides.length; i++) {
        slidesStore.updateSlideIndex(i)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const viewportWrapper = canvas.querySelector('.viewport-wrapper') as HTMLElement
        if (!viewportWrapper) {
          throw new Error('Viewport wrapper not found')
        }
        
        const htmlToImage = await import('html-to-image')
        
        const viewport = viewportWrapper.querySelector('.viewport') as HTMLElement
        const originalTransform = viewport?.style.transform
        if (viewport) {
          viewport.style.transform = 'scale(1, 1)'
        }
        
        const originalWrapperStyle = viewportWrapper.style.cssText
        viewportWrapper.style.cssText = `
          position: absolute;
          width: 1000px;
          height: 562.5px;
          left: 0px;
          top: 0px;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.01), 0 0 12px 0 rgba(0, 0, 0, 0.1);
        `
        
        const dataUrl = await htmlToImage.toSvg(viewportWrapper, {
          quality: 1.0,
          backgroundColor: '#ffffff',
          width: 1000,
          height: 562.5,
          pixelRatio: 2,
          skipFonts: false
        })
        
        if (viewport && originalTransform) {
          viewport.style.transform = originalTransform
        }
        viewportWrapper.style.cssText = originalWrapperStyle
        
        slideImages.push(dataUrl)
      }
      
      return slideImages
      
    } finally {
      slidesStore.setSlides(originalSlides)
      slidesStore.updateSlideIndex(originalSlideIndex)
    }
    
  } catch (error) {
    throw error
  }
}

const generateChartImagesFromEditor = async (slides: any[]): Promise<Record<string, string>> => {
  try {
    const chartImages: Record<string, string> = {}
    const canvas = document.querySelector('.canvas') as HTMLElement
    if (!canvas) {
      throw new Error('Canvas not found')
    }
    
    const originalSlides = slidesStore.slides
    const originalSlideIndex = slidesStore.slideIndex
    
    try {
      slidesStore.setSlides(slides)
      
      for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
        slidesStore.updateSlideIndex(slideIndex)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait longer for charts to render
        
        const slide = slides[slideIndex]
        if (!slide.elements) continue
        
        // Find all performance-chart elements in this slide
        const chartElements = slide.elements.filter((element: any) => element.type === 'performance-chart')
        
        for (const element of chartElements) {
          // Find the chart element in the DOM
          const chartElement = document.querySelector(`[data-element-id="${element.id}"] #chartdiv`) as HTMLElement
          
          if (chartElement) {
            // Check if chart has content (canvas or SVG elements)
            const hasContent = chartElement.querySelector('canvas') || chartElement.querySelector('svg') || chartElement.children.length > 0
            
            // Capture chart element even if it has no content (might be loading or have errors)
            const htmlToImage = await import('html-to-image')
            
            try {
              // Capture just the chart element
              const dataUrl = await htmlToImage.toSvg(chartElement, {
                quality: 1.0,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                skipFonts: false
              })
              
              // Store with element ID as key
              chartImages[element.id] = dataUrl
            } catch (error) {
              console.error(`Failed to capture chart for element ${element.id}:`, error)
            }
          } else {
            const staticChartElement = document.querySelector(`[data-element-id="${element.id}"] .chart-image`) as HTMLElement
            
            if (staticChartElement) {
              const style = window.getComputedStyle(staticChartElement)
              const backgroundImage = style.backgroundImage
              
              if (backgroundImage && backgroundImage.includes('data:image')) {
                try {
                  const htmlToImage = await import('html-to-image')
                  const dataUrl = await htmlToImage.toSvg(staticChartElement, {
                    quality: 1.0,
                    backgroundColor: '#ffffff',
                    pixelRatio: 2,
                    skipFonts: false
                  })
                  
                  chartImages[element.id] = dataUrl
                } catch (error) {
                  console.error(`Failed to capture static chart for element ${element.id}:`, error)
                }
              }
            }
          }
        }
      }
      
      return chartImages
      
    } finally {
      slidesStore.setSlides(originalSlides)
      slidesStore.updateSlideIndex(originalSlideIndex)
    }
    
  } catch (error) {
    throw error
  }
}

const generatePPTDataFromEditor = async (slides: any[]): Promise<ArrayBuffer> => {
  try {
    const useExport = await import('@/hooks/useExport')
    const { exportPPTX } = useExport.default()
    
    return new Promise(async (resolve, reject) => {
      try {
        const pptxgen = await import('pptxgenjs')
        
        const originalWriteFile = pptxgen.default.prototype.writeFile
        
        pptxgen.default.prototype.writeFile = async function(options: any): Promise<string> {
          try {
            const buffer = await this.write({ outputType: 'arraybuffer' }) as ArrayBuffer
            resolve(buffer)
            return ''
          } catch (error) {
            console.error('Error creating arraybuffer:', error)
            reject(error)
            return ''
          }
        }
        
        await exportPPTX(slides, false, false)
        
        setTimeout(() => {
          pptxgen.default.prototype.writeFile = originalWriteFile
        }, 500)
        
      } catch (error) {
        console.error('Error in generatePPTDataFromEditor:', error)
        reject(error)
      }
    })
    
  } catch (error) {
    throw error
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'EDITOR_READY' }, '*')
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<style lang="scss" scoped>
.slidoai-editor {
  height: calc(100% - 31px);
}
.layout-content {
  height: 100%;
  display: flex;
}
.layout-content-left {
  width: 256px;
  height: 100%;
  flex-shrink: 0;
}
.layout-content-center {
  width: calc(100% - 160px - 260px);

  .center-top {
    height: 40px;
  }
}
.layout-content-right {
  width: 260px;
  height: 100%;
}
</style>
