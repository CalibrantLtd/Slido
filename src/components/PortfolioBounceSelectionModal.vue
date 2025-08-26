<template>
  <div v-if="isVisible" class="modal-overlay" @click="onClose">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Add Portfolio Data</h2>
        <button class="close-btn" @click="onClose">×</button>
      </div>
      
      <div class="modal-content">
        <!-- Portfolio Selection -->
        <div class="selection-section compact">
          <h3 class="section-title compact">Select Portfolio</h3>
          <div class="portfolio-dropdown-container">
            <div 
              class="custom-dropdown compact"
              :class="{ 'open': isDropdownOpen }"
              @click="toggleDropdown"
            >
              <div class="dropdown-selected compact" ref="dropdownRef">
                {{ selectedPortfolio?.name || 'Choose a portfolio...' }}
                <span class="dropdown-arrow">▼</span>
              </div>
            </div>
            <div v-if="isDropdownOpen" class="dropdown-options compact">
              <div
                v-for="portfolio in sortedPortfolios"
              :key="portfolio.id"
                class="dropdown-option compact"
                :class="{ 'selected': selectedPortfolio?.id === portfolio.id }"
                @click.stop="selectPortfolio(portfolio)"
              >
                {{ portfolio.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Bounce Selection -->
        <div v-if="selectedPortfolio" class="selection-section compact" ref="bouncesSection">
          <h3 class="section-title compact">Select Bounce</h3>
          <div class="bounce-layout compact">
            <div class="bounce-tree-container compact" style="width: 280px; height: 100%; overflow-y: auto;">
            <div v-if="!groupedBounceData || Object.keys(groupedBounceData).length === 0" class="no-bounces">
              No bounces available
            </div>
            <el-menu
              v-else
              :key="menuID"
              :default-active="defaultActive || null"
              class="bounce-menu"
              @select="onSelectOnMenu"
            >
              <el-sub-menu
                v-for="(year, yearIdx) in Object.keys(groupedBounceData).sort((a,b)=>Number(a)-Number(b))"
                :key="yearIdx"
                :index="yearIdx.toString()"
              >
                <template #title>
                  <el-icon>
                    <Folder />
                  </el-icon>
                  <span>{{ year }}</span>
                </template>
                <el-sub-menu
                  v-for="(month, monthIdx) in Object.keys(groupedBounceData[year]).sort((a,b)=>Number(a)-Number(b))"
                  :key="yearIdx.toString() + '.' + monthIdx.toString()"
                  :index="yearIdx.toString() + '.' + monthIdx.toString()"
                >
                  <template #title>
                    <el-icon>
                      <Folder />
                    </el-icon>
                    <span>{{ getMonthName(month) + '-' + year }}</span>
                  </template>
                  <el-menu-item
                    v-for="(bounce, bounceIdx) in groupedBounceData[year][month]"
                    :key="bounceIdx"
                    :index="yearIdx.toString() + '.' + monthIdx.toString() + '.' + bounceIdx.toString() + '.' + 'ACTUAL'"
                  >
                    <template #title>
                      <el-icon>
                        <Document />
                      </el-icon>
                      <div class="w-full">
                        <el-tooltip
                          class="box-item"
                          :show-after="500"
                          effect="dark"
                          :content="'Date: ' + formatDate((bounce as any).date)"
                        >
                          <p class="break-all">{{ ((bounce as any).user ? (bounce as any).user + '-' : '') + (((bounce as any).displayName) || (bounce as any).name) }}</p>
                        </el-tooltip>
              </div>
                    </template>
                  </el-menu-item>
                </el-sub-menu>
              </el-sub-menu>
            </el-menu>
              </div>
            <div class="bounce-chart compact" style="height: 100%;">
              <BounceChart
                v-if="elements && elements.length"
                :data="elements"
                :selected-node="selectedNode"
                :chart-key="chartKey"
                @onClickTree="onGraphNodeClick"
              />
              <div v-else class="bounce-graph-empty">No timeline available</div>
            </div>
          </div>
        </div>

        <!-- Footer buttons inside content area -->
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import 'element-plus/dist/index.css'
import { portfolioService, type Portfolio, type Bounce } from '@/services/portfolioService'
import BounceChart from '@/components/BounceChart.vue'
import { Folder, Document } from '@element-plus/icons-vue'
import { ElMenu, ElSubMenu, ElMenuItem, ElIcon, ElTooltip } from 'element-plus'

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
const selectedPortfolioId = ref<string>('')
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const draftList = ref<{ [portfolioId: string]: Bounce[] }>({})
const bouncesSection = ref<HTMLElement | null>(null)
const bounceGraph = ref<Bounce[]>([])
// Vue Flow chart dependencies
const elements = ref<any[]>([])
const selectedNode = ref<number>(0)
const chartKey = ref<number>(0)
const treeSelected = ref<string>('')
const selectedDraftList = ref<Record<string, any>>({})
const groupedBounceData = ref<{ [year: string]: { [month: string]: Bounce[] } }>({})
const menuID = ref(0)
const defaultActive = ref()

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
  selectedPortfolioId.value = ''
  isDropdownOpen.value = false
  groupedBounceData.value = {}
  menuID.value = 0
  defaultActive.value = null
  emit('close')
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) {
    nextTick(() => {
      positionDropdown()
    })
  }
}

