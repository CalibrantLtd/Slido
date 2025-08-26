<template>
  <div v-if="isVisible" class="modal-overlay" @click="onClose">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Add Portfolio Data</h2>
        <button class="close-btn" @click="onClose">×</button>
      </div>
      
      <div class="modal-content">
        <!-- Portfolio Selection -->
        <div class="selection-section">
          <h3 class="section-title">Select Portfolio</h3>
          <div class="portfolio-grid">
            <div
              v-for="portfolio in portfolios"
              :key="portfolio.id"
              class="portfolio-card"
              :class="{ 
                'selected': selectedPortfolio?.id === portfolio.id
              }"
              @click="selectPortfolio(portfolio)"
            >
              <div class="portfolio-name">{{ portfolio.name }}</div>
            </div>
          </div>
        </div>

        <!-- Bounce Selection -->
        <div v-if="selectedPortfolio" class="selection-section" ref="bouncesSection">
          <h3 class="section-title">Select Bounce</h3>
          <div class="bounce-tree">
            <div
              v-for="bounce in bounces"
              :key="bounce.id"
              class="bounce-item"
              :class="{ 'selected': selectedBounce?.id === bounce.id }"
              @click="selectBounce(bounce)"
            >
              <div class="bounce-header">
                <span class="bounce-name">{{ bounce.displayName || bounce.name }}</span>
              </div>
              <div class="bounce-details">
                <span class="bounce-date">{{ formatDate(bounce.date) }}</span>
                <span class="bounce-user">User: {{ bounce.user }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="onClose">Cancel</button>
        <button
          class="confirm-btn"
          :disabled="!selectedPortfolio || !selectedBounce"
          :class="{ 'loading': isLoading }"
          @click="onConfirm"
        >
          {{ isLoading ? 'Adding...' : 'Add Portfolio Data' }}
        </button>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="errorModal.visible" class="error-modal-overlay" @click="closeErrorModal">
      <div class="error-modal-content" @click.stop>
        <div class="error-modal-header">
          <h3>Error</h3>
        </div>
        <div class="error-modal-body">
          <p>{{ errorModal.message }}</p>
        </div>
        <div class="error-modal-footer">
          <button @click="closeErrorModal" class="error-btn primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { portfolioService, type Portfolio, type Bounce } from '@/services/portfolioService'

const props = defineProps<{
  visible: boolean
  portfoliosData?: any
  context?: 'template' | 'editor' 
}>()

const emit = defineEmits<{
  close: []
  confirm: [portfolio: Portfolio, bounce: Bounce]
  'request-template-data': [callback: (data: any) => void]
  'show-wizard': [wizardInstance: any, resolve: (value: any) => void, reject: (error: any) => void]
}>()

const isLoading = ref(false)
const portfolios = ref<Portfolio[]>([])
const bounces = ref<Bounce[]>([])
const selectedPortfolio = ref<Portfolio | null>(null)
const selectedBounce = ref<Bounce | null>(null)
const draftList = ref<{ [portfolioId: string]: Bounce[] }>({})
const bouncesSection = ref<HTMLElement | null>(null)

const errorModal = ref({
  visible: false,
  message: ''
})

const isVisible = computed({
  get: () => props.visible,
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

const onClose = () => {
  selectedPortfolio.value = null
  selectedBounce.value = null
  emit('close')
}

const selectPortfolio = async (portfolio: Portfolio) => {
  selectedPortfolio.value = portfolio
  selectedBounce.value = null
  
  try {
    isLoading.value = true
    const portfolioBounces = await portfolioService.getBouncesForPortfolio(portfolio.id, portfolios.value)
    bounces.value = portfolioBounces
    
    // Scroll to bounces section after data is loaded
    await nextTick()
    if (bouncesSection.value) {
      bouncesSection.value.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }
  } catch (error) {
    bounces.value = []
  } finally {
    isLoading.value = false
  }
}

const selectBounce = (bounce: Bounce) => {
  selectedBounce.value = bounce
}

const showErrorModal = (message: string) => {
  errorModal.value.message = message
  errorModal.value.visible = true
}

const closeErrorModal = () => {
  errorModal.value.visible = false
}

const onConfirm = async () => {
  if (!selectedPortfolio.value || !selectedBounce.value) {
    return
  }

  isLoading.value = true
  try {
    if (props.context === 'editor') {
      emit('confirm', selectedPortfolio.value, selectedBounce.value)
      onClose()
    } else {
      // For template context, scan for dashboard tables
      const dashboardTables = await scanTemplateForDashboardTables()
      
      if (dashboardTables.length > 0) {
        // Show wizard for each dashboard table
        await showDashboardWizard(dashboardTables, selectedPortfolio.value, selectedBounce.value)
      }
      
      emit('confirm', selectedPortfolio.value, selectedBounce.value)
      onClose()
    }
  } catch (error) {
    console.error('❌ Error in onConfirm:', error)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return portfolioService.formatDate(dateString)
}

const scanTemplateForDashboardTables = async () => {
  try {
    // Get current template data from parent component
    const templateData: any = await getCurrentTemplateData()
    const dashboardTables: any[] = []
    
    // Scan through all slides and elements
    if (templateData && templateData.slides && Array.isArray(templateData.slides)) {
      templateData.slides.forEach((slide: any, slideIndex: number) => {
        if (slide.elements) {
          slide.elements.forEach((element: any, elementIndex: number) => {
            if (element.type === 'dashboard-table') {
              // Check if it's a template placeholder
              if (element.isTemplatePlaceholder || !element.selectedFilters) {
                dashboardTables.push({
                  slideId: slide.id,
                  elementId: element.id,
                  element: element
                })
              }
            }
          })
        }
      })
    }
    return dashboardTables
  } catch (error) {
    console.error('Error scanning template for dashboard tables:', error)
    return []
  }
}

// Show dashboard wizard for each table
const showDashboardWizard = async (dashboardTables: any[], portfolio: Portfolio, bounce: Bounce) => {
  try {
    // Import the wizard component dynamically
    const { default: SybilWizard } = await import('@/views/Editor/CanvasToolTop/SybilWizard.vue')
    
    for (const table of dashboardTables) {
      // Create wizard instance
      const wizardInstance = createWizardInstance(SybilWizard, {
        portfolio,
        bounce,
        tableElement: table
      }, table)
      
      // Show wizard and wait for completion
      await showWizardModal(wizardInstance)
    }
  } catch (error) {
    console.error('Error showing dashboard wizard:', error)
    throw error
  }
}

const getCurrentTemplateData = async () => {
  // This should get the current template data from the parent component
  return new Promise((resolve) => {
    emit('request-template-data', resolve)
  })
}

const createWizardInstance = (WizardComponent: any, props: any, mockTable: any) => {  
  // This would create a Vue component instance
  const instance = {
    component: WizardComponent,
    props,
    portfolio: props.portfolio,
    bounce: props.bounce,
    mockTable: mockTable,
    wizardType: 'dashboard-table'
  }
  
  return instance
}

const showWizardModal = async (wizardInstance: any) => {
  return new Promise((resolve, reject) => {
    const wizardWithData = {
      ...wizardInstance,
      portfolio: wizardInstance.props?.portfolio || wizardInstance.portfolio,
      bounce: wizardInstance.props?.bounce || wizardInstance.bounce,
      mockTable: wizardInstance.mockTable,
      wizardType: wizardInstance.wizardType
    }
    
    emit('show-wizard', wizardWithData, resolve, reject)
  })
}

const fetchPortfolios = async () => {
  try {
    isLoading.value = true
    const response = await portfolioService.fetchPortfolios()
    portfolios.value = response.portfolios
    draftList.value = response.draft_list
  } catch (error) {
    showErrorModal('Failed to fetch portfolios. Please check your connection.')
  } finally {
    isLoading.value = false
  }
}

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    if (props.portfoliosData) {
      // Use pre-loaded data
      portfolios.value = props.portfoliosData.portfolios
      draftList.value = props.portfoliosData.draft_list
    } else {
      // Fetch data if not provided
      fetchPortfolios()
    }
    selectedPortfolio.value = null
    selectedBounce.value = null
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0vh;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 85%;
  max-width: 650px;
  max-height: 75vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  margin-top: -50px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.selection-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.portfolio-card {
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.portfolio-card:hover {
  border-color: #55B691;
  box-shadow: 0 2px 8px rgba(85, 182, 145, 0.1);
}

.portfolio-card.selected {
  border-color: #55B691;
  background: #EEF4F8;
}

.portfolio-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.bounce-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.bounce-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.bounce-item:hover {
  border-color: #55B691;
  box-shadow: 0 1px 4px rgba(85, 182, 145, 0.1);
}

.bounce-item.selected {
  border-color: #55B691;
  background: #EEF4F8;
}

.bounce-header {
  margin-bottom: 6px;
}

.bounce-name {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
}

.bounce-details {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #6b7280;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
}

.cancel-btn:hover {
  background: #d1d5db;
}

.confirm-btn {
  background: rgb(187, 226, 211);
  color: #1f2937;
}

.confirm-btn:hover:not(:disabled) {
  background: rgb(167, 216, 191);
}

.confirm-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.confirm-btn.loading {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

/* Custom Scrollbar Styling */
.modal-content::-webkit-scrollbar,
.bounce-tree::-webkit-scrollbar {
  width: 12px;
}

.modal-content::-webkit-scrollbar-track,
.bounce-tree::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 6px;
}

.modal-content::-webkit-scrollbar-thumb,
.bounce-tree::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
  border: 2px solid #f1f5f9;
}

.modal-content::-webkit-scrollbar-thumb:hover,
.bounce-tree::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Firefox scrollbar styling */
.modal-content,
.bounce-tree {
  scrollbar-width: thick;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

/* Error Modal Styles */
.error-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
}

.error-modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.error-modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.error-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.error-modal-body {
  padding: 20px 24px;
}

.error-modal-body p {
  margin: 0;
  color: #374151;
  line-height: 1.5;
}

.error-modal-footer {
  padding: 16px 24px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
}

.error-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.error-btn.primary {
  background: #55B691;
  color: white;
  border-color: #55B691;
}

.error-btn.primary:hover {
  background: #4a9d7a;
  border-color: #4a9d7a;
}
</style>
