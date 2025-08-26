<template>
    <div class="wizard">
      <div class="header">
      <h3>{{ isChartWizard ? 'Performance Chart Setup' : 'Dashboard Table Setup' }}</h3>
      </div>
  
      <div class="content">
      <div v-if="isLoading" class="loading-box">
        <div class="loading-spinner"></div>
        <p>Loading portfolio data...</p>
      </div>
      <div v-else-if="!currentPortfolio" class="error-box">
        <p>❌ <strong>Error:</strong> No portfolio data found. Please ensure you have selected a portfolio in the main Sybil app and accessed the presentations module.</p>
        <p class="mt-2">💡 <strong>Solution:</strong> Please refresh the page and try again.</p>
      </div>
      <div v-else>
        <div class="options">
          <div class="option-group">
            <div class="group-title">Time Period (MQY)</div>
            <label class="radio"><input type="radio" name="mqy" value="month" :checked="dashboards.mqy==='month'" @change="() => setPeriod('month')"> Monthly</label>
            <label class="radio"><input type="radio" name="mqy" value="quarter" :checked="dashboards.mqy==='quarter'" @change="() => setPeriod('quarter')"> Quarterly</label>
            <label class="radio"><input type="radio" name="mqy" value="year" :checked="dashboards.mqy==='year'" @change="() => setPeriod('year')"> Yearly</label>
          </div>

          <div class="option-group">
            <div class="group-title">Period</div>
            <label class="radio"><input type="radio" name="uw_acc" value="acc" :checked="dashboards.uw_acc==='acc'" @change="() => setUwMode('acc')"> Accident</label>
            <label class="radio"><input type="radio" name="uw_acc" value="uw" :checked="dashboards.uw_acc==='uw' && !isBindedYears" @change="() => setUwMode('uw')"> Underwriting</label>
            <label class="radio" v-if="dashboards.mqy==='year'"><input type="radio" name="uw_acc" value="bespoke" :checked="dashboards.uw_acc==='uw' && isBindedYears" @change="() => setUwMode('bespoke')"> Bespoke</label>
          </div>

          <div class="option-group" v-if="!isSimplifiedTemplate || props.element?.lossRatiosOnly || props.element?.totalUltimateOnly">
            <div class="group-title">GWP/NWP</div>
            <label class="radio"><input type="radio" name="premium" value="GWP" :checked="dashboards.gwpnwp==='GWP'" @change="() => switchGwpNwp('GWP')"> GWP</label>
            <label class="radio"><input type="radio" name="premium" value="NWP" :checked="dashboards.gwpnwp==='NWP'" @change="() => switchGwpNwp('NWP')"> NWP</label>
          </div>

          <div class="option-group" v-if="dashboards.uw_acc==='uw'">
            <div class="group-title">Written/Earned Basis</div>
            <label class="radio"><input type="radio" name="basis" value="Written" :checked="underwriting_loss_ratios==='Written'" @change="() => setBasis('Written')"> Written</label>
            <label class="radio"><input type="radio" name="basis" value="Earned" :checked="underwriting_loss_ratios==='Earned'" @change="() => setBasis('Earned')"> Earned</label>
          </div>

          <div class="option-group" v-if="!isSimplifiedTemplate">
            <div class="group-title">CCR / NLR</div>
            <label class="radio"><input type="radio" name="ccrnlr" value="CCR" :checked="dashboards.ccr_nlr==='CCR'" @change="() => setCcrNlr('CCR')"> CCR</label>
            <label class="radio"><input type="radio" name="ccrnlr" value="NLR" :checked="dashboards.ccr_nlr==='NLR'" @change="() => setCcrNlr('NLR')"> NLR</label>
          </div>

          <div class="option-group" v-if="!hideSeasonalityAdjustment">
            <div class="group-title">Seasonality Adjustment</div>
            <label class="radio"><input type="radio" name="seasonality" value="no" :checked="!dashboards.seasonFactor" @change="() => setSeasonality(false)"> No Seasonality Adjustment</label>
            <label class="radio"><input type="radio" name="seasonality" value="yes" :checked="dashboards.seasonFactor" @change="() => setSeasonality(true)"> Seasonality Adjustment</label>
          </div>

          <div class="option-group" v-if="!isChartWizard">
            <div class="group-title">Display</div>
            <label class="radio"><input type="radio" name="ratio_amount" value="ratios" :checked="dashboards.ratio_amount==='ratios'" @change="() => setRatioAmount('ratios')"> Ratios</label>
            <label class="radio"><input type="radio" name="ratio_amount" value="amount" :checked="dashboards.ratio_amount==='amount'" @change="() => setRatioAmount('amount')"> Amounts</label>
          </div>

          <div class="option-group" v-if="isChartWizard">
            <div class="group-title">Chart Options</div>
            <label class="checkbox">
              <input type="checkbox" :checked="graphConfig.isGLR" @change="() => setCommission(!graphConfig.isGLR)">
              Include Commission
            </label>
            <label class="checkbox">
              <input type="checkbox" :checked="graphConfig.isNormalised" @change="() => setNormalised(!graphConfig.isNormalised)">
              Normalized View
            </label>
          </div>

          <div class="option-group" v-if="isChartWizard">
            <div class="group-title">Series Visibility</div>
            <label class="checkbox">
              <input type="checkbox" :checked="graphConfig.showGwpBars" @change="() => setShowGwpBars(!graphConfig.showGwpBars)">
              Show GWP/NWP
            </label>
            <label class="checkbox">
              <input type="checkbox" :checked="graphConfig.showGepBars" @change="() => setShowGepBars(!graphConfig.showGepBars)">
              Show GEP/NEP
            </label>
            <label class="checkbox">
              <input type="checkbox" :checked="graphConfig.showSeasonalityApriori" @change="() => setShowSeasonalityApriori(!graphConfig.showSeasonalityApriori)">
              Show Seasonality Adjusted A-priori
            </label>
          </div>

          <div class="option-group">
            <div class="group-title">Configure Data Filters</div>
            <DataFiltersWizard />
          </div>
        </div>
      </div>
      </div>

      <div class="footer" v-if="!isLoading">
      <button @click="finish" class="btn primary">Finish</button>
        <button @click="emit('close')" class="btn cancel">Cancel</button>
      </div>
    </div>
  </template>
  
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/store/dashboard'
import { portfolioService } from '@/services/portfolioService'
import DataFiltersWizard from '@/components/FilterWizard/DataFiltersWizard.vue'
  
