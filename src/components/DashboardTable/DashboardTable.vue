<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute } from 'vue-router';
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
  snapshot?: any;
  attritionalOnly?: boolean;
  largeOnly?: boolean;
  weatherOnly?: boolean;
  totalUltimateOnly?: boolean;
  lossRatiosOnly?: boolean;
  attritionalLargeExpanded?: boolean;
  largeLossLoad?: boolean;
  maxRows?: number;
}>();

const mqy = computed(() => {
  return props.snapshot?.mqy || dashboardStore.dashboards.mqy;
});

const binderDashboardData = computed(() => props.snapshot?.binder_dashboard_data ?? dashboardStore.binder_dashboard_data);
const quarterDashboardData = computed(() => props.snapshot?.quarterly_dashboard_data ?? dashboardStore.quarterly_dashboard_data);
const yearDashboardData = computed(() => props.snapshot?.yearly_dashboard_data ?? dashboardStore.yearly_dashboard_data);

const isYearSubTotal = computed(() => props.snapshot?.isYearSubTotal ?? dashboardStore.isYearSubTotal);
const isYearSubTotalUp = computed(() => props.snapshot?.isYearSubTotalUp ?? dashboardStore.isYearSubTotalUp);
const isQuarterSubTotal = computed(() => props.snapshot?.isQuarterSubTotal ?? dashboardStore.isQuarterSubTotal);
const isQuarterSubTotalUp = computed(() => props.snapshot?.isQuarterSubTotalUp ?? dashboardStore.isQuarterSubTotalUp);
const isBinderSubTotal = computed(() => props.snapshot?.isBinderSubTotal ?? dashboardStore.isBinderSubTotal);
const isBinderSubTotalUp = computed(() => props.snapshot?.isBinderSubTotalUp ?? dashboardStore.isBinderSubTotalUp);
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
const showColumnTotal = computed(() => props.snapshot?.showColumnTotal ?? dashboardStore.showColumnTotal);

const filteredShowColumnTotal = computed(() => {
  if (props.totalUltimateOnly) {
    return true; // Force show total columns
  }
  if (props.lossRatiosOnly) {
    return true; // Force show total columns
  }
  return (props.snapshot?.showColumnTotal ?? dashboardStore.showColumnTotal);
});
const totalMargin = computed(() => props.snapshot?.totalMargin ?? dashboardStore.totalMargin);

const filteredTotalMargin = computed(() => {
  if (props.totalUltimateOnly) {
    return 112; // Force expand total ultimate columns
  }
  if (props.lossRatiosOnly) {
    return 0; // Keep total columns collapsed
  }
  return (props.snapshot?.totalMargin ?? dashboardStore.totalMargin);
});
const showColumn = computed(() => props.snapshot?.showColumn ?? dashboardStore.showColumn);
const margin = computed(() => props.snapshot?.margin ?? dashboardStore.margin);

// Force expansion for specific claims type when in single-claims mode
const filteredMargin = computed(() => {
  if (props.largeLossLoad) {
    const result: any = { ...dashboardStore.margin };
    // Keep all columns collapsed (0) - show Period, GWP, GEP, and Large Ultimate but none expanded
    Object.keys(result).forEach(key => {
      result[key] = 0; // collapsed state
    });
    return result;
  }
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
  if (props.lossRatiosOnly) {
    const result: any = { ...dashboardStore.margin };
    // Keep all claims types collapsed (0) - show Period, GWP, GEP, and all loss ratio columns but none expanded
    Object.keys(result).forEach(key => {
      result[key] = 0; // collapsed state
    });
    return result;
  }
  if (props.attritionalLargeExpanded) {
    const result: any = { ...dashboardStore.margin };
    // Expand only ATTRITIONAL and LARGE columns, keep others collapsed
    Object.keys(result).forEach(key => {
      const upperKey = key.toUpperCase();
      if (upperKey === 'ATTRITIONAL' || upperKey === 'LARGE') {
        result[key] = 112; // expanded state
      } else {
        result[key] = 0; // collapsed state
      }
    });
    return result;
  }
  return (props.snapshot?.margin ?? dashboardStore.margin);
});

const leftColumnSize = computed(
  () => {
    const baseLeftColumns = props.totalUltimateOnly ? 2 : 3; 
    const exposureColumns = (dashboardStore.isShowingExposure && !props.totalUltimateOnly)
      ? portfolioStore.getExposureLength() + 1
      : 0;
    return baseLeftColumns + exposureColumns;
  }
);

const filteredLeftColumnSize = computed(() => 
  (props.attritionalOnly || props.largeOnly || props.weatherOnly) ? 1 : leftColumnSize.value
);

