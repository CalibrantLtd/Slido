<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ref } from 'vue';
import DashboardHeader from './components/headers/DashboardHeader.vue';
import UltimatesHeader from './components/headers/UltimatesHeader.vue';
import { usePortfolioStore } from '../../store/portfolio';
import { useDashboardStore } from '../../store/dashboard';
import type { BooleanDictionary, NumericDictionary } from '../../types/common';
import { icons } from '@/plugins/icon';
import './dashboardTable.css';
import ValueRow from './components/rows/ValueRow.vue';
import type { DashboardData } from '../../types/dashboard';

const portfolioStore = usePortfolioStore();
const dashboardStore = useDashboardStore();


const emit = defineEmits(['binderChange']);

onMounted(() => {
  // Component mounted
});


const props = defineProps<{
  overflow: string;
  containerWidth?: number;
  containerHeight?: number;
  attritionalOnly?: boolean;
  largeOnly?: boolean;
  weatherOnly?: boolean;
  totalUltimateOnly?: boolean;
}>();
const mqy = computed(() => dashboardStore.dashboards.mqy);

const binderDashboardData = computed(() => dashboardStore.binder_dashboard_data);
const quarterDashboardData = computed(() => dashboardStore.quarterly_dashboard_data);
const yearDashboardData = computed(() => dashboardStore.yearly_dashboard_data);

const isYearSubTotal = computed(() => dashboardStore.isYearSubTotal);
const isYearSubTotalUp = computed(() => dashboardStore.isYearSubTotalUp);
const isQuarterSubTotal = computed(() => dashboardStore.isQuarterSubTotal);
const isQuarterSubTotalUp = computed(() => dashboardStore.isQuarterSubTotalUp);
const isBinderSubTotal = computed(() => dashboardStore.isBinderSubTotal);
const isBinderSubTotalUp = computed(() => dashboardStore.isBinderSubTotalUp);
const claimsType = computed<string[]>(() => portfolioStore.parameters.claims_nature);
const attritionalKey = computed(() => {
  const list = (portfolioStore.parameters?.claims_nature as string[]) || [];
  const match = list.find((x) => String(x).toUpperCase() === 'ATTRITIONAL');
  return match || 'ATTRITIONAL';
});

const largeKey = computed(() => {
  const list = (portfolioStore.parameters?.claims_nature as string[]) || [];
  const match = list.find((x) => String(x).toUpperCase() === 'LARGE');
  return match || 'LARGE';
});

const weatherKey = computed(() => {
  const list = (portfolioStore.parameters?.claims_nature as string[]) || [];
  const match = list.find((x) => String(x).toUpperCase() === 'WEATHER');
  return match || 'WEATHER';
});
const showColumnTotal = computed(() => dashboardStore.showColumnTotal);

const filteredShowColumnTotal = computed(() => {
  if (props.totalUltimateOnly) {
    return true; // Force show total columns
  }
  return dashboardStore.showColumnTotal;
});
const totalMargin = computed(() => dashboardStore.totalMargin);

const filteredTotalMargin = computed(() => {
  if (props.totalUltimateOnly) {
    return 112; // Force expand total ultimate columns
  }
  return dashboardStore.totalMargin;
});
const showColumn = computed(() => dashboardStore.showColumn);
const margin = computed(() => dashboardStore.margin);

// Force expansion for specific claims type when in single-claims mode
const filteredMargin = computed(() => {
  if (props.attritionalOnly) {
    const result: any = { ...dashboardStore.margin };
    result[attritionalKey.value] = 112; // expanded spacing to show all sub-columns
    return result;
  }
  if (props.largeOnly) {
    const result: any = { ...dashboardStore.margin };
    result[largeKey.value] = 112; // expanded spacing to show all sub-columns
    return result;
  }
  if (props.weatherOnly) {
    const result: any = { ...dashboardStore.margin };
    result[weatherKey.value] = 112; // expanded spacing to show all sub-columns
    return result;
  }
  if (props.totalUltimateOnly) {
    const result: any = { ...dashboardStore.margin };
    // Keep all claims types collapsed (0) but show total ultimate columns
    Object.keys(result).forEach(key => {
      result[key] = 0; // collapsed state
    });
    return result;
  }
  return dashboardStore.margin;
});

