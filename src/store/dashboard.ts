import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { SlidoAuthService } from '@/utils/auth';
import { api } from '@/services/api';
import moment from 'moment';

interface DashboardData {
  [key: string]: any;
}

interface PortfolioData {
  portfolioId: string;
  portfolioName: string;
  bounceId: string;
  bounceName: string;
  bounceDate: string;
  bounceFullName: string;
  timestamp: number;
  currentMonth?: string;
  selectedLineSize?: string;
  uwAcc?: string;
  includeProjections?: boolean;
  yearsOfProjections?: number;
  isAve?: boolean;
  claimsNature?: string[];
  filterOptions?: { [key: string]: string[] };
  normaliseSelection?: { [key: string]: boolean };
}

export const useDashboardStore = defineStore('slido-dashboard', () => {
  const isLoaded = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const monthly_dashboard_data = ref<any[]>([]);
  const dashboard_data_column = ref<any>({});
  const dashboard_data = ref<DashboardData>({});
  const totalData = ref<any>(null);
  
  const yearly_dashboard_data = ref<DashboardData>({});
  const quarterly_dashboard_data = ref<DashboardData>({});
  const binder_dashboard_data = ref<DashboardData>({});
  const isBindedYears = ref(false);

  const currentPortfolio = ref<PortfolioData | null>(null);
  
  const selectedData = ref({});
  const dataFilters = ref({});
  const dateFilters = ref({});
  const isCreateNewBandsOnDashboardModal = ref(false);

  const visibleColumns = ref<number[]>([1, 2, 3, 4, 5]);
  
  const showColumn = ref<{ [key: string]: boolean }>({});
  const margin = ref<{ [key: string]: number }>({});
  const showColumnTotal = ref(false);
  const totalMargin = ref(0);
  
  const claimsType = computed<string[]>(() => currentPortfolio.value?.claimsNature || ['ATTRITIONAL', 'LARGE']);
  
  const availableFilters = ref<{ [key: string]: string[] }>({});
  const selectedFilters = ref<{ [key: string]: string[] }>({});
  const filterAccidentUnderwriting = ref<'uw' | 'acc'>('uw');
  const filterPeriod = ref<'month' | 'quarter' | 'year'>('quarter');
  
  const ccrNlr = ref<'CCR' | 'NLR'>('CCR');
  
  const dashboards = ref({
    mqy: 'quarter' as 'month' | 'quarter' | 'year',
    uw_acc: 'uw' as 'uw' | 'acc',
    ccr_nlr: 'CCR' as 'CCR' | 'NLR',
    gwpnwp: 'GWP' as 'GWP' | 'NWP',
    ratio_amount: 'ratio' as 'ratio' | 'amount',
    seasonFactor: false
  });
  
  const underwriting_loss_ratios = ref<'Written' | 'Earned'>('Written');
  const isShowingExposure = ref(false);
  const offMarginGWPGEP = ref(0);
  const offMarginAprioriCCR = ref(0);
  const normalise = ref<boolean[]>([false, true, true]);
  const seasonality_parameters = ref<number[][]>([]);
  
  const isYearSubTotal = ref(false);
  const isYearSubTotalUp = ref(false);
  const isQuarterSubTotal = ref(false);
  const isQuarterSubTotalUp = ref(false);
  const isBinderSubTotal = ref(false);
  const isBinderSubTotalUp = ref(false);
  
  const dashboardForwardLookings = ref<[number, number][]>([]);
  
  const availableFiltersComputed = computed(() => {
    const result: { [key: string]: string[] } = {};
    for (const [category, options] of Object.entries(availableFilters.value)) {
      if (Array.isArray(options)) {
        result[category] = options;
      } else if (typeof options === 'object' && options !== null) {
        result[category] = Object.values(options);
      } else {
        result[category] = [];
      }
    }
    return result;
  });
  
  const selectedFiltersComputed = computed(() => {
    const result: { [key: string]: string[] } = {};
    for (const [category, options] of Object.entries(selectedFilters.value)) {
      if (Array.isArray(options)) {
        result[category] = options;
      } else if (typeof options === 'object' && options !== null) {
        result[category] = Object.values(options);
      } else {
        result[category] = [];
      }
    }
    return result;
  });
  
  watch(currentPortfolio, (newPortfolio: PortfolioData | null) => {
    if (newPortfolio?.filterOptions) {
      const convertedAvailableFilters: { [key: string]: string[] } = {};
      const convertedSelectedFilters: { [key: string]: string[] } = {};
      
      for (const [category, options] of Object.entries(newPortfolio.filterOptions)) {
        if (typeof options === 'object' && options !== null) {
          const optionsArray = Object.values(options);
          convertedAvailableFilters[category] = optionsArray;
          convertedSelectedFilters[category] = selectedFilters.value[category] || [...optionsArray];
        } else if (Array.isArray(options)) {
          convertedAvailableFilters[category] = options;
          convertedSelectedFilters[category] = selectedFilters.value[category] || [...options];
        }
      }
      
      availableFilters.value = convertedAvailableFilters;
      selectedFilters.value = convertedSelectedFilters;
    } else {
      availableFilters.value = {};
      selectedFilters.value = {};
    }
  }, { immediate: true });

  watch(filterPeriod, (newPeriod, oldPeriod) => {
    if (isLoaded.value && monthly_dashboard_data.value.length > 0) {
      transformDataToDate();
    }
  });

  watch(() => dashboards.value.mqy, (newMqy, oldMqy) => {
    if (filterPeriod.value !== newMqy) {
      filterPeriod.value = newMqy;
    }
  }, { immediate: true });

  watch(selectedFiltersComputed, (newFilters, oldFilters) => {
    if (isLoaded.value && currentPortfolio.value) {
      loadDashboard(currentPortfolio.value);
    }
  }, { deep: true });

  const dashboardData = computed<DashboardData>(() => dashboard_data.value);
  const totalDashboardData = computed<DashboardData>(() => {
    const obj: DashboardData = {};
    obj[0] = totalData.value;
    return obj;
  });
  
  function getCurrentPortfolioFromStorage(): PortfolioData | null {
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('slido_current_portfolio='))
        ?.split('=')[1];
      
      if (cookieValue) {
        const decoded = decodeURIComponent(cookieValue);
        const parsed = JSON.parse(decoded);
        return parsed;
      }
      
      const portfolioData = localStorage.getItem('slido_current_portfolio');
      
      if (!portfolioData) {
        return null;
      }
      
      const parsed = JSON.parse(portfolioData);
      return parsed;
    } catch (error) {
      return null;
    }
  }

  async function loadDashboard(portfolioData: PortfolioData) {
    if (!portfolioData) {
      throw new Error('No portfolio data provided');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const authToken = SlidoAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      const [underwriting_filters, accident_filters] = convertFiltersToApiFormat();

      const requestBody = {
        bounce_id: portfolioData.bounceId,
        accident_underwriting: { uw: 1, acc: 0 }[filterAccidentUnderwriting.value],
        accident_month_filter: accident_filters,
        include_projections: portfolioData.includeProjections ?? true,
        underwriting_month_filter: underwriting_filters,
        filters_hierarchy: getFiltersHierarchy(),
        normalised_CCR: ['ATTRITIONAL', 'LARGE'],
        report_date: portfolioData.currentMonth || "2024-02-01",
        years_of_projections: portfolioData.isAve ? 0 : (portfolioData.yearsOfProjections || 0),
        claim_category: 0,
        selectedLineSize: portfolioData.selectedLineSize || "100% Share"
      };

      const response = await api.post('claims/claims-dashboard-table', requestBody);
      const res = response.data;

      monthly_dashboard_data.value = res.data[0].data;
      dashboard_data_column.value = res.data[0].column;

      let p_data = JSON.parse(res.data[1]);

      filterPeriod.value = dashboards.value.mqy;

      transformDataToDate();

      currentPortfolio.value = portfolioData;

      isLoaded.value = true;

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function transformDataToDate() {
    if (!monthly_dashboard_data.value || monthly_dashboard_data.value.length === 0) {
      return;
    }

    let sliced_dashboard_data = monthly_dashboard_data.value;

    yearly_dashboard_data.value = convertToPeriod('year', sliced_dashboard_data);
    binder_dashboard_data.value = convertToPeriod('binder', sliced_dashboard_data);
    quarterly_dashboard_data.value = convertToPeriod('quarter', sliced_dashboard_data);
    totalData.value = calculateTotal(sliced_dashboard_data, 'Total', 'Total');

    dashboard_data.value = sliced_dashboard_data;
    
    if (filterPeriod.value == 'quarter') {
      dashboard_data.value = quarterly_dashboard_data.value;
    } else if (filterPeriod.value == 'year') {
      if (isBindedYears.value) {
        dashboard_data.value = binder_dashboard_data.value;
      } else {
        dashboard_data.value = yearly_dashboard_data.value;
      }
    }
    
    if (monthly_dashboard_data.value.length > 0) {
      const totalRow = monthly_dashboard_data.value[0].map((_: any, colIndex: number) => {
        if (colIndex === 0) return 'Total';
        if (colIndex === 1) return 'Total';
        
        let sum = 0;
        Object.values(dashboard_data.value).forEach((row: any) => {
          if (row && row[colIndex] !== undefined && !isNaN(row[colIndex])) {
            sum += row[colIndex];
          }
        });
        return sum;
      });
      totalData.value = totalRow;
    } else {
      totalData.value = null;
    }
  }

  function clearData() {
    monthly_dashboard_data.value = [];
    dashboard_data_column.value = {};
    dashboard_data.value = {};
    totalData.value = null;
    currentPortfolio.value = null;
    isLoaded.value = false;
    error.value = null;
  }
  
  function setFilterSelection(category: string, selections: string[]) {
    if (Array.isArray(selections)) {
      selectedFilters.value[category] = selections;
    } else {
      selectedFilters.value[category] = [];
    }
  }
  
  function getFiltersHierarchy() {
    const temp_hierarchy: { [key: string]: number[] } = {};
    
    for (const category of Object.keys(selectedFiltersComputed.value)) {
      const selections = selectedFiltersComputed.value[category];
      if (selections && selections.length > 0) {
        const availableOptions = availableFiltersComputed.value[category] || [];
        const numericSelections = selections.map(selection => {
          const index = availableOptions.indexOf(selection);
          return index >= 0 ? index : 0;
        });
        temp_hierarchy[category] = numericSelections;
      } else {
        const availableOptions = availableFiltersComputed.value[category] || [];
        temp_hierarchy[category] = availableOptions.map((_, index) => index);
      }
    }
    
    return temp_hierarchy;
  }
  
  function setAccidentUnderwriting(mode: 'uw' | 'acc') {
    filterAccidentUnderwriting.value = mode;
    
    if (currentPortfolio.value) {
      loadDashboard(currentPortfolio.value);
    }
  }
  
  function setPeriod(period: 'month' | 'quarter' | 'year') {
    filterPeriod.value = period;
    
    if (monthly_dashboard_data.value && monthly_dashboard_data.value.length > 0) {
      transformDataToDate();
    }
  }
  
  function setPortfolioData(portfolioData: PortfolioData | null) {
    currentPortfolio.value = portfolioData;
  }

  function convertFiltersToApiFormat() {
    let underwriting_filters: any = [];
    let accident_filters: any = [];
    return [underwriting_filters, accident_filters];
  }

  function getBinders(data: any[]): string[] {
    return [];
  }

  function convertToPeriod(period: string, data: any[]): { [key: number]: any[] } {
    let format = 'YYYY';
    if (period === 'quarter') {
      format = '[Q]Q-YYYY';
    }
    
    const periods: string[] = [];
    
    if (period === 'binder') {
      periods.push(...getBinders(data.map((x) => x[0])));
      if (periods.length === 0) {
        for (const i in data) {
          periods.push(moment(data[i][dashboard_data_column.value['months.MONTH']], 'MMM-YYYY').format(format));
        }
      }
    } else {
      for (const i in data) {
        periods.push(moment(data[i][dashboard_data_column.value['months.MONTH']], 'MMM-YYYY').format(format));
      }
    }
    
    const sections = [];
    let start = 0;

    for (let i = 1; i <= periods.length; i++) {
      if (i === periods.length || periods[i] !== periods[i - 1]) {
        sections.push({ value: periods[start], start, end: i - 1 });
        start = i;
      }
    }

    const result: { [key: number]: any[] } = {};
    
    sections.forEach((p, i) => {
      const startIndex = p['start'];
      const endIndex = p['end'] + 1;
      let newRowData = data.slice(startIndex, endIndex);
      
      result[endIndex - 1] = calculateTotal(newRowData, p['value'], data[endIndex - 1][0]);
    });
    
    return result;
  }

  function calculateTotal(data: any, date: string, month: string) {
    let totals = new Array(Object.keys(dashboard_data_column.value).length).fill(0);

    const exposureIndex = {};

    totals[0] = date;
    totals[1] = month;

    const averageColumns = Object.keys(dashboard_data_column.value).filter((x) => x.includes('uw_data.exposure.avg'));

    let numberOfRows = 0;
    data.forEach((row: any) => {
      numberOfRows++;
      row.forEach((value: any, columnIndex: number) => {
        if (columnIndex in exposureIndex) {
        } else if (typeof value === 'number') {
          totals[columnIndex] = (totals[columnIndex] || 0) + value;
        }
      });
    });

    let seasonalityColumns = Object.keys(dashboard_data_column.value).filter((x) => x.includes('_seasonality'));
    for (let i in seasonalityColumns) {
      totals[dashboard_data_column.value[seasonalityColumns[i]]] =
        totals[dashboard_data_column.value[seasonalityColumns[i]]] / numberOfRows;
    }
    
    return totals;
  }

  function changeccrnlr() {
    if (dashboards.value.ccr_nlr === 'CCR') {
      dashboards.value.ccr_nlr = 'NLR';
    } else {
      dashboards.value.ccr_nlr = 'CCR';
    }
  }

  function setVisibleColumns(columns: number[]) {
    visibleColumns.value = columns;
  }

  function setColumnState(columnState: {
    showColumn: { [key: string]: boolean };
    margin: { [key: string]: number };
    showColumnTotal: boolean;
    totalMargin: number;
  }) {
    Object.assign(showColumn.value, columnState.showColumn);
    Object.assign(margin.value, columnState.margin);
    showColumnTotal.value = columnState.showColumnTotal;
    totalMargin.value = columnState.totalMargin;
  }

  function updateShowColumn(item: string, val: boolean) {
    showColumn.value[item] = val;
  }

  function updateMargin(item: string, val: number) {
    margin.value[item] = val;
  }

  function updateShowColumnTotal(val: boolean) {
    showColumnTotal.value = val;
  }

  function updateTotalMargin(val: number) {
    totalMargin.value = val;
  }

  return {
    isLoaded,
    isLoading,
    error,
    
    monthly_dashboard_data,
    dashboard_data_column,
    dashboard_data,
    totalData,
    currentPortfolio,
    
    yearly_dashboard_data,
    quarterly_dashboard_data,
    binder_dashboard_data,
    isBindedYears,
    
    dashboardData,
    totalDashboardData,
    
    getCurrentPortfolioFromStorage,
    loadDashboard,
    transformDataToDate,
    clearData,
    
    visibleColumns,
    showColumn,
    margin,
    showColumnTotal,
    totalMargin,
    
    claimsType,
    
    availableFilters: availableFiltersComputed,
    selectedFilters: selectedFiltersComputed,
    filterAccidentUnderwriting,
    filterPeriod,
    
    ccrNlr,
    changeccrnlr,
    
    setVisibleColumns,
    setColumnState,
    updateShowColumn,
    updateMargin,
    updateShowColumnTotal,
    updateTotalMargin,
    
    setFilterSelection,
    getFiltersHierarchy,
    setAccidentUnderwriting,
    setPeriod,
    convertFiltersToApiFormat,
    
    setPortfolioData,
    
    dashboards,
    underwriting_loss_ratios,
    isShowingExposure,
    offMarginGWPGEP,
    offMarginAprioriCCR,
    normalise,
    seasonality_parameters,
    isYearSubTotal,
    isYearSubTotalUp,
    isQuarterSubTotal,
    isQuarterSubTotalUp,
    isBinderSubTotal,
    isBinderSubTotalUp,
    dashboardForwardLookings,
    
    changeSeas: () => { dashboards.value.seasonFactor = !dashboards.value.seasonFactor; },
    switch_ratio_amount: () => { dashboards.value.ratio_amount = dashboards.value.ratio_amount === 'ratio' ? 'amount' : 'ratio'; },
    change_uw_acc: () => { 
      const newMode = dashboards.value.uw_acc === 'uw' ? 'acc' : 'uw';
      dashboards.value.uw_acc = newMode;
      setAccidentUnderwriting(newMode);
    },
    
    syncPeriods: () => {
      if (filterPeriod.value !== dashboards.value.mqy) {
        filterPeriod.value = dashboards.value.mqy;
      }
    },
    change_mqy: () => { 
      const mqyOrder = ['month', 'quarter', 'year'];
      const currentIndex = mqyOrder.indexOf(dashboards.value.mqy);
      const newPeriod = mqyOrder[(currentIndex + 1) % mqyOrder.length] as 'month' | 'quarter' | 'year';
      
      dashboards.value.mqy = newPeriod;
      filterPeriod.value = newPeriod;
    },
    switch_gwpnwp_amount: () => { dashboards.value.gwpnwp = dashboards.value.gwpnwp === 'GWP' ? 'NWP' : 'GWP'; },
    underwritingLossRatiosChange: () => { underwriting_loss_ratios.value = underwriting_loss_ratios.value === 'Written' ? 'Earned' : 'Written'; },
    toggleQuarterSubTotal: () => { isQuarterSubTotal.value = !isQuarterSubTotal.value; },
    toggleQuarterSubTotalUp: () => { isQuarterSubTotalUp.value = !isQuarterSubTotalUp.value; },
    toggleBinderSubTotal: () => { isBinderSubTotal.value = !isBinderSubTotal.value; },
    toggleBinderSubTotalUp: () => { isBinderSubTotalUp.value = !isBinderSubTotalUp.value; },
    toggleYearSubTotal: () => { isYearSubTotal.value = !isYearSubTotal.value; },
    toggleYearSubTotalUp: () => { isYearSubTotalUp.value = !isYearSubTotalUp.value; },
    
    onSetClaimsOthersInformationModal: (show: boolean) => { },
    claimsOthersInformation: async (period: string, type: string, dateUnit: string) => { },
    claimsAttritionalInformation: async (period: string, dateUnit: string, type: string) => { },
    
    selectedData,
    dataFilters,
    dateFilters,
    isCreateNewBandsOnDashboardModal
  };
});