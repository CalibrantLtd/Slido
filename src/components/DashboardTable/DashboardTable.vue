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
const showColumnTotal = computed(() => dashboardStore.showColumnTotal);
const totalMargin = computed(() => dashboardStore.totalMargin);
const showColumn = computed(() => dashboardStore.showColumn);
const margin = computed(() => dashboardStore.margin);

const leftColumnSize = computed(
  () => 3 + (dashboardStore.isShowingExposure ? portfolioStore.getExposureLength() + 1 : 0)
);

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
    naturalWidth.value = tableEl.value.scrollWidth || tableEl.value.offsetWidth || 1200;
    const thead = (tableEl.value as HTMLTableElement).tHead as HTMLElement | null;
    const headerHeight = thead ? thead.offsetHeight : 40;
    const rows = tableEl.value.querySelectorAll('tbody tr');
    let rowHeight = 20;
    for (let i = 0; i < rows.length; i++) {
      const h = (rows[i] as HTMLElement).offsetHeight;
      if (h) { rowHeight = h; break; }
    }
    const rowsHeight = rows.length * rowHeight;
    naturalHeight.value = Math.max(headerHeight + rowsHeight, tableEl.value.scrollHeight || 0);
  }
}

onMounted(async () => {
  await nextTick();
  updateNaturalSize();
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

const FUDGE = 0.995; 
const scaleX = computed(() => {
  const cw = containerWidthPx.value || props.containerWidth || 1;
  return (cw / Math.max(naturalWidth.value, 1)) * FUDGE;
});
const scaleY = computed(() => {
  const ch = containerHeightPx.value || props.containerHeight || 1;
  return (ch / Math.max(naturalHeight.value, 1)) * FUDGE;
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
              :total-margin="totalMargin"
              :margin="margin"
              :left-column-size="leftColumnSize"
              @on-change-ccr-margin="onChangeCcrMargin"
            />
          </tr>
          <tr>
            <UltimatesHeader
              :margin="margin"
              :total-margin="totalMargin"
              :show-column-total="showColumnTotal"
              :show-column="showColumn"
              :left-column-size="leftColumnSize"
              @on-change-total-margin="onChangeTotalMargin"
              @on-change-margin="onChangeMargin"
              @on-change-show-column="onChangeShowColumn"
              @on-change-show-column-total="onChangeShowColumnTotal"
            />
          </tr>
        </thead>
        <tbody v-if="dashboardData && dashboardStore.totalData">
          <template v-for="(n, idx) in dashboardData" :key="idx">
            <tr>
              <ValueRow
                :row-index="parseInt(idx.toString())"
                :margin="margin"
                :show-column="showColumn"
                :show-column-total="showColumnTotal"
                :total-margin="totalMargin"
                :left-column-size="leftColumnSize"
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
                :margin="margin"
                :show-column="showColumn"
                :show-column-total="showColumnTotal"
                :total-margin="totalMargin"
                :left-column-size="leftColumnSize"
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
                :margin="margin"
                :show-column="showColumn"
                :show-column-total="showColumnTotal"
                :total-margin="totalMargin"
                :left-column-size="leftColumnSize"
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
                :margin="margin"
                :show-column="showColumn"
                :show-column-total="showColumnTotal"
                :total-margin="totalMargin"
                :left-column-size="leftColumnSize"
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
                :margin="margin"
                :show-column="showColumn"
                :show-column-total="showColumnTotal"
                :total-margin="totalMargin"
                :left-column-size="leftColumnSize"
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
                :margin="margin"
                :show-column="showColumn"
                :show-column-total="showColumnTotal"
                :total-margin="totalMargin"
                :left-column-size="leftColumnSize"
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
                :margin="margin"
                :show-column="showColumn"
                :show-column-total="showColumnTotal"
                :total-margin="totalMargin"
                :left-column-size="leftColumnSize"
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
              :margin="margin"
              :show-column="showColumn"
              :show-column-total="showColumnTotal"
              :total-margin="totalMargin"
              :left-column-size="leftColumnSize"
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
          <tr v-for="i in Array(50).fill('')" :key="i">
            <td v-for="j in Array(20).fill('')" :key="i * j">
              <div class="skeleton-placeholder" style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 4px;"></div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  </div>
</template>