const leftColumnSize = computed(
  () => 3 + (dashboardStore.isShowingExposure ? portfolioStore.getExposureLength() + 1 : 0)
);

const filteredLeftColumnSize = computed(() => 
  (props.attritionalOnly || props.largeOnly || props.weatherOnly) ? 1 : leftColumnSize.value
);

// Filter columns for single-claims mode
const filteredShowColumn = computed(() => {
  if (props.attritionalOnly) {
    const filtered: any = {};
    // Only show ATTRITIONAL columns and ensure they are expanded (true)
    Object.keys(dashboardStore.showColumn).forEach(key => {
      if (key.toUpperCase() === 'ATTRITIONAL' || key === attritionalKey.value) {
        filtered[key] = true; // Force expanded state
      }
    });
    // If key wasn't present yet, add by resolved label
    if (!filtered[attritionalKey.value]) {
      filtered[attritionalKey.value] = true;
    }
    return filtered;
  }
  if (props.largeOnly) {
    const filtered: any = {};
    // Only show LARGE columns and ensure they are expanded (true)
    Object.keys(dashboardStore.showColumn).forEach(key => {
      if (key.toUpperCase() === 'LARGE' || key === largeKey.value) {
        filtered[key] = true; // Force expanded state
      }
    });
    // If key wasn't present yet, add by resolved label
    if (!filtered[largeKey.value]) {
      filtered[largeKey.value] = true;
    }
    return filtered;
  }
  if (props.weatherOnly) {
    const filtered: any = {};
    // Only show WEATHER columns and ensure they are expanded (true)
    Object.keys(dashboardStore.showColumn).forEach(key => {
      if (key.toUpperCase() === 'WEATHER' || key === weatherKey.value) {
        filtered[key] = true; // Force expanded state
      }
    });
    // If key wasn't present yet, add by resolved label
    if (!filtered[weatherKey.value]) {
      filtered[weatherKey.value] = true;
    }
    return filtered;
  }
  if (props.totalUltimateOnly) {
    const filtered: any = {};
    // Show all claims types but collapsed (false)
    Object.keys(dashboardStore.showColumn).forEach(key => {
      filtered[key] = false; // Force collapsed state
    });
    return filtered;
  }
  return dashboardStore.showColumn;
});

const filteredClaimsType = computed(() => {
  if (props.attritionalOnly) {
    return [attritionalKey.value];
  }
  if (props.largeOnly) {
    return [largeKey.value];
  }
  if (props.weatherOnly) {
    return [weatherKey.value];
  }
  if (props.totalUltimateOnly) {
    return portfolioStore.parameters.claims_nature || ['ATTRITIONAL', 'LARGE'];
  }
  return portfolioStore.parameters.claims_nature || ['ATTRITIONAL', 'LARGE'];
});

// Filter visible columns for single-claims mode
const filteredVisibleColumns = computed(() => {
  if (props.attritionalOnly || props.largeOnly || props.weatherOnly) {
    return [3]; // Enable IBNR and Ultimate sub-columns for the specific claims type
  }
  if (props.totalUltimateOnly) {
    return [1, 2, 3]; // Show GWP, GEP, and CCR (for total ultimate columns)
  }
  return dashboardStore.visibleColumns;
});

// Filter main columns for single-claims mode (hide GWP, GEP, Commission, CCR, Seasonality)
const filteredMainColumns = computed(() => {
  if (props.attritionalOnly || props.largeOnly || props.weatherOnly) {
    return [];
  }
  if (props.totalUltimateOnly) {
    return [1, 2]; // Show GWP and GEP, hide Commission, CCR, Seasonality
  }
  return dashboardStore.visibleColumns;
});