const positionDropdown = () => {
  if (dropdownRef.value) {
    const rect = dropdownRef.value.getBoundingClientRect()
    const dropdownOptions = document.querySelector('.dropdown-options') as HTMLElement
    if (dropdownOptions) {
      dropdownOptions.style.top = `${rect.bottom + window.scrollY}px`
      dropdownOptions.style.left = `${rect.left + window.scrollX}px`
      dropdownOptions.style.width = `${rect.width}px`
    }
  }
}

const sortedPortfolios = computed(() => {
  return [...portfolios.value].sort((a, b) => a.name.localeCompare(b.name))
})

const onPortfolioChange = async () => {
  if (!selectedPortfolioId.value) {
    selectedPortfolio.value = null
    selectedBounce.value = null
    bounces.value = []
    return
  }
  
  const portfolio = portfolios.value.find(p => p.id === selectedPortfolioId.value)
  if (portfolio) {
    await selectPortfolio(portfolio)
  }
}

const selectPortfolio = async (portfolio: Portfolio) => {
  selectedPortfolio.value = portfolio
  selectedPortfolioId.value = portfolio.id
  selectedBounce.value = null
  isDropdownOpen.value = false
  
  try {
    isLoading.value = true
    const portfolioBounces = await portfolioService.getBouncesForPortfolio(portfolio.id, portfolios.value)
    bounces.value = portfolioBounces
    groupBouncesByDate(portfolioBounces)
    bounceGraph.value = [...portfolioBounces].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const nodes: any[] = []
    const edges: any[] = []
    let id = 0
    const linked: Record<string, number> = {}
    for (const b of bounceGraph.value) {
      const yyyymm = b.date ? b.date.replace(/-/g, '').slice(0, 6) : ''
      const ts: string = (b as any).timestamp || (b as any).time_stamp || (b as any).timeStamp || (b as any).created_at || (b as any).createdAt || (b as any).date || ''
      const usr: string = (b as any).user || b.user || ''
      const label: string = (b as any).displayName || (b as any).name || ''
      nodes.push({ id: id.toString(), type: 'custom', position: { x: 0, y: 0 }, data: { name: `${yyyymm}-${ts}-${usr}-${label}` } })
      linked[b.id] = id
      id += 1
    }
    for (let i = 1; i < nodes.length; i++) {
      edges.push({ id: `e${i-1}-${i}`, source: (i-1).toString(), target: i.toString(), type: 'step' })
    }
    elements.value = [...nodes, ...edges]
    selectedNode.value = 0
    treeSelected.value = ''
    selectedDraftList.value = {}
    chartKey.value += 1
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

const onGraphNodeClick = (nodeId: string) => {
  const idx = Number(nodeId)
  const b = bounceGraph.value[idx]
  if (!b) return
  selectedNode.value = idx
  selectBounce(b as any)
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
    selectedPortfolioId.value = ''
    isDropdownOpen.value = false
  }
})

