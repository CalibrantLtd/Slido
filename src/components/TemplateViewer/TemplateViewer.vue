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
                  width: '1000px',
                  height: '562.5px',
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
      :pre-selected-portfolio-id="newBounceMode ? sourceReportData?.portfolioId : undefined"
      :new-bounce-mode="newBounceMode"
      context="editor"
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
        :element="currentWizardData.wizardInstance.mockTable?.element"
        :wizard-type="currentWizardData.wizardInstance.wizardType"
        :pre-populated-settings="currentWizardData.wizardInstance.prePopulatedSettings"
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

    <div 
      v-if="mountAllTablesForExport"
      style="position: absolute; left: -10000px; top: -10000px; width: 1000px; height: 562.5px; overflow: visible;"
    >
      <div 
        v-for="(slide, sIdx) in slides" 
        :key="slide.id || sIdx"
        :data-slide-id="slide.id"
        style="position: absolute; width: 1000px; height: 562.5px;"
        :style="{
          ...getSlideBackgroundStyle(slide.background)
        }"
      >
        <component
          v-for="(element, index) in slide.elements || []"
          :key="element.id || index"
          :is="getElementComponent(element.type)"
          :elementInfo="element"
          :selectElement="() => {}"
          :contextmenus="() => null"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
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
import PerformanceChartElement from '@/views/components/element/PerformanceChartElement/index.vue'
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

const isWizardModalVisible = ref(false)
const currentWizardData = ref<any>(null)
const wizardQueue = ref<any[]>([])
const currentWizardIndex = ref(0)
const hasProcessedTables = ref(false)

const noTablesModal = ref({
  visible: false
})

const errorModal = ref({
  visible: false,
  message: ''
})

const successModal = ref({
  visible: false,
  message: ''
})

const newBounceMode = ref(false)
const sourceReportData = ref<any>(null)
const prePopulatedWizardSettings = ref<any>(null)

const slideWidth = 720
const slideHeight = 405

const scaleX = slideWidth / 1000  
const scaleY = slideHeight / 562.5 

const currentSlide = computed(() => {
  return slides.value[currentSlideIndex.value] || { elements: [] }
})

const mountAllTablesForExport = ref(false)