const hideTotals = computed(() => !!(props.attritionalOnly || props.largeOnly || props.weatherOnly));

const tableEl = ref<HTMLElement | null>(null);
const containerEl = ref<HTMLElement | null>(null);
const naturalWidth = ref(1200);
const naturalHeight = ref(800);
let resizeObserver: ResizeObserver | null = null;
let containerObserver: ResizeObserver | null = null;
const containerWidthPx = ref(0);
const containerHeightPx = ref(0);

function updateNaturalSize() {
  if (tableEl.value) {
    if (props.attritionalOnly || props.largeOnly || props.weatherOnly) {
      const periodColumnWidth = 112;
      const columnWidth = 112; 
      const baseColumns = 5; // Paid, O/S, Incurred, IBNR, Ultimate
      const hasUnearned = dashboardStore.underwriting_loss_ratios === 'Written' && dashboardStore.dashboards.uw_acc === 'uw';
      const totalColumns = baseColumns + (hasUnearned ? 1 : 0);
      const calculatedWidth = periodColumnWidth + (totalColumns * columnWidth);
      
      naturalWidth.value = calculatedWidth + 5; 
    } else if (props.totalUltimateOnly) {
      // For total ultimate mode, calculate based on actual column widths
      const periodColumnWidth = 112;
      const gwpGepColumns = 2; // GWP and GEP
      const claimsTypeCount = (portfolioStore.parameters?.claims_nature as string[])?.length || 2;
      const baseClaimsColumns = 1; // Each claims type shows 1 column (collapsed)
      const totalUltimateColumns = 6; // Paid, O/S, Incurred, IBNR, Unearned (if Written), Ultimate
      const hasUnearned = dashboardStore.underwriting_loss_ratios === 'Written' && dashboardStore.dashboards.uw_acc === 'uw';
      const ultimateColumns = hasUnearned ? totalUltimateColumns : totalUltimateColumns - 1;
      
      const calculatedWidth = periodColumnWidth + 
                             (gwpGepColumns * 112) + 
                             (claimsTypeCount * baseClaimsColumns * 112) + 
                             (ultimateColumns * 112);
      
      naturalWidth.value = calculatedWidth + 20; // Add padding
    } else {
      let measuredWidth = tableEl.value.scrollWidth || tableEl.value.offsetWidth || 1200;

      try {
        const tableRect = (tableEl.value as HTMLElement).getBoundingClientRect();
        const absCells = (tableEl.value as HTMLElement).querySelectorAll('.fixWidth');
        let maxRight = 0;
        absCells.forEach((node) => {
          const rect = (node as HTMLElement).getBoundingClientRect();
          const right = rect.right - tableRect.left;
          if (right > maxRight) maxRight = right;
        });
        if (maxRight > measuredWidth) {
          measuredWidth = maxRight + 20; 
        }
      } catch {}

      naturalWidth.value = measuredWidth;
    }

    const thead = (tableEl.value as HTMLTableElement).tHead as HTMLElement | null;
    const headerHeight = thead ? thead.offsetHeight : 40;
    const rows = tableEl.value.querySelectorAll('tbody tr');
    let rowHeight = 20;
    for (let i = 0; i < rows.length; i++) {
      const h = (rows[i] as HTMLElement).offsetHeight;
      if (h) { rowHeight = h; break; }
    }
    const rowsHeight = rows.length * rowHeight;
    // Add a few pixels of safety to avoid cutting off the last row
    const safetyPad = 6;
    naturalHeight.value = Math.max(headerHeight + rowsHeight, tableEl.value.scrollHeight || 0) + safetyPad;
  }
}