const handleClickOutside = (event: Event) => {
  if (isDropdownOpen.value && !dropdownRef.value?.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function parseYearMonthFromString(input: string): { year: string; monthIndex: number } {
  if (!input) return { year: 'Unknown', monthIndex: 0 }
  let m = input.match(/^(\d{4})(\d{2})/)
  if (m) return { year: m[1], monthIndex: Math.max(0, Math.min(11, parseInt(m[2]) - 1)) }
  // YYYY-MM or YYYY-MM-DD
  m = input.match(/^(\d{4})-(\d{2})/)
  if (m) return { year: m[1], monthIndex: Math.max(0, Math.min(11, parseInt(m[2]) - 1)) }
  // Fallback search
  m = input.match(/(\d{4})(\d{2})/)
  if (m) return { year: m[1], monthIndex: Math.max(0, Math.min(11, parseInt(m[2]) - 1)) }
  const d = new Date(input)
  if (!isNaN(d.getTime())) return { year: d.getFullYear().toString(), monthIndex: d.getMonth() }
  return { year: 'Unknown', monthIndex: 0 }
}

const groupBouncesByDate = (bounces: Bounce[]) => {
  const grouped: { [year: string]: { [monthIndex: number]: Bounce[] } } = {}
  bounces.forEach((bounce: any) => {
    const src = (bounce.date as string) || (bounce.name as string) || ''
    const { year, monthIndex } = parseYearMonthFromString(src)
    if (!grouped[year]) grouped[year] = {}
    if (!grouped[year][monthIndex]) grouped[year][monthIndex] = []
    grouped[year][monthIndex].push(bounce)
  })
  Object.keys(grouped).forEach(year => {
    Object.keys(grouped[year]).forEach((mStr: any) => {
      const m = Number(mStr)
      grouped[year][m].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })
  })
  groupedBounceData.value = grouped
  const yearsAsc = Object.keys(grouped).sort((a,b)=>Number(a)-Number(b))
  const yearsDesc = [...yearsAsc].reverse()
  if (yearsDesc.length > 0) {
    const yearIdx = yearsAsc.indexOf(yearsDesc[0])
    defaultActive.value = yearIdx.toString()
  }
  menuID.value += 1
}

const getMonthName = (monthIndex: string | number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const idx = typeof monthIndex === 'string' ? parseInt(monthIndex) : monthIndex
  return months[idx] || 'Unknown'
}

const onSelectOnMenu = (index: string) => {
  const arr = index.split('.')
  if (arr.length >= 4 && arr[3] === 'ACTUAL') {
    const yearIdx = parseInt(arr[0])
    const monthIdx = parseInt(arr[1])
    const bounceIdx = parseInt(arr[2])
  const years = Object.keys(groupedBounceData.value).sort((a,b)=>Number(a)-Number(b))
    const year = years[yearIdx]
  const months = Object.keys(groupedBounceData.value[year]).sort((a,b)=>Number(a)-Number(b))
    const month = months[monthIdx]
    const bounce = groupedBounceData.value[year][month][bounceIdx]
    if (bounce) {
      selectBounce(bounce)
      // Update selection in graph
      const idx = bounceGraph.value.findIndex(b => b.id === bounce.id)
      if (idx >= 0) {
        selectedNode.value = idx
        chartKey.value += 1
      }
    }
  }
}
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
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 0;
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  overflow: visible;
  box-shadow: none;
  margin-top: 0;
}

.modal-header {
  padding: 6px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 16px;
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
  padding: 8px 20px 0 20px;
  height: calc(100vh - 120px);
  overflow-y: auto;
  overflow-x: visible;
  display: flex;
  flex-direction: column;
}

.selection-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.selection-section.compact {
  gap: 8px;
  margin-bottom: 12px;
}

.bounce-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.bounce-layout.compact {
  gap: 12px;
  min-height: 270px;
}

.bounce-chart {
  flex: 1;
  min-height: 420px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  position: relative;
  padding: 0;
  overflow: hidden;
}

.bounce-chart.compact {
  min-height: 270px;
}

.bounce-graph {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.graph-node {
  width: 300px;
  background: #8ea1bf;
  color: #fff;
  border-radius: 6px;
  padding: 18px 16px 14px 16px;
  box-shadow: 0 6px 10px rgba(0,0,0,0.18);
  cursor: pointer;
}

.graph-node.selected {
  outline: 3px solid #55B691;
}

.graph-node-header {
  font-size: 12px;
  opacity: 0.9;
}

.graph-node-value {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.graph-node-info {
  position: absolute;
  right: 16px;
  top: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  color: #7aa596;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.graph-node-body {
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 6px;
  column-gap: 12px;
}

.kv .k {
  opacity: 0.9;
  font-size: 12px;
}
.kv .v {
  font-size: 14px;
  font-weight: 600;
}

.graph-node-ellipsis {
  position: absolute;
  right: 16px;
  bottom: 10px;
  letter-spacing: 2px;
}

.graph-connector {
  width: 2px;
  height: 32px;
  background: #cbd5e1;
}

.bounce-graph-empty {
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.section-title.compact {
  font-size: 14px;
}

.portfolio-dropdown-container {
  width: 100%;
  position: relative;
  z-index: 2000;
}

.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-selected {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-selected.compact {
  padding: 8px 12px;
  font-size: 13px;
}

.dropdown-selected:hover {
  border-color: #55B691;
  box-shadow: 0 2px 8px rgba(85, 182, 145, 0.1);
}

.dropdown-arrow {
  font-size: 12px;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.custom-dropdown.open .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-options {
  position: fixed;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  max-height: 220px;
  overflow-y: auto;
  z-index: 3000;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  min-width: 300px;
}

.dropdown-options.compact {
  max-height: 160px;
  min-width: 250px;
}

.dropdown-option {
  padding: 12px 16px;
  font-size: 14px;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-option.compact {
  padding: 8px 12px;
  font-size: 13px;
}

.dropdown-option:last-child {
  border-bottom: none;
}

.dropdown-option:hover {
  background: #f8fafc;
  color: #55B691;
}

.dropdown-option.selected {
  background: #EEF4F8;
  color: #55B691;
  font-weight: 600;
}

.bounce-tree-container {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.bounce-tree-container.compact {
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.bounce-menu {
  overflow: auto;
  height: 100%;
  width: 100%;
}

.no-bounces {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.bounce-header {
  margin-bottom: 4px;
}

.bounce-name {
  font-size: 14px;
  font-weight: 500;
  color: inherit;
}

.bounce-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.modal-footer {
  padding: 8px 0 12px 0;
  border-top: none;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  margin-top: 2px;
  background: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.cancel-btn,
.confirm-btn {
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 12px;
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
.bounce-tree::-webkit-scrollbar,
.dropdown-options::-webkit-scrollbar {
  width: 24px;
}

.modal-content::-webkit-scrollbar-track,
.bounce-tree::-webkit-scrollbar-track,
.dropdown-options::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 12px;
  margin: 12px 0;
  border: 2px solid transparent;
  background-clip: content-box;
}

.modal-content::-webkit-scrollbar-thumb,
.bounce-tree::-webkit-scrollbar-thumb,
.dropdown-options::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 12px;
  border: 4px solid #f1f5f9;
  min-height: 50px;
  background-clip: content-box;
}

.modal-content::-webkit-scrollbar-thumb:hover,
.bounce-tree::-webkit-scrollbar-thumb:hover,
.dropdown-options::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
  border: 4px solid #f1f5f9;
}

.modal-content::-webkit-scrollbar-thumb:active,
.bounce-tree::-webkit-scrollbar-thumb:active,
.dropdown-options::-webkit-scrollbar-thumb:active {
  background: #64748b;
  border: 4px solid #f1f5f9;
}

.modal-content::-webkit-scrollbar-corner,
.bounce-tree::-webkit-scrollbar-corner,
.dropdown-options::-webkit-scrollbar-corner {
  background: #f1f5f9;
}

/* Firefox scrollbar styling */
.modal-content,
.bounce-tree,
.dropdown-options {
  scrollbar-width: auto;
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
