<template>
  <div class="template-viewer">
    <div class="viewer-header">
      <div class="template-info">
        <h1>{{ templateName }}</h1>
        <p>Template Preview</p>
      </div>
      <div class="header-actions">
        <button @click="goBack" class="back-btn">
          ← Back to Templates
        </button>
        <button @click="addPortfolioData" class="portfolio-btn">
          Add Portfolio Data
        </button>
        <button @click="editTemplate" class="edit-btn">
          Edit Template
        </button>
      </div>
    </div>

    <!-- Slides container -->
    <div class="slides-container">
      <div class="slide-wrapper">
        <div class="slide-frame" :style="{ width: slideWidth + 'px', height: slideHeight + 'px' }">
          <div 
            class="viewport-wrapper"
            :style="{
              width: slideWidth + 'px',
              height: slideHeight + 'px',
              left: '0px',
              top: '0px',
            }"
          >
            <div 
              class="viewport" 
              :style="{ 
                transform: `scale(${scaleX}, ${scaleY})`,
                transformOrigin: '0 0'
              }"
            >
              <div 
                class="slide-content"
                :style="{
                  width: '960px',
                  height: '580px',
                  position: 'relative',
                  ...getSlideBackgroundStyle(currentSlide.background)
                }"
              >
                <component
                  v-for="(element, index) in currentSlide.elements || []"
                  :key="element.id || index"
                  :is="getElementComponent(element.type)"
                  :elementInfo="element"
                  :selectElement="() => {}"
                  :contextmenus="() => null"
                  :style="{
                    position: 'absolute',
                    top: element.top + 'px',
                    left: element.left + 'px',
                    width: element.width + 'px',
                    height: element.height + 'px',
                    zIndex: index + 1,
                    pointerEvents: 'none',
                    display: shouldHideElement(element) ? 'none' : (element.visible === false ? 'none' : 'block')
                  }"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="slide-navigation">
          <button 
            @click="previousSlide" 
            :disabled="currentSlideIndex === 0"
            class="nav-btn prev-btn"
          >
            ← Previous
          </button>
          
          <span class="slide-number">
            {{ currentSlideIndex + 1 }} / {{ slides.length }}
          </span>
          
          <button 
            @click="nextSlide" 
            :disabled="currentSlideIndex === slides.length - 1"
            class="nav-btn next-btn"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
    <PortfolioBounceSelectionModal
      :visible="isPortfolioModalVisible"
      :portfolios-data="portfoliosData"
      @close="onPortfolioModalClose"
      @confirm="onPortfolioModalConfirm"
      @request-template-data="onRequestTemplateData"
      @show-wizard="onShowWizard"
    />
    
    <!-- Dashboard Wizard Modal -->
    <Modal
      :visible="isWizardModalVisible"
      :width="700"
      @update:visible="onWizardModalClose"
    >
      <SybilWizard
        v-if="currentWizardData"
        :portfolio="currentWizardData.wizardInstance.portfolio"
        :bounce="currentWizardData.wizardInstance.bounce"
        @close="onWizardClose"
        @finish="onWizardFinish"
      />
    </Modal>
    
    <!-- No Tables Found Modal -->
    <div v-if="noTablesModal.visible" class="modal-overlay" @click="closeNoTablesModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>No Dashboard Tables</h3>
        </div>
        <div class="modal-body">
          <p>No dashboard tables found in this template.</p>
          <p class="info-text">Please add dashboard tables to your template before adding portfolio data.</p>
        </div>
        <div class="modal-footer">
          <button @click="closeNoTablesModal" class="btn primary">OK</button>
        </div>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="errorModal.visible" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Error</h3>
        </div>
        <div class="modal-body">
          <p>{{ errorModal.message }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeErrorModal" class="btn primary">OK</button>
        </div>
      </div>
    </div>
    
    <!-- Success Toast -->
    <div v-if="successModal.visible" class="success-toast">
      <div class="success-toast-content">
        <div class="success-icon">✓</div>
        <p>{{ successModal.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { templateService } from '@/services/templateService'
import { portfolioService } from '@/services/portfolioService'
import { useGlobalStore } from '@/stores/global'
import useSlideBackgroundStyle from '@/hooks/useSlideBackgroundStyle'

import TextElement from '@/views/components/element/TextElement/index.vue'
import ImageElement from '@/views/components/element/ImageElement/index.vue'
import ShapeElement from '@/views/components/element/ShapeElement/index.vue'
import LineElement from '@/views/components/element/LineElement/index.vue'
import TableElement from '@/views/components/element/TableElement/index.vue'
import ChartElement from '@/views/components/element/ChartElement/index.vue'
import LatexElement from '@/views/components/element/LatexElement/index.vue'
import VideoElement from '@/views/components/element/VideoElement/index.vue'
import AudioElement from '@/views/components/element/AudioElement/index.vue'
import DashboardTableElement from '@/views/components/element/DashboardTableElement/index.vue'
import PortfolioBounceSelectionModal from '@/components/PortfolioBounceSelectionModal.vue'
import Modal from '@/components/Modal.vue'
import SybilWizard from '@/views/Editor/CanvasToolTop/SybilWizard.vue'

interface Template {
  id?: string
  name: string
  slides: any[]
  metadata?: {
    createdAt: string
    updatedAt: string
  }
}

const router = useRouter()
const route = useRoute()
const templateId = route.params.id as string
const globalStore = useGlobalStore()

const template = ref<Template | null>(null)
const slides = ref<any[]>([])
const templateName = ref('')
const currentSlideIndex = ref(0)

const isPortfolioModalVisible = ref(false)
const selectedPortfolio = ref<any>(null)
const selectedBounce = ref<any>(null)
const portfoliosData = ref<any>(null)

// Wizard modal state
const isWizardModalVisible = ref(false)
const currentWizardData = ref<any>(null)
const wizardQueue = ref<any[]>([])
const currentWizardIndex = ref(0)
const hasProcessedTables = ref(false)

// No tables modal state
const noTablesModal = ref({
  visible: false
})

// Error modal state
const errorModal = ref({
  visible: false,
  message: ''
})

// Success modal state
const successModal = ref({
  visible: false,
  message: ''
})

const slideWidth = 720
const slideHeight = 405

const scaleX = slideWidth / 960  
const scaleY = slideHeight / 580 

const currentSlide = computed(() => {
  return slides.value[currentSlideIndex.value] || { elements: [] }
})

// Get slide background style using the same logic as the editor
const getSlideBackgroundStyle = (background: any) => {
  if (!background) return { backgroundColor: '#fff' }

  const { type, color, image, gradient } = background

  // Solid color background
  if (type === 'solid') return { backgroundColor: color }

  // Image background mode
  else if (type === 'image' && image) {
    const { src, size } = image
    if (!src) return { backgroundColor: '#fff' }
    if (size === 'repeat') {
      return {
        backgroundImage: `url(${src})`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'center'
      }
    }
    return {
      backgroundImage: `url(${src})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: size || 'cover',
      backgroundPosition: 'center'
    }
  }

  // Gradient background
  else if (type === 'gradient' && gradient) {
    const { type: gradientType, colors, rotate } = gradient
    const list = colors.map(item => `${item.color} ${item.pos}%`)

    if (gradientType === 'radial') return { backgroundImage: `radial-gradient(${list.join(',')})` }
    return { backgroundImage: `linear-gradient(${rotate}deg, ${list.join(',')})` }
  }

  return { backgroundColor: '#fff' }
}

const loadTemplate = async () => {
  try {
    const templateData = await templateService.loadTemplate(templateId)
    if (templateData) {
      template.value = templateData
      slides.value = templateData.slides || []
      templateName.value = templateData.name
    }
  } catch (error) {
    console.error('❌ Failed to load template:', error)
  }
}

const goBack = () => {
  router.push('/templates')
}

const previousSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--
  }
}

const nextSlide = () => {
  if (currentSlideIndex.value < slides.value.length - 1) {
    currentSlideIndex.value++
  }
}

const editTemplate = () => {
  router.push(`/editor?templateId=${templateId}&mode=edit`)
}

const addPortfolioData = async () => {
  try {
    globalStore.setLoading(true)
    // Pre-fetch portfolios to ensure they're loaded before showing modal
    const response = await portfolioService.fetchPortfolios()
    portfoliosData.value = response
    // Show modal with pre-loaded data
    isPortfolioModalVisible.value = true
    // Emit ready immediately since data is already loaded
    setTimeout(() => {
      globalStore.setLoading(false)
    }, 50)
  } catch (error) {
    globalStore.setLoading(false)
    showErrorModal('Failed to load portfolios. Please try again.')
  }
}

const onPortfolioModalClose = () => {
  isPortfolioModalVisible.value = false
}

// No tables modal functions
const showNoTablesModal = () => {
  noTablesModal.value.visible = true
}

const closeNoTablesModal = () => {
  noTablesModal.value.visible = false
}

// Error modal functions
const showErrorModal = (message: string) => {
  errorModal.value.message = message
  errorModal.value.visible = true
}

const closeErrorModal = () => {
  errorModal.value.visible = false
}

// Success modal functions
const showSuccessModal = (message: string) => {
  successModal.value.message = message
  successModal.value.visible = true
  
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    successModal.value.visible = false
  }, 4000)
}

const closeSuccessModal = () => {
  successModal.value.visible = false
}

const onPortfolioModalConfirm = async (portfolio: any, bounce: any) => {
  selectedPortfolio.value = portfolio
  selectedBounce.value = bounce
  
  if (hasProcessedTables.value) {
    return
  }
  
  try {
    let hasProcessedDashboardTables = false
    for (const slide of slides.value) {
      for (const element of slide.elements) {
        if (element.type === 'dashboard-table' && !element.isTemplatePlaceholder && element.portfolioId) {
          hasProcessedDashboardTables = true
          break
        }
      }
      if (hasProcessedDashboardTables) break
    }
    
    if (hasProcessedDashboardTables) {
      hasProcessedTables.value = true
      return
    }
    
    const mockDashboardTables = await scanTemplateForMockDashboardTables()
    
    if (mockDashboardTables.length > 0) {
      hasProcessedTables.value = true
      await showDashboardWizardForMockTables(mockDashboardTables, portfolio, bounce)
    } else {
      showNoTablesModal()
    }
  } catch (error) {
    console.error('❌ Error processing portfolio selection:', error)
    showErrorModal('Failed to process portfolio selection. Please try again.')
  }
}

const scanTemplateForMockDashboardTables = async () => {
  const mockTables: any[] = []
  
  for (let slideIndex = 0; slideIndex < slides.value.length; slideIndex++) {
    const slide = slides.value[slideIndex]
    
    for (let elementIndex = 0; elementIndex < slide.elements.length; elementIndex++) {
      const element = slide.elements[elementIndex]
      
      if (element.type === 'dashboard-table' && element.isTemplatePlaceholder) {
        const mockTable = {
          slideId: slide.id,
          elementId: element.id,
          element: element
        }
        mockTables.push(mockTable)
      }
    }
  }
  
  return mockTables
}

const showDashboardWizardForMockTables = async (mockTables: any[], portfolio: any, bounce: any) => {
  for (let i = 0; i < mockTables.length; i++) {
    const mockTable = mockTables[i]
    
    const wizardInstance = {
      portfolio,
      bounce,
      mockTable,
      wizardType: 'dashboard-table'
    }
    
    const wizardPromise = new Promise((resolve, reject) => {
      onShowWizard(wizardInstance, resolve, reject)
    })
    
    await wizardPromise
  }
}

const exportTemplateWithRealData = async () => {
  try {
    let portfolioName = 'Unknown Portfolio'
    let bounceName = 'Unknown Bounce'
    
    for (const slide of slides.value) {
      for (const element of slide.elements) {
        if (element.type === 'dashboard-table' && element.portfolioName && element.bounceName) {
          portfolioName = element.portfolioName
          bounceName = element.bounceName
          break
        }
      }
      if (portfolioName !== 'Unknown Portfolio') break
    }
    
    const useExport = await import('@/hooks/useExport')
    const { reportService } = await import('@/services/reportService')
    
    const pptBlob = await exportTemplateAsBlob(slides.value)
    
    const reportName = `${templateName.value} - ${portfolioName} - ${bounceName}`
    
    const slideImages = await captureSlideImages(slides.value)

    const reportId = await reportService.saveReport({
      name: reportName,
      templateId: template.value?.id || '',
      templateName: templateName.value,
      portfolioId: selectedPortfolio.value.id,
      portfolioName: selectedPortfolio.value.name,
      bounceId: selectedBounce.value.id,
      bounceName: selectedBounce.value.displayName || selectedBounce.value.name,
      pptData: pptBlob,
      slideImages: slideImages
    })
    
    restoreMockTables()
    
    showSuccessModal(`Report "${reportName}" has been saved successfully!`)
    
  } catch (error) {
    console.error('❌ Error exporting template:', error)
    restoreMockTables()
    showErrorModal('Failed to export template. Please try again.')
  }
}

const exportTemplateAsBlob = async (slides: any[]): Promise<Blob> => {
  try {
    const useExport = await import('@/hooks/useExport')
    const { exportPPTX } = useExport.default()
    
    return new Promise(async (resolve, reject) => {
      try {
        const pptxgen = await import('pptxgenjs')
        
        const originalWriteFile = pptxgen.default.prototype.writeFile
        
        pptxgen.default.prototype.writeFile = async function(options: any): Promise<string> {
          try {
            const blob = await this.write({ outputType: 'blob' }) as Blob
            resolve(blob)
            return ''
          } catch (error) {
            console.error('Error creating blob:', error)
            reject(error)
            return ''
          }
        }
        
        await exportPPTX(slides, false, false)
        
        setTimeout(() => {
          pptxgen.default.prototype.writeFile = originalWriteFile
        }, 500)
        
      } catch (error) {
        console.error('Error in exportTemplateAsBlob:', error)
        reject(error)
      }
    })
    
  } catch (error) {
    console.error('Error in exportTemplateAsBlob:', error)
    throw error
  }
}

const captureDashboardTableAsImage = async (element: any): Promise<string | null> => {
  try {
    const elementEl = document.querySelector(`.dashboard-table-element[data-element-id="${element.id}"]`)
    if (!elementEl) return null
    
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(elementEl as HTMLElement, {
      quality: 1,
      width: element.width,
      height: element.height,
    })
    
    return dataUrl
  } catch (error) {
    console.error('Error capturing dashboard table:', error)
    return null
  }
}

const captureSlideImages = async (slides: any[]): Promise<string[]> => {
  try {
    const slideImages: string[] = []
    
    const originalSlideIndex = currentSlideIndex.value
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      
      try {
        currentSlideIndex.value = i
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const slideElement = document.querySelector('.slide-content')
        
        if (!slideElement) {
          slideImages.push(createPlaceholderSlideImage(i + 1))
          continue
        }
        
        const htmlToImage = await import('html-to-image')
        const dataUrl = await htmlToImage.toPng(slideElement as HTMLElement, {
          quality: 0.8,
          backgroundColor: '#ffffff',
          width: 960,
          height: 540
        })
        
        slideImages.push(dataUrl)
        
      } catch (error) {
        console.error(`Error capturing slide ${i + 1}:`, error)
        slideImages.push(createPlaceholderSlideImage(i + 1))
      }
    }
    
    currentSlideIndex.value = originalSlideIndex
    
    return slideImages
    
  } catch (error) {
    console.error('Error capturing slide images:', error)
    return slides.map((_, index) => createPlaceholderSlideImage(index + 1))
  }
}

const createPlaceholderSlideImage = (slideNumber: number): string => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="720" height="405" viewBox="0 0 720 405" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="720" height="405" fill="#f3f4f6"/>
      <text x="360" y="202.5" text-anchor="middle" fill="#6b7280" font-size="24">Slide ${slideNumber}</text>
    </svg>
  `)}`
}

const onRequestTemplateData = (callback: (data: any) => void) => {
  const templateData = {
    slides: slides.value,
    name: templateName.value,
    id: template.value?.id
  }
  callback(templateData)
}

const onShowWizard = async (wizardInstance: any, resolve: (value: any) => void, reject: (error: any) => void) => {
  try {
    const wizardInstanceCopy = {
      portfolio: wizardInstance.portfolio,
      bounce: wizardInstance.bounce,
      mockTable: wizardInstance.mockTable,
      wizardType: wizardInstance.wizardType
    }
    
    wizardQueue.value.push({
      wizardInstance: wizardInstanceCopy,
      resolve,
      reject
    })
    
    if (!isWizardModalVisible.value) {
      isPortfolioModalVisible.value = false
      await showNextWizard()
    }
  } catch (error) {
    reject(error)
  }
}

const showNextWizard = async () => {
  if (wizardQueue.value.length === 0) {
    isWizardModalVisible.value = false
    currentWizardData.value = null
    return
  }
  
  const wizardData = wizardQueue.value[currentWizardIndex.value]
  
  currentWizardData.value = wizardData
  isWizardModalVisible.value = true
}

const onWizardClose = () => {
  const currentWizard = wizardQueue.value[currentWizardIndex.value]
  if (currentWizard) {
    currentWizard.reject(new Error('Wizard cancelled'))
  }
  wizardQueue.value = []
  currentWizardIndex.value = 0
  isWizardModalVisible.value = false
}

const onWizardFinish = async (wizardData: any) => {
  if (currentWizardIndex.value >= wizardQueue.value.length) {
    return
  }
  
  const currentWizard = wizardQueue.value[currentWizardIndex.value]
  
  if (currentWizard) {
    if (!currentWizard.wizardInstance.mockTable) {
      console.error('MockTable is undefined! Cannot proceed.')
      currentWizard.reject(new Error('MockTable is undefined'))
      return
    }
    
    globalStore.setLoading(true)
    
    try {
      await replaceMockTableWithRealData(currentWizard.wizardInstance.mockTable, wizardData, currentWizard)
      currentWizard.resolve(wizardData)
    } catch (error) {
      console.error('Error in onWizardFinish:', error)
      currentWizard.reject(error)
    } finally {
      globalStore.setLoading(false)
    }
  }
  
  currentWizardIndex.value++
  if (currentWizardIndex.value < wizardQueue.value.length) {
    showNextWizard()
  } else {
    wizardQueue.value = []
    currentWizardIndex.value = 0
    isWizardModalVisible.value = false
    currentWizardData.value = null
    
    globalStore.setLoading(true)
    try {
      await exportTemplateWithRealData()
    } catch (error) {
      console.error('Error exporting template:', error)
    } finally {
      globalStore.setLoading(false)
    }
  }
}

const replaceMockTableWithRealData = async (mockTable: any, wizardData: any, currentWizard: any) => {
  try {
    if (!mockTable) {
      console.error('MockTable is undefined in replaceMockTableWithRealData')
      throw new Error('MockTable is undefined')
    }
    
    const slide = slides.value.find(s => s.id === mockTable.slideId)
    if (!slide) {
      console.error('Slide not found:', mockTable.slideId)
      return
    }
    
    const element = slide.elements.find(e => e.id === mockTable.elementId)
    if (!element) {
      console.error('Element not found:', mockTable.elementId)
      return
    }
    
    const originalState = {
      isTemplatePlaceholder: element.isTemplatePlaceholder,
      selectedFilters: element.selectedFilters,
      accidentUnderwriting: element.accidentUnderwriting,
      columnConfig: element.columnConfig,
      portfolioId: element.portfolioId,
      portfolioName: element.portfolioName,
      bounceId: element.bounceId,
      bounceName: element.bounceName,
      attritionalOnly: element.attritionalOnly,
      largeOnly: element.largeOnly,
      weatherOnly: element.weatherOnly,
      totalUltimateOnly: element.totalUltimateOnly,
      lossRatiosOnly: element.lossRatiosOnly,
      attritionalLargeExpanded: element.attritionalLargeExpanded
    }
    
    element.isTemplatePlaceholder = false
    element.selectedFilters = wizardData.dashboardFilters.selectedFilters
    element.accidentUnderwriting = wizardData.dashboardFilters.accidentUnderwriting
    element.columnConfig = wizardData.columnConfig
    element.portfolioId = currentWizard.wizardInstance.portfolio.id
    element.portfolioName = currentWizard.wizardInstance.portfolio.name
    element.bounceId = currentWizard.wizardInstance.bounce.id
    element.bounceName = currentWizard.wizardInstance.bounce.displayName || currentWizard.wizardInstance.bounce.name
    
    if (template.value?.id === 'title-and-attritional') {
      element.attritionalOnly = true
    }
    if (template.value?.id === 'title-and-large') {
      element.largeOnly = true
    }
    if (template.value?.id === 'title-and-weather') {
      element.weatherOnly = true
    }
    if (template.value?.id === 'title-and-total-ultimate') {
      element.totalUltimateOnly = true
    }
    if (template.value?.id === 'title-and-loss-ratios') {
      element.lossRatiosOnly = true
    }
    if (template.value?.id === 'title-table-text-expanded') {
      element.attritionalLargeExpanded = true
    }
    
    const svgImage = slide.elements.find(e => e.type === 'image' && e.src?.includes('MockTable.svg'))
    if (svgImage) {
      svgImage._originalVisibility = svgImage.visible !== false
      svgImage.visible = false
    }
    
    element._originalInvisible = element.isInvisible
    element.isInvisible = false
    
    await loadPortfolioDataForElement(element, currentWizard.wizardInstance.portfolio, currentWizard.wizardInstance.bounce)
    
    element._originalMockState = originalState
    
  } catch (error) {
    console.error('Error replacing mock table:', error)
  }
}

const restoreMockTables = () => {
  try {
    slides.value.forEach(slide => {
      slide.elements.forEach(element => {
        if (element._originalMockState) {
          element.isTemplatePlaceholder = element._originalMockState.isTemplatePlaceholder
          element.selectedFilters = element._originalMockState.selectedFilters
          element.accidentUnderwriting = element._originalMockState.accidentUnderwriting
          element.columnConfig = element._originalMockState.columnConfig
          element.portfolioId = element._originalMockState.portfolioId
          element.portfolioName = element._originalMockState.portfolioName
          element.bounceId = element._originalMockState.bounceId
          element.bounceName = element._originalMockState.bounceName
          element.attritionalOnly = element._originalMockState.attritionalOnly
          element.largeOnly = element._originalMockState.largeOnly
          element.weatherOnly = element._originalMockState.weatherOnly
          element.totalUltimateOnly = element._originalMockState.totalUltimateOnly
          
          const svgImage = slide.elements.find(e => e.type === 'image' && e.src?.includes('MockTable.svg'))
          if (svgImage && svgImage._originalVisibility !== undefined) {
            svgImage.visible = svgImage._originalVisibility
            delete svgImage._originalVisibility
          }
          
          if (element._originalInvisible !== undefined) {
            element.isInvisible = element._originalInvisible
            delete element._originalInvisible
          }
          
          delete element._originalMockState
        }
      })
    })
  } catch (error) {
    console.error('Error restoring mock tables:', error)
  }
}

const loadPortfolioDataForElement = async (element: any, portfolio: any, bounce: any) => {
  try {
    if (!portfolio?.id || !bounce?.id) return
    
    const { portfolioService } = await import('@/services/portfolioService')
    const { useDashboardStore } = await import('@/store/dashboard')
    
    const dashboardStore = useDashboardStore()
    
    const completeData = await portfolioService.fetchCompletePortfolioData(
      portfolio.id,
      bounce.id
    )
    
    const bounceName = bounce.displayName || bounce.name || ''
    completeData.portfolioName = portfolio.name || ''
    completeData.bounceName = bounceName.slice(26) || bounceName.slice(25)
    completeData.bounceDate = bounceName.slice(0, 6)
    completeData.bounceFullName = bounceName
    
    dashboardStore.setPortfolioData(completeData)
    
    if (element.selectedFilters) {
      Object.assign(dashboardStore.selectedFilters, element.selectedFilters)
    }
    
    if (element.accidentUnderwriting) {
      dashboardStore.setAccidentUnderwriting(element.accidentUnderwriting)
    }
    
    if (element.columnConfig?.showColumn) {
      dashboardStore.setColumnState({
        showColumn: element.columnConfig.showColumn,
        margin: element.columnConfig.margin,
        showColumnTotal: element.columnConfig.showColumnTotal,
        totalMargin: element.columnConfig.totalMargin
      })
    }
    
    await dashboardStore.loadDashboard(completeData)
    
  } catch (error) {
    console.error('Error loading portfolio data for element:', error)
  }
}

const onWizardModalClose = (visible: boolean) => {
  if (!visible) {
    onWizardClose()
  }
}

const elementComponents = {
  'text': TextElement,
  'image': ImageElement, 
  'shape': ShapeElement,
  'line': LineElement,
  'chart': ChartElement,
  'table': TableElement,
  'latex': LatexElement,
  'video': VideoElement,
  'audio': AudioElement,
  'dashboard-table': DashboardTableElement
}

const getElementComponent = (elementType: string) => {
  return elementComponents[elementType as keyof typeof elementComponents] || null
}

const shouldHideElement = (element: any) => {
  if (element.type === 'image' && element.src?.includes('MockTable.svg')) {
    const slide = slides.value[currentSlideIndex.value]
    if (slide) {
      const dashboardTable = slide.elements.find(e => 
        e.type === 'dashboard-table' && 
        !e.isTemplatePlaceholder && 
        e.portfolioId
      )
      return !!dashboardTable
    }
  }
  
  
  return false
}

onMounted(() => {
  loadTemplate()
})
</script>

<style scoped>
.template-viewer {
  background: #f8fafc;
}

.viewer-header {
  background: white;
  padding: 4px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.template-info h1 {
  margin: 0 0 1px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.template-info p {
  margin: 0;
  font-size: 10px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.back-btn,
.portfolio-btn,
.edit-btn {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.back-btn {
  background: #e5e7eb;
  color: #374151;
}

.back-btn:hover {
  background: #d1d5db;
}

.portfolio-btn {
  background: rgb(187, 226, 211);
  color: #1f2937;
}

.portfolio-btn:hover {
  background: rgb(167, 216, 191);
}

.edit-btn {
  background: rgb(187, 226, 211);
  color: #1f2937;
}

.edit-btn:hover {
  background: rgb(167, 216, 191);
}

.slides-container {
  padding: 10px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  padding-top: 40px;
}

.slide-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
  max-width: 100%;
}

.slide-frame {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  transform-origin: center;
  margin: 0 auto;
}

.viewport-wrapper {
  position: absolute;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.01), 0 0 12px 0 rgba(0, 0, 0, 0.1);
}

.viewport {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}

.slide-content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.slide-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
  padding: 2px 0;
}

.nav-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-number {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  padding: 0 8px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0 0 12px 0;
  color: #374151;
  line-height: 1.5;
}

.info-text {
  color: #6b7280 !important;
  font-size: 14px;
}

.modal-footer {
  padding: 16px 24px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
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

/* Success Toast Styles */
.success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  pointer-events: none; /* Allow clicks to pass through */
}

.success-toast-content {
  background: #55B691;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  max-width: 400px;
  animation: slideInRight 0.3s ease-out;
}

.success-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.success-toast-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>