onMounted(async () => {
  await nextTick();
  updateNaturalSize();
  
  if (props.attritionalOnly || props.largeOnly || props.weatherOnly || props.totalUltimateOnly) {
    setTimeout(() => {
      updateNaturalSize();
    }, 100);
  }
  
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => updateNaturalSize());
    if (tableEl.value) resizeObserver.observe(tableEl.value);
    containerObserver = new ResizeObserver(() => {
      if (containerEl.value) {
        containerWidthPx.value = containerEl.value.clientWidth;
        containerHeightPx.value = containerEl.value.clientHeight;
      }
      updateNaturalSize();
    });
    if (containerEl.value) containerObserver.observe(containerEl.value);
  }
  window.addEventListener('resize', updateNaturalSize);
  if (containerEl.value) {
    containerWidthPx.value = containerEl.value.clientWidth;
    containerHeightPx.value = containerEl.value.clientHeight;
  }
});

onBeforeUnmount(() => {
  if (resizeObserver && tableEl.value) resizeObserver.unobserve(tableEl.value);
  if (containerObserver && containerEl.value) containerObserver.unobserve(containerEl.value);
  window.removeEventListener('resize', updateNaturalSize);
});

const FUDGE_X = 0.995;
const FUDGE_Y = 0.995;
const scaleX = computed(() => {
  const cw = containerWidthPx.value || props.containerWidth || 1;
  return (cw / Math.max(naturalWidth.value, 1)) * FUDGE_X;
});
const scaleY = computed(() => {
  const ch = containerHeightPx.value || props.containerHeight || 1;
  return (ch / Math.max(naturalHeight.value, 1)) * FUDGE_Y;
});

const isScaledDown = computed(() => Math.min(scaleX.value, scaleY.value) < 1);

const scaledFontSize = computed(() => 12);

const scaledPadding = computed(() => 6);
const totalMarginCCR = ref(0);
const dashboardData = computed<DashboardData>(() => {
  const data = dashboardStore.dashboard_data;
  return data;
});

const totalDashboardData = computed<DashboardData>(() => {
  const obj: any = {};
  obj[0] = dashboardStore.totalData || {};
  return obj;
});


function binderChange() {
  emit('binderChange');
}

function onChangeCcrMargin(e: number) {
  totalMarginCCR.value = e;
}
function onChangeTotalMargin(e: number) {
  dashboardStore.updateTotalMargin(e);
}

function onChangeShowColumnTotal(e: boolean) {
  dashboardStore.updateShowColumnTotal(e);
}

function onChangeShowColumn(e: { val: boolean; item: string }) {
  dashboardStore.updateShowColumn(e.item, e.val);
}

function onChangeMargin(e: { val: number; item: string }) {
  dashboardStore.updateMargin(e.item, e.val);
}

function toggleIsQuarterSubTotal() {
  dashboardStore.toggleQuarterSubTotal();
}
function toggleIsQuarterSubTotalUp() {
  dashboardStore.toggleQuarterSubTotalUp();
}
function toggleIsBinderSubTotal() {
  dashboardStore.toggleBinderSubTotal();
}
function toggleIsBinderSubTotalUp() {
  dashboardStore.toggleBinderSubTotalUp();
}
function toggleIsYearSubTotal() {
  dashboardStore.toggleYearSubTotal();
}
function toggleIsYearSubTotalUp() {
  dashboardStore.toggleYearSubTotalUp();
}

