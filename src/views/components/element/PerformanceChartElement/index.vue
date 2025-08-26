<template>
  <div 
    class="performance-chart-element"
    :class="{ 
      'lock': elementInfo.lock, 
      'invisible': elementInfo.isInvisible 
    }"
    :data-element-id="elementInfo.id"
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
        ref="elementRef"
        :style="{
          width: elementInfo.width + 'px',
          height: elementInfo.height + 'px',
        }"
        v-contextmenu="contextmenus || (() => null)"
        @mousedown="$event => handleSelectElement($event)"
        @touchstart="$event => handleSelectElement($event)"
        @dragstart.prevent
        @selectstart.prevent
      >
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
        />
        <PerformanceChart 
          v-if="elementInfo.type === 'performance-chart' && hasData" 
          :chart-data="chartData"
          :title="elementInfo.chartTitle || 'Performance Results'"
          :subtitle="chartSubtitle"
          :show-seasonality="showSeasonality"
          :show-target="elementInfo.showTarget || false"
          :is-g-l-r="dashboardStore.graphConfig.isGLR"
          :is-normalised="dashboardStore.graphConfig.isNormalised"
          :claims-type="claimsType"
          :normalise="normalise"
          :ccrnlr="ccrnlr"
          :uw-acc="uwAcc as 'uw' | 'acc'"
          :mqy="mqy"
          :is-ave="isAve"
          :gwpnwp="gwpnwp"
          :show-gwp-bars="dashboardStore.graphConfig.showGwpBars"
          :show-gep-bars="dashboardStore.graphConfig.showGepBars"
          :show-seasonality-apriori="dashboardStore.graphConfig.showSeasonalityApriori"
        />
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
import { ref, onMounted, computed } from 'vue'
import { type PPTElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import PerformanceChart from '@/components/DashboardCharts/PerformanceChart.vue'
import ElementOutline from '@/views/components/element/ElementOutline.vue'
import { useDashboardStore } from '@/store/dashboard'
import { usePortfolioStore } from '@/store/portfolio'
import { portfolioService } from '@/services/portfolioService'

const props = defineProps<{
  elementInfo: PPTElement & {
    width: number
    height: number
    rotate: number
    outline?: any
    props?: any
    portfolioId?: string
    portfolioName?: string
    bounceId?: string
    bounceName?: string
    selectedFilters?: any
    accidentUnderwriting?: 'uw' | 'acc'
    chartTitle?: string
    showSeasonality?: boolean
    showTarget?: boolean
    isGLR?: boolean
    isNormalised?: boolean
    isTemplatePlaceholder?: boolean
    isInvisible?: boolean
  }
  selectElement?: (e: MouseEvent | TouchEvent, element: PPTElement, canMove?: boolean) => void
  contextmenus?: () => ContextmenuItem[] | null
}>()

const elementRef = ref<HTMLElement>()
const dashboardStore = useDashboardStore()
const portfolioStore = usePortfolioStore()

const hasData = computed(() => {
  return (dashboardStore.chart_data && dashboardStore.chart_data.length > 0) || 
         (dashboardStore.dashboard_data && Object.keys(dashboardStore.dashboard_data).length > 0)
})

const chartData = computed(() => {
  if (dashboardStore.chart_data && dashboardStore.chart_data.length > 0) {
    return dashboardStore.chart_data
  }
  
  if (!hasData.value) {
    return []
  }
  
  const data = dashboardStore.dashboard_data
  const chartDataPoints: any[] = []
  
  Object.keys(data).forEach((key, index) => {
    const row = data[key]
    if (row && row.length > 0) {
      const chartPoint = {
        date: row[0] || `Period ${index + 1}`,
        gwp: parseFloat(row[1]) || 0,
        gep: parseFloat(row[2]) || 0,
        apriori: parseFloat(row[3]) || 0,
        target: parseFloat(row[4]) || 0,
        ccr: parseFloat(row[5]) || 0,
        incurred: parseFloat(row[6]) || 0,
        null: 0
      }
      chartDataPoints.push(chartPoint)
    }
  })
  
  return chartDataPoints
})

const chartSubtitle = computed(() => {
  const uwAcc = props.elementInfo.accidentUnderwriting || dashboardStore.dashboards?.uw_acc || 'uw'
  const mqy = dashboardStore.dashboards?.mqy || 'month'
  return `by ${uwAcc === 'uw' ? 'Underwriting' : 'Accident'} ${mqy.charAt(0).toUpperCase() + mqy.slice(1)}`
})

const claimsType = computed(() => portfolioStore.parameters?.claims_nature || ['All', 'Property', 'Liability'])
const normalise = computed(() => portfolioStore.normalise || [false, true, false])
const ccrnlr = computed(() => dashboardStore.dashboards?.ccr_nlr || 'GLR')
const uwAcc = computed(() => props.elementInfo.accidentUnderwriting || dashboardStore.dashboards?.uw_acc || 'uw')
const mqy = computed(() => dashboardStore.dashboards?.mqy || 'month')
const isAve = computed(() => (portfolioStore as any).isAve || false)
const gwpnwp = computed(() => dashboardStore.dashboards?.gwpnwp || 'GWP')
const showSeasonality = computed(() => dashboardStore.dashboards?.seasonFactor || false)


onMounted(async () => {
  if (!props.elementInfo.portfolioId || !props.elementInfo.bounceId || props.elementInfo.isTemplatePlaceholder) {
    return
  }
  
  try {      
    const completeData = await portfolioService.fetchCompletePortfolioData(
      props.elementInfo.portfolioId,
      props.elementInfo.bounceId
    )
    
    const bounceName = props.elementInfo.bounceName || ''
    completeData.portfolioName = props.elementInfo.portfolioName || ''
    completeData.bounceName = bounceName.slice(26) || bounceName.slice(25)
    completeData.bounceDate = bounceName.slice(0, 6)
    completeData.bounceFullName = bounceName
    
    dashboardStore.setPortfolioData(completeData)
    
    await dashboardStore.loadDashboard(completeData)
    
    dashboardStore.setChartData()
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (props.elementInfo.selectedFilters) {
      Object.assign(dashboardStore.selectedFilters, props.elementInfo.selectedFilters)
    }
    
    if (props.elementInfo.accidentUnderwriting) {
      dashboardStore.setAccidentUnderwriting(props.elementInfo.accidentUnderwriting)
    }
    
    await dashboardStore.loadDashboard(completeData)
      
  } catch (error: any) {
    console.error('Error loading portfolio data for performance chart:', error)
    
    if (error?.response?.status === 401) {
      console.warn('Authentication required. Chart will show mock data.')
    } else if (error?.code === 'ERR_CONNECTION_RESET' || error?.message?.includes('Failed to fetch')) {
      console.warn('Connection error. Chart will show mock data.')
    } else {
      console.error('Unexpected error:', error)
    }
  }
})

const handleSelectElement = (e: MouseEvent | TouchEvent, canMove = true) => {
  if (props.elementInfo.lock) return
  e.stopPropagation()
  e.preventDefault()

  if (props.selectElement) {
    props.selectElement(e, props.elementInfo, canMove)
  }
}
</script>

<style scoped>
.performance-chart-element {
  position: absolute;
  cursor: pointer;
  user-select: none;
  pointer-events: auto;
}

.performance-chart-element .element-content {
  pointer-events: auto;
}

.rotate-wrapper {
  width: 100%;
  height: 100%;
}

.element-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.lock {
  cursor: not-allowed;
}

.invisible {
  opacity: 0;
  pointer-events: auto;
}

.mock-chart {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}
.performance-chart-element .element-content {
  width: 100% !important;
  height: 100% !important;
}

.performance-chart-element .rotate-wrapper {
  width: 100% !important;
  height: 100% !important;
}
</style>
