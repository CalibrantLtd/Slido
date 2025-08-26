<template>
  <div class="data-filters-wizard">
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Configure Data Filters</h3>
      <p class="text-sm text-gray-600">Select the data filters to apply to your dashboard table.</p>
    </div>

    <div class="filters-section">
      <div v-if="currentPortfolio">
        <div v-for="section in currentFilters" :key="section.name" class="filter-section mb-6">
          <div class="filter-header" @click="toggleSection(section.name)">
            <span class="icon" :class="{ expanded: section.expanded }">►</span>
            <span class="filter-name">{{ section.name }}</span>
            <span class="filter-count">({{ getSelectedCount(section.name) }} selected)</span>
            <button 
              v-if="getSelectedCount(section.name) > 0" 
              @click.stop="clearSelection(section.name)"
              class="clear-btn"
              title="Clear selection"
            >
              ✕
            </button>
          </div>
          
          <div v-if="section.expanded" class="filter-content">
            <div class="filter-options">
              <div v-for="item in section.items" :key="String(item)" class="filter-option">
                <input 
                  type="checkbox" 
                  :id="`${section.name}-${String(item)}`" 
                  :checked="isSelected(section.name, String(item))"
                  @change="toggleFilter(section.name, String(item))"
                  class="filter-checkbox"
                />
                <label :for="`${section.name}-${String(item)}`" class="filter-label">
                  {{ item }}
                </label>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDashboardStore } from '@/store/dashboard';

const dashboardStore = useDashboardStore();

const currentPortfolio = computed(() => dashboardStore.currentPortfolio);

const currentFilters = computed(() => {
  const filters = dashboardStore.availableFilters;
  return Object.entries(filters).map(([name, items]) => ({
    name,
    items: Array.isArray(items) ? items : Object.values(items),
    expanded: expandedSections.value[name] || false
  }));
});

const expandedSections = ref<Record<string, boolean>>({});

function isSelected(sectionName: string, item: string): boolean {
  const selected = dashboardStore.selectedFilters[sectionName] || [];
  const section = currentFilters.value.find(s => s.name === sectionName);
  
  if (!section) return false;
  
  if (selected.length === section.items.length) {
    return false;
  }
  
  return selected.includes(item);
}

function toggleFilter(sectionName: string, item: string) {
  const currentSelected = dashboardStore.selectedFilters[sectionName] || [];
  const section = currentFilters.value.find(s => s.name === sectionName);
  
  if (!section) return;
  
  const allSelected = currentSelected.length === section.items.length;
  
  if (allSelected) {
    dashboardStore.setFilterSelection(sectionName, [item]);
  } else {
    const isCurrentlySelected = currentSelected.includes(item);
    
    if (isCurrentlySelected) {
      const newSelected = currentSelected.filter(selectedItem => selectedItem !== item);
      dashboardStore.setFilterSelection(sectionName, newSelected);
    } else {
      const newSelected = [...currentSelected, item];
      dashboardStore.setFilterSelection(sectionName, newSelected);
    }
  }
}

function getSelectedCount(sectionName: string): number {
  const selected = dashboardStore.selectedFilters[sectionName] || [];
  const section = currentFilters.value.find(s => s.name === sectionName);
  
  if (!section) return 0;
  
  if (selected.length === section.items.length) {
    return 0;
  }
  
  return selected.length;
}


function toggleSection(sectionName: string) {
  expandedSections.value[sectionName] = !expandedSections.value[sectionName];
}

function refreshPortfolioData() {
  dashboardStore.getCurrentPortfolioFromStorage();
}

function clearSelection(sectionName: string) {
  dashboardStore.setFilterSelection(sectionName, []);
}
</script>

<style scoped>
.data-filters-wizard {
  max-height: none;
  overflow-y: visible;
}

.error-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.error-box p {
  color: #dc2626;
  margin: 0 0 12px 0;
}

.filters-section {
  margin-bottom: 24px;
}

.filter-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.filter-header {
  background: #f9fafb;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.filter-header:hover {
  background: #f3f4f6;
}

.icon {
  transition: transform 0.3s ease;
  color: #6b7280;
  font-size: 12px;
  font-weight: bold;
}

.icon.expanded {
  transform: rotate(90deg);
}

.filter-name {
  font-weight: 600;
  color: #374151;
}

.filter-count {
  color: #6b7280;
  font-size: 14px;
  margin-left: auto;
}

.clear-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  padding: 2px 6px;
  margin-left: 8px;
  border-radius: 3px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background-color: #f3f4f6;
  color: #dc2626;
}

.filter-content {
  padding: 16px;
  background: white;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-checkbox {
  width: 14px;
  height: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background-color: #fff;
  position: relative;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  outline: none;
  box-shadow: none;
}

.filter-checkbox::-webkit-appearance {
  appearance: none;
  -webkit-appearance: none;
}

.filter-checkbox::-moz-appearance {
  appearance: none;
  -moz-appearance: none;
}

.filter-checkbox:checked {
  background-color: #55B691 !important;
  border-color: #55B691 !important;
  box-shadow: none !important;
  outline: none !important;
}

.filter-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.filter-checkbox:hover {
  border-color: #55B691 !important;
  box-shadow: none !important;
  outline: none !important;
}

.filter-checkbox:hover:checked {
  background-color: #55B691 !important;
  border-color: #55B691 !important;
}

.filter-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(85, 182, 145, 0.2);
}

.filter-label {
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}


.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn.primary {
  background: #55B691;
  color: white;
}

.btn.primary:hover {
  background: #4a9d7f;
}

.mt-3 {
  margin-top: 12px;
}
</style>