// Filter columns for single-claims mode
const filteredShowColumn = computed(() => {
  if (props.largeLossLoad) {
    const filtered: any = {};
    // Only show LARGE columns and ensure they are collapsed (false)
    Object.keys(dashboardStore.showColumn).forEach(key => {
      if (key.toUpperCase() === 'LARGE' || key === largeKey.value) {
        filtered[key] = false; // Force collapsed state
      }
    });
    // If key wasn't present yet, add by resolved label
    if (!filtered[largeKey.value]) {
      filtered[largeKey.value] = false;
    }
    return filtered;
  }
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
  if (props.lossRatiosOnly) {
    const filtered: any = {};
    // Show all claims types but collapsed (false) - show Period, GWP, GEP, and all loss ratio columns but none expanded
    Object.keys(dashboardStore.showColumn).forEach(key => {
      filtered[key] = false; // Force collapsed state
    });
    return filtered;
  }
  if (props.attritionalLargeExpanded) {
    const filtered: any = {};
    // Show all claims types, but only ATTRITIONAL and LARGE are expanded (true), others collapsed (false)
    Object.keys(dashboardStore.showColumn).forEach(key => {
      const upperKey = key.toUpperCase();
      if (upperKey === 'ATTRITIONAL' || upperKey === 'LARGE') {
        filtered[key] = true; // expanded state
      } else {
        filtered[key] = false; // collapsed state
      }
    });
    return filtered;
  }
  return (props.snapshot?.showColumn ?? dashboardStore.showColumn);
});

const filteredClaimsType = computed(() => {
  if (props.largeLossLoad) {
    return [largeKey.value]; // Only show Large claims type
  }
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
  if (props.lossRatiosOnly) {
    return portfolioStore.parameters.claims_nature || ['ATTRITIONAL', 'LARGE'];
  }
  return portfolioStore.parameters.claims_nature || ['ATTRITIONAL', 'LARGE'];
});

// Filter visible columns for single-claims mode
const filteredVisibleColumns = computed(() => {
  if (props.largeLossLoad) {
    return [1, 2, 3]; // Show GWP, GEP, and enable Large expansion
  }
  if (props.attritionalOnly || props.largeOnly || props.weatherOnly) {
    return [3]; // Enable IBNR and Ultimate sub-columns for the specific claims type
  }
  if (props.totalUltimateOnly) {
    return [2, 3]; // Show GEP and CCR (for total ultimate columns), hide GWP
  }
  if (props.lossRatiosOnly) {
    return [1, 2, 3]; // Show GWP, GEP, and CCR (for all loss ratio columns)
  }
  if (props.attritionalLargeExpanded) {
    return [1, 2, 3]; // Show GWP, GEP, and CCR (for loss ratio columns)
  }
  return (props.snapshot?.visibleColumns ?? dashboardStore.visibleColumns);
});

// Filter main columns for single-claims mode (hide GWP, GEP, Commission, CCR, Seasonality)
const filteredMainColumns = computed(() => {
  if (props.largeLossLoad) {
    return [1, 2]; // Show GWP and GEP columns only
  }
  if (props.attritionalOnly || props.largeOnly || props.weatherOnly) {
    return [];
  }
  if (props.totalUltimateOnly) {
    return [2]; // Show only GEP, hide GWP, Commission, CCR, Seasonality
  }
  if (props.lossRatiosOnly) {
    return [1, 2]; // Show GWP and GEP, hide Commission, CCR, Seasonality
  }
  if (props.attritionalLargeExpanded) {
    return [1, 2]; // Show GWP and GEP, hide Commission, CCR, Seasonality
  }
  return (props.snapshot?.visibleColumns ?? dashboardStore.visibleColumns);
});