const emit = defineEmits(['close', 'finish'])

const props = defineProps({
  portfolio: { type: Object, default: null },
  bounce: { type: Object, default: null },
  wizardType: { type: String, default: 'dashboard-table' },
  element: { type: Object, default: null },
  prePopulatedSettings: { type: Object, default: null }
})

const dashboardStore = useDashboardStore()
const isLoading = ref(true)

const isSimplifiedTemplate = computed(() => {
  if (!props.element) return false
  
  return props.element.attritionalOnly || 
         props.element.largeOnly || 
         props.element.weatherOnly || 
         props.element.totalUltimateOnly ||
         props.element.lossRatiosOnly ||
         props.element.largeLossLoad
})

const isChartWizard = computed(() => {
  return props.wizardType === 'performance-chart'
})

const hideSeasonalityAdjustment = computed(() => {
  if (!props.element) return false
  
  return props.element.attritionalOnly || 
         props.element.largeOnly || 
         props.element.weatherOnly || 
         props.element.totalUltimateOnly ||
         props.element.lossRatiosOnly ||
         props.element.attritionalLargeExpanded ||
         props.element.largeLossLoad
})

onMounted(async () => {  
  if (props.portfolio && props.bounce) {
    try {      
      const completeData = await portfolioService.fetchCompletePortfolioData(
        props.portfolio.id, 
        props.bounce.id || props.bounce.nodeID
      )
      const bounceName = props.bounce.displayName || props.bounce.name
      completeData.portfolioName = props.portfolio.name
      completeData.bounceName = bounceName.slice(26) || bounceName.slice(25)
      completeData.bounceDate = bounceName.slice(0, 6)
      completeData.bounceFullName = bounceName
      dashboardStore.setPortfolioData(completeData)
    } catch (error) {
      const fallbackData = {
        portfolioId: props.portfolio.id,
        portfolioName: props.portfolio.name,
        bounceId: props.bounce.nodeID || props.bounce.id,
        bounceName: props.bounce.displayName || props.bounce.name,
        bounceDate: props.bounce.date,
        bounceFullName: props.bounce.name,
        timestamp: Date.now(),
        claimsNature: ['ATTRITIONAL', 'LARGE'],
        exposure: [
          { name: 'Total Risk Count', method: 'sum' },
          { name: 'Average GWP', method: 'average' }
        ],
        normaliseSelection: [true],
        filterOptions: {},
        parameters: {
          claims_nature: ['ATTRITIONAL', 'LARGE'],
          exposure: [
            { name: 'Total Risk Count', method: 'sum' },
            { name: 'Average GWP', method: 'average' }
          ]
        }
      }
      dashboardStore.setPortfolioData(fallbackData)
    }
  } else {
    const portfolioData = dashboardStore.getCurrentPortfolioFromStorage()
    if (portfolioData) {
      dashboardStore.setPortfolioData(portfolioData)
    }
  }
  
  if (props.prePopulatedSettings) {    
    setTimeout(async () => {
      await applyPrePopulatedSettings(props.prePopulatedSettings)
    }, 100)
  }
  
  isLoading.value = false
})

