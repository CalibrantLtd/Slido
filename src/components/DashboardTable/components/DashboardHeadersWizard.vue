<template>
  <div class="dashboard-headers-wizard">
    <div class="wizard-title">
      <h4>Configure Dashboard Table</h4>
      <p>Set up the table headers and controls below. The final table will display exactly as configured.</p>
    </div>
    
    <div class="table-preview">
      <div class="table-scroll-container">
        <table class="dashboard-headers-table">
        <thead class="sticky top-0 z-30 header-teal">
          <tr>
            <DashboardHeader
              :total-margin-ccr="0"
              :margin="{}"
              :total-margin="0"
              :left-column-size="3"
              @on-change-ccr-margin="() => {}"
            />
          </tr>
          <tr>
            <UltimatesHeader
              :margin="margin"
              :total-margin="totalMargin"
              :show-column-total="showColumnTotal"
              :show-column="showColumn"
              :left-column-size="3"
              @on-change-total-margin="onChangeTotalMargin"
              @on-change-margin="onChangeMargin"
              @on-change-show-column="onChangeShowColumn"
              @on-change-show-column-total="onChangeShowColumnTotal"
            />
          </tr>
        </thead>
        <tbody>
        </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDashboardStore } from '@/store/dashboard';
import { usePortfolioStore } from '@/store/portfolio';
import DashboardHeader from './headers/DashboardHeader.vue';
import UltimatesHeader from './headers/UltimatesHeader.vue';

const dashboardStore = useDashboardStore();
const portfolioStore = usePortfolioStore();

dashboardStore.syncPeriods();

// State for controlling column visibility in preview
const showColumn = ref<{ [key: string]: boolean }>({});
const margin = ref<{ [key: string]: number }>({});
const showColumnTotal = ref(false);
const totalMargin = ref(0);

// Initialize default state - all columns visible
const claimsType = computed(() => portfolioStore.parameters.claims_nature || []);
const initializeColumnState = () => {
  claimsType.value.forEach(item => {
    showColumn.value[item] = true;
    margin.value[item] = 0;
  });
};

// Initialize on mount
initializeColumnState();

function onChangeShowColumn(data: { val: boolean; item: string }) {
  showColumn.value[data.item] = data.val;
}

function onChangeMargin(data: { val: number; item: string }) {
  margin.value[data.item] = data.val;
}

function onChangeShowColumnTotal(val: boolean) {
  showColumnTotal.value = val;
}

function onChangeTotalMargin(val: number) {
  totalMargin.value = val;
}

// Expose the column state for parent components
defineExpose({
  showColumn,
  margin,
  showColumnTotal,
  totalMargin
});
</script>

<style scoped>
.dashboard-headers-wizard {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.wizard-title {
  margin-bottom: 20px;
  text-align: center;
}

.wizard-title h4 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.wizard-title p {
  color: #6c757d;
  font-size: 14px;
  margin: 0;
}

.table-preview {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.table-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  border-radius: 8px;
}

.table-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.dashboard-headers-table {
  width: 100%;
  min-width: 1200px;
  border-spacing: 0;
  border-collapse: collapse;
}

.header-teal {
  background-color: rgb(187, 226, 211) !important;
}
</style>