function toggleIsExposure() {
  dashboardStore.isShowingExposure = !dashboardStore.isShowingExposure;
}
</script>
<template>
  <div>
    <div 
      class="table-panel relative shadow-md" 
      :style="{
        overflow: 'hidden',
        width: props.containerWidth ? props.containerWidth + 'px' : '100%',
        height: props.containerHeight ? props.containerHeight + 'px' : 'auto'
      }"
      ref="containerEl"
    >
      <div 
        :style="{
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left',
          width: naturalWidth + 'px',
          height: naturalHeight + 'px'
        }"
      >
      <table 
        data-testid="performance-table" 
        id="performance_table" 
        class="shadow bg-white" 
        ref="tableEl"
        :style="{
          borderSpacing: 0,
          fontSize: scaledFontSize + 'px',
          tableLayout: 'auto'
        }"
      >
        <thead :class="['header-teal', isScaledDown ? '' : 'sticky top-0 z-30']">
          <tr>
            <DashboardHeader
              :total-margin-ccr="totalMarginCCR"
              :total-margin="filteredTotalMargin"
              :margin="filteredMargin"
              :left-column-size="filteredLeftColumnSize"
              :visible-columns="filteredMainColumns"
              :hide-totals="hideTotals"
              :claims-type="filteredClaimsType"
              :total-ultimate-only="props.totalUltimateOnly"
              @on-change-ccr-margin="onChangeCcrMargin"
            />
          </tr>
          <tr>
            <UltimatesHeader
              :margin="filteredMargin"
              :total-margin="filteredTotalMargin"
              :show-column-total="filteredShowColumnTotal"
              :show-column="filteredShowColumn"
              :left-column-size="filteredLeftColumnSize"
              :claims-type="filteredClaimsType"
              :visible-columns="filteredVisibleColumns"
              :hide-totals="hideTotals"
              @on-change-total-margin="onChangeTotalMargin"
              @on-change-margin="onChangeMargin"
              @on-change-show-column="onChangeShowColumn"
              @on-change-show-column-total="onChangeShowColumnTotal"
            />
          </tr>
        </thead>
        <tbody v-if="dashboardData && dashboardStore.totalData && Object.keys(dashboardData).length > 0">
          <template v-for="(n, idx) in dashboardData" :key="idx">
            <tr>
              <ValueRow
                :row-index="parseInt(idx.toString())"
                :margin="filteredMargin"
                :show-column="filteredShowColumn"
                :claims-type="filteredClaimsType"
                :visible-columns="filteredVisibleColumns"
                :hide-totals="hideTotals"
                :show-column-total="filteredShowColumnTotal"
                :total-margin="filteredTotalMargin"
                :left-column-size="filteredLeftColumnSize"
                :total-margin-ccr="totalMarginCCR"
                :dashboard-data="dashboardData"
                :is-total="false"
                :is-total-row="false"
                row-class=""
                :mqy="mqy"
              />
            </tr>
            <tr
              v-if="
                binderDashboardData[idx] &&
                isBinderSubTotal &&
                isBinderSubTotalUp &&
                mqy == 'month' &&
                dashboardStore.dashboards.uw_acc == 'uw'
              "
            >
              <ValueRow
                :row-index="parseInt(idx.toString())"
                :margin="filteredMargin"
                :show-column="filteredShowColumn"
                :claims-type="filteredClaimsType"
                :visible-columns="filteredVisibleColumns"
                :hide-totals="hideTotals"
                :show-column-total="filteredShowColumnTotal"
                :total-margin="filteredTotalMargin"
                :left-column-size="filteredLeftColumnSize"
                :total-margin-ccr="totalMarginCCR"
                :dashboard-data="binderDashboardData"
                :is-total="true"
                :is-total-row="false"
                row-class="total-teal"
                mqy="year"
              />
            </tr>
            <tr v-if="quarterDashboardData[idx] && isQuarterSubTotal && isQuarterSubTotalUp && mqy == 'month'">
              <ValueRow
                :row-index="parseInt(idx.toString())"
                :margin="filteredMargin"
                :show-column="filteredShowColumn"
                :claims-type="filteredClaimsType"
                :visible-columns="filteredVisibleColumns"
                :hide-totals="hideTotals"
                :show-column-total="filteredShowColumnTotal"
                :total-margin="filteredTotalMargin"
                :left-column-size="filteredLeftColumnSize"
                :total-margin-ccr="totalMarginCCR"
                :dashboard-data="quarterDashboardData"
                :is-total="true"
                :is-total-row="false"
                row-class="total-teal-quarter"
                mqy="quarter"
              />
            </tr>
            <tr v-if="yearDashboardData[idx] && isYearSubTotal && isYearSubTotalUp && mqy != 'year'">
              <ValueRow
                :row-index="parseInt(idx.toString())"
                :margin="filteredMargin"
                :show-column="filteredShowColumn"
                :claims-type="filteredClaimsType"
                :visible-columns="filteredVisibleColumns"
                :hide-totals="hideTotals"
                :show-column-total="filteredShowColumnTotal"
                :total-margin="filteredTotalMargin"
                :left-column-size="filteredLeftColumnSize"
                :total-margin-ccr="totalMarginCCR"
                :dashboard-data="yearDashboardData"
                :is-total="true"
                :is-total-row="false"
                row-class="total-teal"
                mqy="year"
              />
            </tr>
          </template>
          <template v-if="isQuarterSubTotal && !isQuarterSubTotalUp && mqy == 'month'">
            <tr v-for="(n, idx) in quarterDashboardData" :key="idx">
              <ValueRow
                :row-index="parseInt(idx.toString())"
                :margin="filteredMargin"
                :show-column="filteredShowColumn"
                :claims-type="filteredClaimsType"
                :visible-columns="filteredVisibleColumns"
                :hide-totals="hideTotals"
                :show-column-total="filteredShowColumnTotal"
                :total-margin="filteredTotalMargin"
                :left-column-size="filteredLeftColumnSize"
                :total-margin-ccr="totalMarginCCR"
                :dashboard-data="quarterDashboardData"
                :is-total="true"
                :is-total-row="false"
                row-class="total-teal-quarter"
                mqy="quarter"
              />
            </tr>
          </template>
          <template
            v-if="isBinderSubTotal && !isBinderSubTotalUp && mqy == 'month' && dashboardStore.dashboards.uw_acc == 'uw'"
          >
            <tr v-for="(n, idx) in binderDashboardData" :key="idx">
              <ValueRow
                :row-index="parseInt(idx.toString())"
                :margin="filteredMargin"
                :show-column="filteredShowColumn"
                :claims-type="filteredClaimsType"
                :visible-columns="filteredVisibleColumns"
                :hide-totals="hideTotals"
                :show-column-total="filteredShowColumnTotal"
                :total-margin="filteredTotalMargin"
                :left-column-size="filteredLeftColumnSize"
                :total-margin-ccr="totalMarginCCR"
                :dashboard-data="binderDashboardData"
                :is-total="true"
                :is-total-row="false"
                row-class="total-teal"
                :mqy="mqy"
              />
            </tr>
          </template>
          <template v-if="isYearSubTotal && !isYearSubTotalUp && mqy != 'year'">
            <tr v-for="(n, idx) in yearDashboardData" :key="idx">
              <ValueRow
                :row-index="parseInt(idx.toString())"
                :margin="filteredMargin"
                :show-column="filteredShowColumn"
                :claims-type="filteredClaimsType"
                :visible-columns="filteredVisibleColumns"
                :hide-totals="hideTotals"
                :show-column-total="filteredShowColumnTotal"
                :total-margin="filteredTotalMargin"
                :left-column-size="filteredLeftColumnSize"
                :total-margin-ccr="totalMarginCCR"
                :dashboard-data="yearDashboardData"
                :is-total="true"
                :is-total-row="false"
                row-class="total-teal"
                mqy="year"
              />
            </tr>
          </template>
          <tr :class="['bg-gray-300', 'total-row', isScaledDown ? '' : 'sticky z-30 bottom-0']">
            <ValueRow
              :row-index="0"
              :margin="filteredMargin"
              :show-column="filteredShowColumn"
              :claims-type="filteredClaimsType"
              :visible-columns="filteredVisibleColumns"
              :hide-totals="hideTotals"
              :show-column-total="filteredShowColumnTotal"
              :total-margin="filteredTotalMargin"
              :left-column-size="filteredLeftColumnSize"
              :total-margin-ccr="totalMarginCCR"
              :dashboard-data="totalDashboardData"
              :is-total="true"
              :is-total-row="true"
              row-class="header-teal"
              :mqy="mqy"
            />
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="10" style="text-align: center; padding: 20px;">
              {{ !dashboardData ? 'No dashboard data' : !dashboardStore.totalData ? 'No total data' : 'No data rows' }}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>
