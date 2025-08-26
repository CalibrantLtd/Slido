<template>
  <div class="sybil-pool">
    <div class="category">
      <div class="category-name">Main dashboard</div>
      <div class="sybil-list">
        <div 
          class="sybil-item"
          v-for="item in sybilObjects" 
          :key="item.id"
          @click="$emit('select', item)"
        >
          <div class="sybil-icon">
            <IconInsertTable v-if="item.type.includes('table')" />
            <IconChartProportion v-else-if="item.type.includes('chart')" />
            <IconChartPie v-else />
          </div>
          <div class="sybil-name">{{ item.name }}</div>
        </div>
      </div>
    </div>

    <div class="category">
      <div class="category-name">Triangulations</div>
      <div class="sybil-list">
        <div 
          class="sybil-item"
          v-for="item in triangulationObjects" 
          :key="item.id"
          @click="$emit('select', item)"
        >
          <div class="sybil-icon">
            <IconInsertTable />
          </div>
          <div class="sybil-name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface SybilObjectItem {
  id: string
  name: string
  type: 'performance-table' | 'performance-chart' | 'comparison-table' | 'comparison-chart' | 'comparison-treemap' | 'triangulation' | 'dashboard-table'
}

defineEmits<{
  select: [payload: SybilObjectItem]
}>()

const sybilObjects: SybilObjectItem[] = [
  { id: 'performance-view-table', name: 'Performance view Table', type: 'performance-table' },
  { id: 'performance-view-chart', name: 'Performance view chart', type: 'performance-chart' },
  { id: 'comparison-view-table', name: 'Comparison view table', type: 'comparison-table' },
  { id: 'comparison-view-chart', name: 'Comparison view chart', type: 'comparison-chart' },
  { id: 'comparison-view-treemap', name: 'Comparison view treemap', type: 'comparison-treemap' },
  { id: 'dashboard-table', name: 'Dashboard Table', type: 'dashboard-table' }
]

const triangulationObjects: SybilObjectItem[] = [
  { id: 'incurred-claims-triangles', name: 'Incurred Claims Triangles', type: 'triangulation' },
  { id: 'link-ratios', name: 'Link ratios', type: 'triangulation' },
  { id: 'development-factors', name: 'Development Factors', type: 'triangulation' },
  { id: 'derived-link-ratios', name: 'Derived link ratios', type: 'triangulation' },
  { id: 'diagnostic-chart', name: 'Diagnostic Chart', type: 'triangulation' },
  { id: 'ultimate-selection', name: 'Ultimate Selection', type: 'triangulation' }
]
</script>

<style lang="scss" scoped>
.sybil-pool {
  width: 280px;
  max-height: 400px;
  overflow: auto;
  margin: -8px -10px -8px 0;
  padding: 10px 10px 0 0;
}

.category-name {
  font-size: 12px;
  margin-bottom: 10px;
  border-left: 4px solid #bbb;
  background-color: #f1f1f1;
  padding: 3px 0 3px 8px;
  color: #555;
}

.sybil-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sybil-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  .sybil-icon {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
  }

  .sybil-name {
    font-size: 13px;
    color: #333;
  }
}
</style> 