const currentPortfolio = computed(() => dashboardStore.currentPortfolio)
const dashboards = computed(() => dashboardStore.dashboards)
const isBindedYears = computed(() => dashboardStore.isBindedYears)
const underwriting_loss_ratios = computed(() => dashboardStore.underwriting_loss_ratios)
const graphConfig = computed(() => dashboardStore.graphConfig)

function setPeriod(period) { dashboardStore.setPeriod(period) }
async function setUwMode(target) {
  const isYear = dashboards.value.mqy === 'year'
  const inAcc = dashboards.value.uw_acc === 'acc'
  const inUw = dashboards.value.uw_acc === 'uw' && !isBindedYears.value
  const inBespoke = dashboards.value.uw_acc === 'uw' && isBindedYears.value

  if (target === 'acc') {
    if (inAcc) return
    if (isYear) {
      // uw -> bespoke -> acc, bespoke -> acc
      await dashboardStore.change_uw_acc()
      if (!dashboards.value || (dashboards.value.uw_acc === 'uw' && isBindedYears.value)) {
        await dashboardStore.change_uw_acc()
      }
    } else {
      await dashboardStore.change_uw_acc()
    }
    return
  }

  if (target === 'uw') {
    if (inUw) return
    if (isYear) {
      if (inAcc) {
        await dashboardStore.change_uw_acc() // acc -> uw
      } else if (inBespoke) {
        await dashboardStore.change_uw_acc() // bespoke -> acc
        await dashboardStore.change_uw_acc() // acc -> uw
      }
    } else {
      if (inAcc) await dashboardStore.change_uw_acc()
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
function switchGwpNwp(target) { if (dashboards.value.gwpnwp !== target) dashboardStore.switch_gwpnwp_amount() }
function setBasis(val) { if (underwriting_loss_ratios.value !== val) dashboardStore.underwritingLossRatiosChange() }
function setCcrNlr(val) { if (dashboards.value.ccr_nlr !== val) dashboardStore.changeccrnlr() }
function setSeasonality(val) { if (!!dashboards.value.seasonFactor !== !!val) dashboardStore.changeSeas() }
function setRatioAmount(val) { if (dashboards.value.ratio_amount !== val) dashboardStore.switch_ratio_amount() }
function setCommission(val) { dashboardStore.graphConfig.isGLR = val }
function setNormalised(val) { dashboardStore.graphConfig.isNormalised = val }
function setShowGwpBars(val) { dashboardStore.graphConfig.showGwpBars = val }
function setShowGepBars(val) { dashboardStore.graphConfig.showGepBars = val }
function setShowSeasonalityApriori(val) { dashboardStore.graphConfig.showSeasonalityApriori = val }

const applyPrePopulatedSettings = async (settings) => {
  try {
    const { dashboardConfig, dashboardFilters, chartConfig } = settings
    if (dashboardConfig) {
      if (dashboardConfig.mqy && dashboardConfig.mqy !== dashboards.value.mqy) {
        setPeriod(dashboardConfig.mqy)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.period) {
        await setUwMode(dashboardConfig.period)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.premium && dashboards.value.gwpnwp !== dashboardConfig.premium) {
        switchGwpNwp(dashboardConfig.premium)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.basis && underwriting_loss_ratios.value !== dashboardConfig.basis) {
        setBasis(dashboardConfig.basis)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.ccr_nlr && dashboards.value.ccr_nlr !== dashboardConfig.ccr_nlr) {
        setCcrNlr(dashboardConfig.ccr_nlr)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.seasonality !== undefined && !!dashboards.value.seasonFactor !== !!dashboardConfig.seasonality) {
        setSeasonality(dashboardConfig.seasonality)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (dashboardConfig.display && dashboards.value.ratio_amount !== dashboardConfig.display) {
        setRatioAmount(dashboardConfig.display)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    if (dashboardFilters && dashboardFilters.selectedFilters) {
      Object.keys(dashboardFilters.selectedFilters).forEach(category => {
        dashboardStore.setFilterSelection(category, dashboardFilters.selectedFilters[category])
      })
    }
    
    if (chartConfig && isChartWizard.value) {     
      if (chartConfig.isGLR !== undefined) {
        setCommission(chartConfig.isGLR)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      if (chartConfig.isNormalised !== undefined) {
        setNormalised(chartConfig.isNormalised)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      if (chartConfig.showGwpBars !== undefined) {
        setShowGwpBars(chartConfig.showGwpBars)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      if (chartConfig.showGepBars !== undefined) {
        setShowGepBars(chartConfig.showGepBars)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      if (chartConfig.showSeasonalityApriori !== undefined) {
        setShowSeasonalityApriori(chartConfig.showSeasonalityApriori)
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying pre-populated settings:', error)
  }
}

const finish = () => {
  const data = {
    wizardType: props.wizardType,
    dashboardConfig: {
      mqy: dashboards.value.mqy,
      period: dashboards.value.uw_acc,
      bespoke: isBindedYears.value,
      premium: dashboards.value.gwpnwp,
      basis: underwriting_loss_ratios.value,
      ccr_nlr: dashboards.value.ccr_nlr,
      seasonality: dashboards.value.seasonFactor,
      display: dashboards.value.ratio_amount
    },
    dashboardFilters: {
      accidentUnderwriting: dashboards.value.uw_acc,
      selectedFilters: dashboardStore.selectedFilters
    }
  }
  emit('finish', data)
}
</script>
  
  <style scoped>
.wizard {
  width: 100%;
  max-height: 450px;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 0px 20px;
  border-bottom: 1px solid #e5e5e5;
}

  .header h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  }

.content {
  flex: 1;
  padding: 12px 20px;
  overflow-y: auto;
}

.options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.option-group { 
  border: 1px solid #e5e7eb; 
  border-radius: 8px; 
  padding: 12px;
  background: #fff;
}

.group-title { 
  font-weight: 600; 
  margin-bottom: 8px; 
  color: #374151;
}

.radio, .checkbox { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  margin: 6px 0;
}

.radio input[type="radio"] {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
}

.radio input[type="radio"]:not(:checked) {
  appearance: none;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  background: white;
}

.radio input[type="radio"]:checked {
  appearance: none;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  background: #3b82f6;
  position: relative;
}

.radio input[type="radio"]:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
}

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
  background: #55B691;
  border-color: #55B691;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #4a9d7f;
  border-color: #4a9d7f;
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

.error-box {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.error-box p {
  margin: 0;
  color: #cf1322;
  font-size: 13px;
}

.loading-box {
  padding: 40px 20px;
  text-align: center;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #55B691;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-box p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}
</style>