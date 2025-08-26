<template>
    <div class="wizard">
      <div class="header">
      <h3>Dashboard Table Setup</h3>
      </div>
  
      <div class="content">
      <div v-if="!currentPortfolio" class="error-box">
        <p>❌ <strong>Error:</strong> No portfolio data found. Please ensure you have selected a portfolio in the main Sybil app and accessed the presentations module.</p>
        <button @click="refreshPortfolioData" class="btn primary mt-3">
          🔄 Refresh Portfolio Data
        </button>
              </div>
      <div v-if="currentPortfolio">
        <DashboardHeadersWizard ref="headersWizardRef" />
        <div class="mt-6">
          <DataFiltersWizard />
            </div>
          </div>
        </div>

      <div class="footer">
      <button @click="finish" class="btn primary">Finish</button>
        <button @click="emit('close')" class="btn cancel">Cancel</button>
      </div>
    </div>
  </template>
  
  <script setup>
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/store/dashboard'
import DashboardHeadersWizard from '@/components/DashboardTable/components/DashboardHeadersWizard.vue'
import DataFiltersWizard from '@/components/FilterWizard/DataFiltersWizard.vue'
  
  const emit = defineEmits(['close', 'finish'])
  
const dashboardStore = useDashboardStore()
const headersWizardRef = ref()

onMounted(() => {
  const portfolioData = dashboardStore.getCurrentPortfolioFromStorage()
  if (portfolioData) {
    dashboardStore.setPortfolioData(portfolioData)
  }
})

function refreshPortfolioData() {
  const portfolioData = dashboardStore.getCurrentPortfolioFromStorage()
  if (portfolioData) {
    dashboardStore.setPortfolioData(portfolioData)
  }
}

const currentPortfolio = computed(() => {
  return dashboardStore.currentPortfolio
})
  
  const finish = () => {
  const columnConfig = headersWizardRef.value ? {
    showColumn: headersWizardRef.value.showColumn,
    margin: headersWizardRef.value.margin,
    showColumnTotal: headersWizardRef.value.showColumnTotal,
    totalMargin: headersWizardRef.value.totalMargin
  } : {};
  
    const data = {
    wizardType: 'dashboard-table',
    dashboardFilters: {
      accidentUnderwriting: dashboardStore.filterAccidentUnderwriting,
      selectedFilters: dashboardStore.selectedFilters
    },
    columnConfig
    }
    
    emit('finish', data)
  }
  </script>
  
  <style scoped>
  .wizard {
    width: 500px;
    max-height: 600px;
    display: flex;
    flex-direction: column;
  }
  
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
  background: #55B691;
    color: white;
  }
  
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
  
.mt-6 {
  margin-top: 24px;
}

.mt-3 {
  margin-top: 12px;
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
  

  .content::-webkit-scrollbar-thumb:hover {

    background: #a8a8a8;

  }

  

.mt-6 {
  margin-top: 24px;
}

.mt-3 {
  margin-top: 12px;
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
  </style>