const getSlideBackgroundStyle = (background: any) => {
  if (!background) return { backgroundColor: '#fff' }

  const { type, color, image, gradient } = background

  if (type === 'solid') return { backgroundColor: color }
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

const showNoTablesModal = () => {
  noTablesModal.value.visible = true
}

const closeNoTablesModal = () => {
  noTablesModal.value.visible = false
}

const showErrorModal = (message: string) => {
  errorModal.value.message = message
  errorModal.value.visible = true
}

const closeErrorModal = () => {
  errorModal.value.visible = false
}

const showSuccessModal = (message: string) => {
  successModal.value.message = message
  successModal.value.visible = true
  
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
    const mockDashboardTables = await scanTemplateForMockDashboardTables()
    
    if (mockDashboardTables.length > 0) {
      hasProcessedTables.value = true
      
      if (newBounceMode.value && prePopulatedWizardSettings.value) {
        await applyPrePopulatedSettingsAndGenerate(mockDashboardTables, portfolio, bounce)
      } else {
        // Normal flow: show wizard
        await showDashboardWizardForMockTables(mockDashboardTables, portfolio, bounce)
      }
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
  
  const slidesCopy = JSON.parse(JSON.stringify(slides.value))
  
  for (let slideIndex = 0; slideIndex < slidesCopy.length; slideIndex++) {
    const slide = slidesCopy[slideIndex]
    
    for (let elementIndex = 0; elementIndex < slide.elements.length; elementIndex++) {
      const element = slide.elements[elementIndex]
      
      if (element.type === 'dashboard-table' || element.type === 'performance-chart') {
        if (element.isTemplatePlaceholder) {
          const mockTable = {
            slideId: slide.id,
            elementId: element.id,
            element: JSON.parse(JSON.stringify(element)) // Create a deep copy of the element
          }
          mockTables.push(mockTable)
        }
      }
    }
  }
  
  return mockTables
}

const showDashboardWizardForMockTables = async (mockTables: any[], portfolio: any, bounce: any) => {
  const wizardPromises = mockTables.map((mockTable) => {
    const wizardType = mockTable.element.type === 'performance-chart' ? 'performance-chart' : 
                       'dashboard-table'
    
    // Get pre-populated settings for this specific element
    const elementKey = `${mockTable.slideId}_${mockTable.elementId}`
    const prePopSettings = prePopulatedWizardSettings.value?.[elementKey] || null
    
    const wizardInstance = {
      portfolio,
      bounce,
      mockTable,
      wizardType,
      prePopulatedSettings: prePopSettings  // Pass pre-populated settings
    }
    
    return new Promise((resolve, reject) => {
      onShowWizard(wizardInstance, resolve, reject)
    })
  })
  
  await Promise.all(wizardPromises)
}

const applyPrePopulatedSettingsAndGenerate = async (mockTables: any[], portfolio: any, bounce: any) => {
  globalStore.setLoading(true)
  
  try {
    for (const mockTable of mockTables) {
      // Get pre-populated settings for this specific element
      const elementKey = `${mockTable.slideId}_${mockTable.elementId}`
      const prePopSettings = prePopulatedWizardSettings.value?.[elementKey]
      
      if (prePopSettings) {
        try {
          await applySettingsToDashboardStore(prePopSettings, portfolio, bounce, mockTable.element)
          
          const wizardData = await generateWizardDataFromCurrentState(prePopSettings)
          
          const mockWizardInstance = {
            wizardInstance: {
              portfolio: portfolio,
              bounce: bounce,
              mockTable: mockTable,
              wizardType: prePopSettings.wizardType
            }
          }
          
          await replaceMockTableWithRealData(mockTable, wizardData, mockWizardInstance)
        } catch (error) {
          console.error(`❌ Error processing element ${elementKey}:`, error)
        }
      }
    }
    
    await exportTemplateWithRealData()
    
    router.push('/reports')
    
  } catch (error) {
    console.error('❌ Error auto-applying settings:', error)
    throw error
  } finally {
    // Hide loading indicator (same as SybilWizard finish)
    globalStore.setLoading(false)
  }
}

const applySettingsToDashboardStore = async (settings: any, portfolio: any, bounce: any, element: any) => {
  try {
    const { dashboardConfig, dashboardFilters, chartConfig } = settings
    
    const { useDashboardStore } = await import('@/store/dashboard')
    const dashboardStore = useDashboardStore()
    
    try {
      await loadPortfolioDataForElement(element, portfolio, bounce)
    } catch (error) {
      console.warn('⚠️ Portfolio data loading failed, continuing with settings application:', error)
    }
    
    if (dashboardConfig) {
      if (dashboardConfig.mqy && dashboardConfig.mqy !== dashboardStore.dashboards.mqy) {
        dashboardStore.setPeriod(dashboardConfig.mqy)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.period) {
        await setUwModeProgrammatically(dashboardConfig.period)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.premium && dashboardStore.dashboards.gwpnwp !== dashboardConfig.premium) {
        dashboardStore.switch_gwpnwp_amount()
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.basis && dashboardStore.underwriting_loss_ratios !== dashboardConfig.basis) {
        dashboardStore.underwritingLossRatiosChange()
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.ccr_nlr && dashboardStore.dashboards.ccr_nlr !== dashboardConfig.ccr_nlr) {
        dashboardStore.changeccrnlr()
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.seasonality !== undefined && !!dashboardStore.dashboards.seasonFactor !== !!dashboardConfig.seasonality) {
        dashboardStore.changeSeas()
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.display && dashboardStore.dashboards.ratio_amount !== dashboardConfig.display) {
        dashboardStore.switch_ratio_amount()
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    if (dashboardFilters && dashboardFilters.selectedFilters) {
      Object.keys(dashboardFilters.selectedFilters).forEach(category => {
        dashboardStore.setFilterSelection(category, dashboardFilters.selectedFilters[category])
      })
    }
    
    if (chartConfig && element.type === 'performance-chart') {
      if (chartConfig.isGLR !== undefined) {
        dashboardStore.graphConfig.isGLR = chartConfig.isGLR
      }
      if (chartConfig.isNormalised !== undefined) {
        dashboardStore.graphConfig.isNormalised = chartConfig.isNormalised
      }
      if (chartConfig.showGwpBars !== undefined) {
        dashboardStore.graphConfig.showGwpBars = chartConfig.showGwpBars
      }
      if (chartConfig.showGepBars !== undefined) {
        dashboardStore.graphConfig.showGepBars = chartConfig.showGepBars
      }
      if (chartConfig.showSeasonalityApriori !== undefined) {
        dashboardStore.graphConfig.showSeasonalityApriori = chartConfig.showSeasonalityApriori
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying settings to dashboard store:', error)
    throw error
  }
}

const setUwModeProgrammatically = async (target: string) => {
  const { useDashboardStore } = await import('@/store/dashboard')
  const dashboardStore = useDashboardStore()
  
  const isYear = dashboardStore.dashboards.mqy === 'year'
  const inAcc = dashboardStore.dashboards.uw_acc === 'acc'
  const inUw = dashboardStore.dashboards.uw_acc === 'uw'
  const inBespoke = dashboardStore.isBindedYears

  if (target === 'acc') {
    if (inAcc) return
    if (inBespoke) {
      await dashboardStore.change_uw_acc() // bespoke -> uw
      await dashboardStore.change_uw_acc() // uw -> acc
    } else if (inUw) {
      await dashboardStore.change_uw_acc() // uw -> acc
    }
    return
  }

  if (target === 'uw') {
    if (inUw && !inBespoke) return
    if (inBespoke) {
      await dashboardStore.change_uw_acc() // bespoke -> uw
    } else if (inAcc) {
      await dashboardStore.change_uw_acc() // acc -> uw
    }
    return
  }

  if (target === 'bespoke') {
    if (!isYear) return
    if (inBespoke) return
    if (inAcc) {
      await dashboardStore.change_uw_acc() // acc -> uw
      await dashboardStore.change_uw_acc() // uw -> bespoke
    } else if (inUw) {
      await dashboardStore.change_uw_acc() // uw -> bespoke
    }
  }
}

const generateWizardDataFromCurrentState = async (prePopSettings: any) => {
  const { useDashboardStore } = await import('@/store/dashboard')
  const dashboardStore = useDashboardStore()
  
  return {
    wizardType: prePopSettings.wizardType,
    dashboardConfig: {
      mqy: dashboardStore.dashboards.mqy,
      period: dashboardStore.dashboards.uw_acc,
      bespoke: dashboardStore.isBindedYears,
      premium: dashboardStore.dashboards.gwpnwp,
      basis: dashboardStore.underwriting_loss_ratios,
      ccr_nlr: dashboardStore.dashboards.ccr_nlr,
      seasonality: dashboardStore.dashboards.seasonFactor,
      display: dashboardStore.dashboards.ratio_amount
    },
    dashboardFilters: {
      accidentUnderwriting: dashboardStore.dashboards.uw_acc,
      selectedFilters: dashboardStore.selectedFilters
    },
    columnConfig: {
      showColumn: dashboardStore.showColumn,
      margin: dashboardStore.margin,
      showColumnTotal: dashboardStore.showColumnTotal,
      totalMargin: dashboardStore.totalMargin
    },
    elementFlags: {
      attritionalOnly: false,
      largeOnly: false,
      weatherOnly: false,
      totalUltimateOnly: false,
      lossRatiosOnly: false,
      attritionalLargeExpanded: false,
      largeLossLoad: false
    },
    chartConfig: prePopSettings.wizardType === 'performance-chart' ? {
      isGLR: dashboardStore.graphConfig.isGLR,
      isNormalised: dashboardStore.graphConfig.isNormalised,
      showGwpBars: dashboardStore.graphConfig.showGwpBars,
      showGepBars: dashboardStore.graphConfig.showGepBars,
      showSeasonalityApriori: dashboardStore.graphConfig.showSeasonalityApriori
    } : null
  }
}

const exportTemplateWithRealData = async () => {
  try {
    let portfolioName = 'Unknown Portfolio'
    let bounceName = 'Unknown Bounce'
    
    for (const slide of slides.value) {
      for (const element of slide.elements) {
        if ((element.type === 'dashboard-table' || element.type === 'performance-chart' || element.type === 'epi-chart') && element.portfolioName && element.bounceName) {
          portfolioName = element.portfolioName
          bounceName = element.bounceName
          break
        }
      }
      if (portfolioName !== 'Unknown Portfolio') break
    }
    
    const useExport = await import('@/hooks/useExport')
    const { reportService } = await import('@/services/reportService')
    
    mountAllTablesForExport.value = true
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 300))

    const pptBlob = await exportTemplateAsBlob(slides.value)
    
    const reportName = `${templateName.value} - ${portfolioName} - ${bounceName}`
    
    const imageData = await captureSlideImages(slides.value)
    const slideImages = imageData.slideImages
    const chartImages = imageData.chartImages

    const slidesToSave = JSON.parse(JSON.stringify(slides.value))
    
    
    const reportId = await reportService.saveReport({
      name: reportName,
      templateId: template.value?.id || templateId || '',
      templateName: templateName.value,
      portfolioId: selectedPortfolio.value?.id || '',
      portfolioName: selectedPortfolio.value?.name || '',
      bounceId: selectedBounce.value?.id || '',
      bounceName: selectedBounce.value?.displayName || selectedBounce.value?.name || '',
      pptData: pptBlob,
      slideImages: slideImages,
      chartImages: chartImages,
      slides: slidesToSave
    })
    
    restoreMockTables()
    
    showSuccessModal(`Report "${reportName}" has been saved successfully!`)
    
  } catch (error) {
    console.error('❌ Error exporting template:', error)
    restoreMockTables()
    showErrorModal('Failed to export template. Please try again.')
  } finally {
    mountAllTablesForExport.value = false
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

const captureSlideImages = async (slides: any[]): Promise<{ slideImages: string[], chartImages: Record<string, string> }> => {
  try {
    const slideImages: string[] = []
    const chartImages: Record<string, string> = {}
    
    mountAllTablesForExport.value = true
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      const hiddenContainer = document.querySelector('[style*="left: -10000px"]')
      if (!hiddenContainer) {
        console.error('Hidden container not found')
        return {
          slideImages: slides.map((_, index) => createPlaceholderSlideImage(index + 1)),
          chartImages: {}
        }
      }
      
      const originalStyle = hiddenContainer.getAttribute('style')
      hiddenContainer.setAttribute('style', 'position: absolute; left: 0px; top: 0px; width: 1000px; height: 562.5px; overflow: visible;')
      
      try {
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i]
          
          try {
            const slideElement = hiddenContainer.querySelector(`[data-slide-id="${slide.id}"]`) as HTMLElement
            if (!slideElement) {
              console.error(`Slide element not found for slide ${i + 1}`)
              slideImages.push(createPlaceholderSlideImage(i + 1))
              continue
            }
            
            await new Promise(resolve => setTimeout(resolve, 200))
            
            const htmlToImage = await import('html-to-image')
            const dataUrl = await htmlToImage.toSvg(slideElement, {
              quality: 1.0,
              backgroundColor: '#ffffff',
              width: 1000,
              height: 562.5,
              pixelRatio: 2,
              skipFonts: false
            })
            
            slideImages.push(dataUrl)
            
            const chartElements = slide.elements?.filter((element: any) => element.type === 'performance-chart') || []
            for (const element of chartElements) {
              try {
                const chartElement = slideElement.querySelector(`[data-element-id="${element.id}"] #chartdiv`) as HTMLElement
                if (chartElement) {
                  const chartDataUrl = await htmlToImage.toSvg(chartElement, {
                    quality: 1.0,
                    backgroundColor: '#ffffff',
                    pixelRatio: 2,
                    skipFonts: false
                  })
                  chartImages[element.id] = chartDataUrl
                }
              } catch (error) {
                console.error(`Error capturing chart for element ${element.id}:`, error)
              }
            }
            
          } catch (error) {
            console.error(`Error capturing slide ${i + 1}:`, error)
            slideImages.push(createPlaceholderSlideImage(i + 1))
          }
        }
      } finally {
        hiddenContainer.setAttribute('style', originalStyle || '')
      }
      
      return { slideImages, chartImages }
      
    } finally {
      mountAllTablesForExport.value = false
    }
    
  } catch (error) {
    console.error('Error capturing slide images:', error)
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
      wizardType: wizardInstance.wizardType,
      prePopulatedSettings: wizardInstance.prePopulatedSettings  
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
    
    currentWizard.wizardData = JSON.parse(JSON.stringify(wizardData))
    
    
    globalStore.setLoading(true)
    
    try {
      await replaceMockTableWithRealData(currentWizard.wizardInstance.mockTable, currentWizard.wizardData, currentWizard)
      currentWizard.resolve(currentWizard.wizardData)
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
    
    if (element.attritionalOnly) {
      element.attritionalOnly = true
    }
    if (element.largeOnly) {
      element.largeOnly = true
    }
    if (element.weatherOnly) {
      element.weatherOnly = true
    }
    if (element.totalUltimateOnly) {
      element.totalUltimateOnly = true
    }
    if (element.lossRatiosOnly) {
      element.lossRatiosOnly = true
    }
    if (element.attritionalLargeExpanded) {
      element.attritionalLargeExpanded = true
    }
    
    const svgImage = slide.elements.find(e => e.type === 'image' && e.src?.includes('MockTable.svg'))
    if (svgImage) {
      svgImage._originalVisibility = svgImage.visible !== false
      svgImage.visible = false
    }
    
    const chartSvgImage = slide.elements.find(e => e.type === 'image' && e.src?.includes('mock-chart-performance.svg'))
    if (chartSvgImage) {
      chartSvgImage._originalVisibility = chartSvgImage.visible !== false
      chartSvgImage.visible = false
    }
    
    element._originalInvisible = element.isInvisible
    element.isInvisible = false
    
    await loadPortfolioDataForElement(element, currentWizard.wizardInstance.portfolio, currentWizard.wizardInstance.bounce)
    
    try {
      const { useDashboardStore } = await import('@/store/dashboard')
      const dashboardStore = useDashboardStore()
      const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj))
        element._snapshot = {
          dashboards: deepCopy(dashboardStore.dashboards),
          dashboard_data: deepCopy(dashboardStore.dashboard_data),
          dashboard_data_column: deepCopy(dashboardStore.dashboard_data_column),
          seasonality_parameters: deepCopy(dashboardStore.seasonality_parameters),
          totalData: deepCopy(dashboardStore.totalData),
          quarterly_dashboard_data: deepCopy(dashboardStore.quarterly_dashboard_data),
          binder_dashboard_data: deepCopy(dashboardStore.binder_dashboard_data),
          yearly_dashboard_data: deepCopy(dashboardStore.yearly_dashboard_data),
          chart_data: deepCopy(dashboardStore.chart_data),
          offMarginGWPGEP: dashboardStore.offMarginGWPGEP,
          isQuarterSubTotal: dashboardStore.isQuarterSubTotal,
          isQuarterSubTotalUp: dashboardStore.isQuarterSubTotalUp,
          isBinderSubTotal: dashboardStore.isBinderSubTotal,
          isBinderSubTotalUp: dashboardStore.isBinderSubTotalUp,
          isYearSubTotal: dashboardStore.isYearSubTotal,
          isYearSubTotalUp: dashboardStore.isYearSubTotalUp,
          showColumn: deepCopy(dashboardStore.showColumn),
          margin: deepCopy(dashboardStore.margin),
          showColumnTotal: dashboardStore.showColumnTotal,
          totalMargin: dashboardStore.totalMargin,
          isShowingExposure: dashboardStore.isShowingExposure,
          underwriting_loss_ratios: dashboardStore.underwriting_loss_ratios,
          visibleColumns: deepCopy(dashboardStore.visibleColumns),
          gwpnwp: dashboardStore.dashboards.gwpnwp,
          ccr_nlr: dashboardStore.dashboards.ccr_nlr,
          seasonFactor: dashboardStore.dashboards.seasonFactor,
          ratio_amount: dashboardStore.dashboards.ratio_amount,
          uw_acc: dashboardStore.dashboards.uw_acc,
          mqy: dashboardStore.dashboards.mqy,
          isBindedYears: dashboardStore.isBindedYears,
          data_CommissionColumns: deepCopy(dashboardStore.data_CommissionColumns)
        }
      
    } catch (e) {
      console.error('Failed to create element snapshot:', e)
    }

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
          
          const chartSvgImage = slide.elements.find(e => e.type === 'image' && e.src?.includes('mock-chart-performance.svg'))
          if (chartSvgImage && chartSvgImage._originalVisibility !== undefined) {
            chartSvgImage.visible = chartSvgImage._originalVisibility
            delete chartSvgImage._originalVisibility
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
    
    await dashboardStore.loadDashboard(completeData)
    
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
    
    if (element._snapshot) {
      const snapshot = element._snapshot
      if (snapshot.seasonFactor !== undefined) {
        dashboardStore.dashboards.seasonFactor = snapshot.seasonFactor
      }
      if (snapshot.ccr_nlr) {
        dashboardStore.dashboards.ccr_nlr = snapshot.ccr_nlr
      }
      if (snapshot.uw_acc) {
        dashboardStore.dashboards.uw_acc = snapshot.uw_acc
      }
      if (snapshot.mqy) {
        dashboardStore.dashboards.mqy = snapshot.mqy
      }
      if (snapshot.gwpnwp) {
        dashboardStore.dashboards.gwpnwp = snapshot.gwpnwp
      }
      if (snapshot.ratio_amount) {
        dashboardStore.dashboards.ratio_amount = snapshot.ratio_amount
      }
    }
    
    await dashboardStore.loadDashboard(completeData)
    
    if (element.type === 'performance-chart') {
      dashboardStore.setChartData()
    }
    
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
  'dashboard-table': DashboardTableElement,
  'performance-chart': PerformanceChartElement
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
  
  if (element.type === 'image' && element.src?.includes('mock-chart-performance.svg')) {
    const slide = slides.value[currentSlideIndex.value]
    if (slide) {
      const performanceChart = slide.elements.find(e => 
        e.type === 'performance-chart' && 
        !e.isTemplatePlaceholder && 
        e.portfolioId
      )
      return !!performanceChart
    }
  }
  
  return false
}

onMounted(async () => {
  await loadTemplate()
  
  const sourceReportJson = sessionStorage.getItem('sourceReportForNewBounce')
  if (sourceReportJson) {
    try {
      sourceReportData.value = JSON.parse(sourceReportJson)
      newBounceMode.value = true
      
      if (sourceReportData.value.wizardSettings) {
        prePopulatedWizardSettings.value = sourceReportData.value.wizardSettings
      }
      
      sessionStorage.removeItem('sourceReportForNewBounce')
      
      setTimeout(async () => {
        await addPortfolioData()
      }, 300)
      
    } catch (error) {
      console.error('Error parsing source report data:', error)
      sessionStorage.removeItem('sourceReportForNewBounce')
    }
  }
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