const hideTotals = computed(() => !!(props.attritionalOnly || props.largeOnly || props.weatherOnly || props.largeLossLoad));

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
    if (props.largeLossLoad) {
      // For large loss load mode, calculate based on Period, GWP, GEP, and Large Ultimate only
      // Make it slightly smaller to reduce extra space
      const periodColumnWidth = 110; // Period column
      const gwpGepColumns = 2; // GWP and GEP columns  
      const largeColumn = 1; // Large Ultimate column
      
      const calculatedWidth = periodColumnWidth + (gwpGepColumns * 110) + (largeColumn * 110);
      naturalWidth.value = calculatedWidth;
    } else if (props.attritionalOnly || props.largeOnly || props.weatherOnly) {
      const periodColumnWidth = 112;
      const columnWidth = 112; 
      const baseColumns = 5; // Paid, O/S, Incurred, IBNR, Ultimate
      const hasUnearned = (props.snapshot?.underwriting_loss_ratios || dashboardStore.underwriting_loss_ratios) === 'Written' && (props.snapshot?.uw_acc || dashboardStore.dashboards.uw_acc) === 'uw';
      const totalColumns = baseColumns + (hasUnearned ? 1 : 0);
      const calculatedWidth = periodColumnWidth + (totalColumns * columnWidth);
      
      naturalWidth.value = calculatedWidth + 5; 
    } else if (props.totalUltimateOnly) {
      // For total ultimate mode, calculate based on actual column widths
      const periodColumnWidth = 112;
      const gwpGepColumns = 1; // Only GEP 
      const claimsTypeCount = (portfolioStore.parameters?.claims_nature as string[])?.length || 2;
      const baseClaimsColumns = 1; // Each claims type shows 1 column (collapsed)
      const totalUltimateColumns = 6; // Paid, O/S, Incurred, IBNR, Unearned (if Written), Ultimate
      const hasUnearned = (props.snapshot?.underwriting_loss_ratios || dashboardStore.underwriting_loss_ratios) === 'Written' && (props.snapshot?.uw_acc || dashboardStore.dashboards.uw_acc) === 'uw';
      const ultimateColumns = hasUnearned ? totalUltimateColumns : totalUltimateColumns - 1;
      
      const calculatedWidth = periodColumnWidth + 
                             (gwpGepColumns * 112) + 
                             (claimsTypeCount * baseClaimsColumns * 112) + 
                             (ultimateColumns * 112);
      
      naturalWidth.value = calculatedWidth + 20; // Add padding
    } else if (props.lossRatiosOnly) {
      // For loss ratios only mode, measure width up to and including Total column
      try {
        const periodColumnWidth = 112;
        const gwpGepColumns = 2; // GWP and GEP
        const claimsTypeCount = (portfolioStore.parameters?.claims_nature as string[])?.length || 2;
        const baseClaimsColumns = 1; // Each claims type shows 1 column (collapsed)
        const totalColumn = 1; // The Total column itself
        
        const calculatedWidth = periodColumnWidth + (gwpGepColumns * 112) + (claimsTypeCount * baseClaimsColumns * 112) + (totalColumn * 112);
        naturalWidth.value = calculatedWidth;
      } catch {
        naturalWidth.value = tableEl.value.scrollWidth;
      }
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
  
  if (props.attritionalOnly || props.largeOnly || props.weatherOnly || props.totalUltimateOnly || props.lossRatiosOnly || props.largeLossLoad) {
    // Defer sizing until after DOM renders all headers/cells so width measurement is accurate
    setTimeout(() => {
      updateNaturalSize();
    }, 200);
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

const PADDING_Y = 4; // small padding to avoid bottom-edge clipping
const effectiveWidth = computed(() => {
  const cw = containerWidthPx.value || props.containerWidth || 1;
  // Always use natural width; scaling will compress to container as needed
  return naturalWidth.value;
});

const effectiveHeight = computed(() => {
  const ch = containerHeightPx.value || props.containerHeight || 1;
  // Always use natural height; scaling will compress to container as needed
  return naturalHeight.value;
});

const scaleX = computed(() => {
  // Use props.containerWidth as fallback when ResizeObserver hasn't measured yet
  const cw = containerWidthPx.value > 0 ? containerWidthPx.value : (props.containerWidth || 1);
  const availableWidth = cw;
  // Scale to fit container width
  const ratio = availableWidth / Math.max(1, effectiveWidth.value);
  return Math.max(0, Math.min(1, ratio));
});
const scaleY = computed(() => {
  const ch = (containerHeightPx.value || props.containerHeight || 1) - PADDING_Y;
  const ratio = ch / Math.max(1, effectiveHeight.value);
  return Math.max(0, Math.min(1, ratio));
});

const isScaledDown = computed(() => Math.min(scaleX.value, scaleY.value) <= 1);

const scaledFontSize = computed(() => 12);

const scaledPadding = computed(() => 6);
const totalMarginCCR = ref(0);
const dashboardData = computed<DashboardData>(() => {
  return (props.snapshot?.dashboard_data ?? dashboardStore.dashboard_data);
});

const visibleRowIndices = computed(() => {
  const allIndices = Object.keys(dashboardData.value || {});
  
  if (props.maxRows && allIndices.length > props.maxRows) {
    return allIndices.slice(-props.maxRows);
  }
  
  return allIndices;
});

const hasData = computed(() => {
  const totalData = props.snapshot?.totalData ?? dashboardStore.totalData;
  const dashboardDataToCheck = props.snapshot?.dashboard_data ?? dashboardStore.dashboard_data;
  return dashboardDataToCheck && totalData && Object.keys(dashboardDataToCheck).length > 0;
});

// Determine which mock table image to use based on template type
const mockTableImage = computed(() => {
  if (props.attritionalOnly) {
    return '/images/mock-table-attritional.svg';
  }
  if (props.largeOnly) {
    return '/images/mock-table-large.svg';
  }
  if (props.weatherOnly) {
    return '/images/mock-table-weather.svg';
  }
  if (props.totalUltimateOnly) {
    return '/images/mock-table-total.svg';
  }
  if (props.lossRatiosOnly) {
    return '/images/mock-table-loss-ratios.svg';
  }
  if (props.attritionalLargeExpanded) {
    return '/images/mock-table-expanded.svg';
  }
  if (props.largeLossLoad) {
    return '/images/mock-table-large-loss-load.svg';
  }
  return '/images/MockTable.svg';
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
  <div v-if="!hasData" 
    :style="{
      width: '100%',
      height: '100%',
      backgroundImage: `url(${mockTableImage})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center'
    }"
  ></div>
  <div v-else :style="{ width: '100%', height: '100%' }">
    <div 
      class="table-panel relative shadow-md" 
      :style="{
        overflow: 'hidden',
        width: props.containerWidth ? props.containerWidth + 'px' : '100%',
        height: props.containerHeight ? props.containerHeight + 'px' : '100%'
      }"
      ref="containerEl"
    >
      <div 
        :style="{
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left',
          width: effectiveWidth + 'px',
          height: effectiveHeight + 'px'
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
          tableLayout: props.lossRatiosOnly ? 'fixed' : 'auto',
          width: props.lossRatiosOnly ? '100%' : 'auto'
        }"
      >
        <thead :class="['header-teal', isScaledDown ? '' : 'sticky top-0 z-30']">
          <tr>
            <DashboardHeader
              :snapshot="props.snapshot"
              :total-margin-ccr="totalMarginCCR"
              :total-margin="filteredTotalMargin"
              :margin="filteredMargin"
              :left-column-size="filteredLeftColumnSize"
              :visible-columns="filteredMainColumns"
              :hide-totals="hideTotals"
              :claims-type="filteredClaimsType"
              :total-ultimate-only="props.totalUltimateOnly"
              :loss-ratios-only="props.lossRatiosOnly"
              @on-change-ccr-margin="onChangeCcrMargin"
            />
          </tr>
          <tr>
            <UltimatesHeader
              :snapshot="props.snapshot"
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
        <tbody>
          <template v-for="idx in visibleRowIndices" :key="idx">
            <tr>
              <ValueRow
                :snapshot="props.snapshot"
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
                :total-ultimate-only="props.totalUltimateOnly"
              />
            </tr>
            <tr
              v-if="
                binderDashboardData[idx] &&
                isBinderSubTotal &&
                isBinderSubTotalUp &&
                mqy == 'month' &&
                (props.snapshot?.uw_acc || dashboardStore.dashboards.uw_acc) == 'uw'
              "
            >
              <ValueRow
                :snapshot="props.snapshot"
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
                :total-ultimate-only="props.totalUltimateOnly"
              />
            </tr>
            <tr v-if="quarterDashboardData[idx] && isQuarterSubTotal && isQuarterSubTotalUp && mqy == 'month'">
              <ValueRow
                :snapshot="props.snapshot"
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
                :total-ultimate-only="props.totalUltimateOnly"
              />
            </tr>
            <tr v-if="yearDashboardData[idx] && isYearSubTotal && isYearSubTotalUp && mqy != 'year'">
              <ValueRow
                :snapshot="props.snapshot"
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
                :total-ultimate-only="props.totalUltimateOnly"
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
                :total-ultimate-only="props.totalUltimateOnly"
              />
            </tr>
          </template>
          <template
            v-if="isBinderSubTotal && !isBinderSubTotalUp && mqy == 'month' && (props.snapshot?.uw_acc || dashboardStore.dashboards.uw_acc) == 'uw'"
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
                :total-ultimate-only="props.totalUltimateOnly"
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
                :total-ultimate-only="props.totalUltimateOnly"
              />
            </tr>
          </template>
          <tr :class="['bg-gray-300', 'total-row', isScaledDown ? '' : 'sticky z-30 bottom-0']">
            <ValueRow
              :snapshot="props.snapshot"
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
              :total-ultimate-only="props.totalUltimateOnly"
            />
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>
