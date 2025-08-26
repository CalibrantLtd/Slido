<template>
    <div class="wizard">
      <!-- Header -->
      <div class="header">
        <h3>{{ wizardTitle }}</h3>
        <div class="steps">
          <div class="step" :class="{ active: step === 1 }" v-if="hasTimePeriod">1. Accident/Underwriting</div>
          <div class="step" :class="{ active: step === (hasTimePeriod ? 2 : 1) }">{{ hasTimePeriod ? '2' : '1' }}. Filters</div>
        </div>
      </div>
  
      <!-- Content -->
      <div class="content">
        <!-- Step 1:(for performance views only) -->
        <div v-if="step === 1 && hasTimePeriod" class="step-content">
          <div class="options">
            <div v-for="option in timePeriodTypes" :key="option.value" 
                 class="option" :class="{ selected: timePeriodType === option.value }"
                 @click="timePeriodType = option.value">
              <div class="radio">
                <div v-if="timePeriodType === option.value" class="dot"></div>
              </div>
              <span>{{ option.label }}</span>
            </div>
          </div>
          
          <div v-if="timePeriodType" class="mt-4">
            <h5>Select {{ timePeriodType === 'accident' ? 'Accident' : 'Underwriting' }} Period</h5>
            <div class="options">
              <div v-for="option in timePeriodOptions" :key="option.value" 
                   class="option" :class="{ selected: timePeriod === option.value }"
                   @click="timePeriod = option.value">
                <div class="radio">
                  <div v-if="timePeriod === option.value" class="dot"></div>
                </div>
                <span>{{ option.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Filters (or Step 1 for comparison views) -->
        <div v-if="step === (hasTimePeriod ? 2 : 1)" class="step-content">
          <h4>Configure Filters</h4>
          <div class="filters">
            <div v-for="section in currentFilters" :key="section.name" class="filter">
              <div class="filter-header" @click="section.expanded = !section.expanded">
                <span class="icon" :class="{ expanded: section.expanded }">▶</span>
                <span>{{ section.name }}</span>
              </div>
              <div v-if="section.expanded" class="filter-content">
                <div v-for="item in section.items" :key="item" class="item">
                  <input type="checkbox" :id="`${section.name}-${item}`" 
                         v-model="section.selected" :value="item">
                  <label :for="`${section.name}-${item}`">{{ item }}</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional treemap filters -->
          <div v-if="wizardType === 'comparison-treemap'" class="treemap-config">
            <!-- Box Size Indicator as filter -->
            <div class="filter">
              <div class="filter-header" @click="boxSizeExpanded = !boxSizeExpanded">
                <span class="icon" :class="{ expanded: boxSizeExpanded }">▶</span>
                <span>Box Size Indicator (GWP)</span>
              </div>
              <div v-if="boxSizeExpanded" class="filter-content">
                <div v-for="option in boxSizeOptions" :key="option.value" class="item">
                  <input type="checkbox" :id="`boxsize-${option.value}`" 
                         v-model="boxSizeSelected" :value="option.value">
                  <label :for="`boxsize-${option.value}`">{{ option.label }}</label>
                </div>
              </div>
            </div>

            <!-- Hierarchies -->
            <div class="config-section">
              <h5>Hierarchies (drag to reorder)</h5>
              <div class="hierarchies">
                <div 
                  v-for="(hierarchy, index) in hierarchies" 
                  :key="hierarchy"
                  class="hierarchy-item"
                  draggable="true"
                  @dragstart="dragStart(index)"
                  @dragover.prevent
                  @drop="dragDrop(index)"
                >
                  <span class="drag-handle">⋮⋮</span>
                  <input type="checkbox" :id="`hierarchy-${hierarchy}`" 
                         v-model="selectedHierarchies" :value="hierarchy"
                         class="hierarchy-checkbox">
                  <label :for="`hierarchy-${hierarchy}`">{{ hierarchy }}</label>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      <!-- Footer -->
      <div class="footer">
        <button v-if="step > 1" @click="step--" class="btn secondary">Previous</button>
        <button v-if="canProceed && step < maxSteps" @click="step++" class="btn primary">Next</button>
        <button v-if="step === maxSteps" @click="finish" class="btn primary">Finish</button>
        <button @click="emit('close')" class="btn cancel">Cancel</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue'
  
  const props = defineProps({
    wizardType: {
      type: String,
      required: true
    }
  })
  
  const emit = defineEmits(['close', 'finish'])
  
  const step = ref(1)
  const timePeriodType = ref('')
  const timePeriod = ref('')
  const boxSizeIndicator = ref('')
  const boxSizeExpanded = ref(false)
  const boxSizeSelected = ref([])
  const selectedHierarchies = ref([])
  const draggedIndex = ref(null)
  
  const timePeriodTypes = [
    { value: 'accident', label: 'Accident' },
    { value: 'underwriting', label: 'Underwriting' }
  ]
  
  const timePeriodOptions = computed(() => {
    if (!timePeriodType.value) return []
    const prefix = timePeriodType.value === 'accident' ? 'Accident' : 'Underwriting'
    return [
      { value: `${timePeriodType.value}-year`, label: `${prefix} Year` },
      { value: `${timePeriodType.value}-quarter`, label: `${prefix} Quarter` },
      { value: `${timePeriodType.value}-month`, label: `${prefix} Month` }
    ]
  })
  
  const boxSizeOptions = [
    { value: 'expected-next-12', label: 'Expected next 12 months' },
    { value: 'written-last-12', label: 'Written last 12 months' },
    { value: 'all-time-written', label: 'All time written' },
    { value: 'current-month-written', label: 'Current month written' },
    { value: 'expected-after-12', label: 'Expected after 12 months' }
  ]
  
  const hierarchies = ref(['Section', 'Trade', 'Industry'])
  
  const wizardTitle = computed(() => {
    const titles = {
      'performance-table': 'Performance View Table Setup',
      'performance-chart': 'Performance View Chart Setup',
      'comparison-table': 'Comparison View Table Setup',
      'comparison-chart': 'Comparison View Chart Setup',
      'comparison-treemap': 'Comparison View Treemap Setup',
      'triangulation': 'Triangulation Setup'
    }
    return titles[props.wizardType] || 'Setup'
  })
  
  const hasTimePeriod = computed(() => {
    return props.wizardType.includes('performance')
  })
  
  const maxSteps = computed(() => {
    return hasTimePeriod.value ? 2 : 1
  })
  
  const canProceed = computed(() => {
    if (step.value === 1 && hasTimePeriod.value) {
      return timePeriodType.value && timePeriod.value
    }
    return true
  })
  
  // Performance view filters
  const performanceFilters = ref([
    {
      name: 'Section',
      expanded: false,
      selected: [],
      items: ['Employers Liability', 'Public Liability']
    },
    {
      name: 'Industry',
      expanded: false,
      selected: [],
      items: ['Construction Building', 'Hospitality', 'Janitorial Services', 'Retail Operations', 'Recreational Activities', 'No Longer Operating', 'Taverns/Inns', 'Warehouses/Factories']
    },
    {
      name: 'Trade',
      expanded: false,
      selected: [],
      items: ['ATHLETIC CLUBS', 'CARPENTRY', 'CONSTRUCTION SERVICES', 'CORPORATE OFFICES', 'DINERS', 'DISCOTHEQUES', 'EXTRACTION INDUSTRY', 'FARMING', 'FINANCIAL SERVICES', 'FOOD PROCESSING', 'GUEST HOUSES', 'HORSE BREEDING', 'INDUSTRIAL MANUFACTURING', 'JANITORIAL SERVICES', 'LOGISTICS', 'MEAT PROCESSING', 'METALWORKS', 'PROTECTIVE SERVICES', 'RACETRACKS', 'REAL ESTATE', 'RECREATION', 'RECYCLING PLANTS', 'RESIDENTIAL CARE', 'SHELTER & TEMPORARY HOUSING', 'SHOPS', 'TAVERNS', 'TECH INDUSTRY']
    },
    {
      name: 'Loss Type',
      expanded: false,
      selected: [],
      items: ['Injury', 'Property Damage']
    },
    {
      name: 'Underwriting Period',
      expanded: false,
      selected: [],
      items: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
    },
    {
      name: 'Group 1',
      expanded: false,
      selected: [],
      items: ['Chunk 1', 'Chunk 2', 'Other']
    }
  ])
  
  // Comparison view filters
  const comparisonFilters = ref([
    {
      name: 'Chunking Groups',
      expanded: false,
      selected: [],
      items: ['Section', 'Industry', 'Group 1', 'Trade']
    },
    {
      name: 'Tiering Groups',
      expanded: false,
      selected: [],
      items: ['Fwd tiering 1', 'CrudeFwd', 'eg2 4 Tiers', 'Test tier 2', 'Demo tier', 'Last 12 months NLR', 'loss ratio', 'All time', 'None']
    },
    {
      name: 'Table Values',
      expanded: false,
      selected: [],
      items: ['GWP', 'Forward Looking', 'Underwriting', 'Accident', 'All Time']
    }
  ])
  
  // Treemap filters (only Tiering Groups)
  const treemapFilters = ref([
    {
      name: 'Tiering Groups',
      expanded: false,
      selected: [],
      items: ['Fwd tiering 1', 'CrudeFwd', 'eg2 4 Tiers', 'Test tier 2', 'Demo tier', 'Last 12 months NLR', 'loss ratio', 'All time', 'None']
    }
  ])

  // Triangulation filters
  const triangulationFilters = ref([
    {
      name: 'Accident/underwriting',
      expanded: false,
      selected: [],
      items: ['accident', 'underwriting']
    },
    {
      name: 'Triangles type',
      expanded: false,
      selected: [],
      items: ['Incurred claims triangle', 'Paid claims triangle', 'Count of claims triangle']
    },
    {
      name: 'Claims type',
      expanded: false,
      selected: [],
      items: ['attritional', 'large']
    },
    {
      name: 'Section',
      expanded: false,
      selected: [],
      items: ['All']
    },
    {
      name: 'Industry',
      expanded: false,
      selected: [],
      items: ['All']
    },
    {
      name: 'Trade',
      expanded: false,
      selected: [],
      items: ['All']
    },
    {
      name: 'Loss type',
      expanded: false,
      selected: [],
      items: ['All']
    },
    {
      name: 'Cohort',
      expanded: false,
      selected: [],
      items: ['Month', 'Quarter', 'Year']
    },
    {
      name: 'Development',
      expanded: false,
      selected: [],
      items: ['Monthly', 'Quarterly', 'Yearly']
    }
  ])
  
  const currentFilters = computed(() => {
    if (props.wizardType === 'triangulation') {
      return triangulationFilters.value
    } else if (props.wizardType === 'comparison-treemap') {
      return treemapFilters.value
    } else if (props.wizardType.includes('comparison')) {
      return comparisonFilters.value
    } else {
      return performanceFilters.value
    }
  })
  
  // Reset when wizard type changes
  watch(() => props.wizardType, () => {
    step.value = 1
    timePeriodType.value = ''
    timePeriod.value = ''
    boxSizeIndicator.value = ''
    boxSizeExpanded.value = false
    boxSizeSelected.value = []
    selectedHierarchies.value = []
  })
  
  // Drag and drop for hierarchies
  const dragStart = (index) => {
    draggedIndex.value = index
  }
  
  const dragDrop = (index) => {
    if (draggedIndex.value !== null && draggedIndex.value !== index) {
      const draggedItem = hierarchies.value[draggedIndex.value]
      hierarchies.value.splice(draggedIndex.value, 1)
      hierarchies.value.splice(index, 0, draggedItem)
    }
    draggedIndex.value = null
  }
  
  const finish = () => {
    const data = {
      wizardType: props.wizardType,
      filters: currentFilters.value.map(f => ({ name: f.name, selected: f.selected }))
    }
    
    if (hasTimePeriod.value) {
      data.timePeriodType = timePeriodType.value
      data.timePeriod = timePeriod.value
    }
    
    if (props.wizardType === 'comparison-treemap') {
      data.boxSizeSelected = boxSizeSelected.value
      data.hierarchies = hierarchies.value
      data.selectedHierarchies = selectedHierarchies.value
    }
    
    emit('finish', data)
  }
  </script>
  
  <style scoped>
  .wizard {
    width: 500px;
    max-height: 600px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
  }
  
  /* Header */
  .header {
    padding: 20px;
    border-bottom: 1px solid #e5e5e5;
  }
  
  .header h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .steps {
    display: flex;
    gap: 20px;
  }
  
  .step {
    padding: 8px 16px;
    border-radius: 20px;
    background: #f5f5f5;
    font-size: 12px;
    font-weight: 500;
    color: #666;
  }
  
  .step.active {
    background: #1890ff;
    color: white;
  }
  
  /* Content */
  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .content::-webkit-scrollbar {
    width: 8px;
  }
  
  .content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  .step-content h4 {
    margin: 0 0 20px 0;
    font-size: 16px;
    font-weight: 500;
  }
  
  .step-content h5 {
    margin: 0 0 15px 0;
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }
  
  .mt-4 {
    margin-top: 20px;
  }
  
  /* Time Period Options */
  .options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .option:hover {
    border-color: #1890ff;
  }
  
  .option.selected {
    border-color: #1890ff;
    background: #f6ffed;
  }
  
  .radio {
    width: 16px;
    height: 16px;
    border: 2px solid #d9d9d9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .option.selected .radio {
    border-color: #1890ff;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    background: #1890ff;
    border-radius: 50%;
  }
  
  /* Filters */
  .filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .filter {
    border: 1px solid #e5e5e5;
    border-radius: 4px;
  }
  
  .filter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #fafafa;
    cursor: pointer;
    user-select: none;
  }
  
  .filter-header:hover {
    background: #f0f0f0;
  }
  
  .icon {
    font-size: 10px;
    transition: transform 0.2s;
    color: #666;
  }
  
  .icon.expanded {
    transform: rotate(90deg);
  }
  
  .filter-content {
    padding: 12px;
    background: white;
    max-height: 200px;
    overflow-y: auto;
    border-top: 1px solid #f0f0f0;
  }
  
  .filter-content::-webkit-scrollbar {
    width: 8px;
  }
  
  .filter-content::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 4px;
  }
  
  .filter-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .filter-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  .filter-content::-webkit-scrollbar-thumb:active {
    background: #909090;
  }
  
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
  }
  
  .item:hover {
    background-color: #f8f9fa;
    border-radius: 3px;
    margin: 0 -4px;
    padding: 6px 4px;
  }
  
  .item input[type="checkbox"] {
    margin: 0;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    cursor: pointer;
    border: 2px solid #666;
    border-radius: 3px;
  }
  
  .item input[type="checkbox"]:checked {
    accent-color: #1890ff;
    border-color: #1890ff;
  }
  
  .item input[type="checkbox"]:hover {
    border-color: #1890ff;
  }
  
  .item label {
    cursor: pointer;
    font-size: 13px;
    color: #333;
    line-height: 1.4;
    flex: 1;
  }
  
  .item label:hover {
    color: #1890ff;
  }
  
  /* Configuration sections */
  .config-section {
    margin-bottom: 25px;
  }
  
  /* Hierarchies */
  .hierarchies {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .hierarchy-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    background: white;
    cursor: move;
    transition: all 0.2s;
  }
  
  .hierarchy-item:hover {
    border-color: #1890ff;
    background: #f8f9fa;
  }
  
  .hierarchy-item:active {
    opacity: 0.8;
  }
  
  .drag-handle {
    color: #999;
    font-size: 12px;
    cursor: grab;
    user-select: none;
  }
  
  .drag-handle:active {
    cursor: grabbing;
  }
  
  .hierarchy-item input[type="checkbox"] {
    margin: 0;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    cursor: pointer;
  }
  
  .hierarchy-checkbox {
    border: 2px solid #333 !important;
  }
  
  .hierarchy-checkbox:checked {
    accent-color: #1890ff !important;
    border-color: #1890ff !important;
  }
  
  .hierarchy-checkbox:hover {
    border-color: #1890ff !important;
  }
  
  .hierarchy-item label {
    cursor: pointer;
    font-size: 13px;
    color: #333;
    flex: 1;
  }
  
  /* Footer */
  .footer {
    padding: 20px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  .btn {
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .btn.primary {
    background: #1890ff;
    border-color: #1890ff;
    color: white;
  }
  
  .btn.primary:hover:not(:disabled) {
    background: #40a9ff;
    border-color: #40a9ff;
  }
  
  .btn.primary:disabled {
    background: #f5f5f5;
    border-color: #d9d9d9;
    color: #bfbfbf;
    cursor: not-allowed;
  }
  
  .btn.secondary {
    background: white;
    border-color: #d9d9d9;
    color: #595959;
  }
  
  .btn.secondary:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
  
  .btn.cancel {
    background: white;
    border-color: #d9d9d9;
    color: #595959;
  }
  
  .btn.cancel:hover {
    border-color: #ff4d4f;
    color: #ff4d4f;
  }
  </style>