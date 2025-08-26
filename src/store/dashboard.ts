import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { SlidoAuthService } from '@/utils/auth';
import { api } from '@/services/api';
import moment from 'moment';
import { usePortfolioStore } from './portfolio';
import ClaimsCalculation from '@/calculations/Claims/ClaimsCalculation';
import { targetCCR, targetNLR } from '../calculations/Claims/TargetCalculation';

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
  exposure?: Array<{ name: string; method: string }>;
  normaliseSelection?: boolean[];
  filterOptions?: { [key: string]: string[] };
  parameters?: any;
  uw_month?: any[];
  acc_month?: any[];
}

export const useDashboardStore = defineStore('slido-dashboard', () => {
  const portfolioStore = usePortfolioStore();
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
  //SAME AS IN MAIN
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
  
  const claimsType = computed<string[]>(() => portfolioStore.parameters.claims_nature);
  const normalise: any = computed(() =>
    claimsType.value.slice(1).filter((x, i) => portfolioStore.normaliseSelection[i])
  );

  const data_CommissionColumns: any = ref(null);
  
  const graphConfig = ref({
    isGLR: true,
    isNormalised: true,
  });

  const chart_data = ref<any[]>([]);
  
  const availableFilters = ref<{ [key: string]: string[] }>({});
  const selectedFilters = ref<{ [key: string]: string[] }>({});
  const filterAccidentUnderwriting = ref<'uw' | 'acc'>('uw');
  
  const ccrNlr = ref<'CCR' | 'NLR'>('CCR');
  
  const dashboards = ref({
    uw_acc: 'uw', //accident or underwriting
    mqy: 'quarter', //month_quarter_year
    ratio_amount: 'ratios',
    seasonFactor: false,
    filters: null,
    datefilters: { uw: null, acc: null },
    calendardatefilters: null,
    gwpnwp: 'GWP',
    ccr_nlr: 'CCR',
  });
  
  const underwriting_loss_ratios = ref<'Written' | 'Earned'>('Written');
  const isShowingExposure = ref(false);
  const offMarginGWPGEP = computed(() => {
    let sum = 0;
    if (!visibleColumns.value?.includes(1)) {
      sum += 112;
    }
    if (!visibleColumns.value?.includes(2)) {
      sum += 112;
    }
    return sum;
  });
  
  const offMarginAprioriCCR = computed(() => {
    let sum = offMarginGWPGEP.value;
    if (!visibleColumns.value?.includes(3)) {
      sum += 224;
    }
    if (!visibleColumns.value?.includes(4)) {
      sum += 112;
    }
    return sum;
  });
  const seasonality_parameters = ref<number[][]>([]);
  const large_threshold = ref<any>(null);
  const large_method = ref<any>(null);
  const UWCommissionColumns = ref<string[]>([]);
  const unDataFilters = ref<any>({});
  const unDateFilters = ref<any>({});
  
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

  watch(() => dashboards.value.mqy, (newMqy, oldMqy) => {
    if (isLoaded.value && monthly_dashboard_data.value.length > 0) {
      transformDataToDate();
    }
  });

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
      console.error('Error parsing portfolio data:', error);
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
        normalised_CCR: getNormalisedForApi(portfolioData),
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
      seasonality_parameters.value = p_data.SEASONALITY.map((x: string) => x.split(';').map(Number));
      large_threshold.value = p_data.LARGE_THRESHOLD;
      large_method.value = p_data.LARGE_METHOD;
      UWCommissionColumns.value = Object.keys(dashboard_data_column.value).filter((key: string) => key.includes('uws.COM'));
      data_CommissionColumns.value = Object.keys(dashboard_data_column.value).filter((key: string) =>
        key.includes('uw_data.COM')
      );

      unDataFilters.value = res.data[0].unfilter;
      unDateFilters.value = res.data[0].date_unfilter;
      transformDataToDate();

      // Note: AVE mode not available in Slido yet
      // if (portfolioStore.isAve) {
      //   await dashboard_ave_store.loadDashboard();
      // }

      // Note: forwardLookingWithFilter not available in Slido yet
      // forwardLookingWithFilter(filters_hierarchy);

      currentPortfolio.value = portfolioData;

      isLoaded.value = true;

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  //SAME AS IN MAIN 
  function transformDataToDate() {
    let sliced_dashboard_data = monthly_dashboard_data.value;

    yearly_dashboard_data.value = convertToPeriod('year', sliced_dashboard_data);
    binder_dashboard_data.value = convertToPeriod('binder', sliced_dashboard_data);
    quarterly_dashboard_data.value = convertToPeriod('quarter', sliced_dashboard_data);
    totalData.value = calculateTotal(sliced_dashboard_data, 'Total', 'Total');

    dashboard_data.value = sliced_dashboard_data;
    if (dashboards.value.mqy == 'quarter') {
      dashboard_data.value = quarterly_dashboard_data.value;
    } else if (dashboards.value.mqy == 'year') {
      if (isBindedYears.value) {
        dashboard_data.value = binder_dashboard_data.value;
      } else {
        dashboard_data.value = yearly_dashboard_data.value;
      }
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
    dashboards.value.mqy = period;
    
    if (monthly_dashboard_data.value && monthly_dashboard_data.value.length > 0) {
      transformDataToDate();
    }
  }
  
  function setPortfolioData(portfolioData: PortfolioData | null) {
    currentPortfolio.value = portfolioData;
    
    // Update portfolio store parameters with actual portfolio data
    if (portfolioData) {
      // Create portfolio data structure that matches what onSetPortfolio expects
      const portfolioDataForStore = {
        dictionary: portfolioData.filterOptions || {},
        parameters: {
          claims_nature: portfolioData.claimsNature || ['ATTRITIONAL', 'LARGE'],
          exposure: portfolioData.exposure || [
            { name: 'Total Risk Count', method: 'sum' },
            { name: 'Average GWP', method: 'average' }
          ],
          default_dashboard: {
            accident_underwriting: portfolioData.uwAcc || 'uw',
            cohort: 'quarter'
          },
          ...portfolioData.parameters // Include any other parameters
        },
        uw_month: portfolioData.uw_month || [],
        acc_month: portfolioData.acc_month || []
      };
      
      // Call onSetPortfolio to properly populate normaliseSelection
      portfolioStore.onSetPortfolio(portfolioDataForStore);
      
      // IMPORTANT: Override normaliseSelection with the exact values from the cookie
      // This ensures we use the same normalization settings as the main app
      if (portfolioData.normaliseSelection && portfolioData.claimsNature) {
        // The normaliseSelection array corresponds to claims_nature.slice(1)
        // So if claims_nature = ['ATTRITIONAL', 'LARGE'] and normaliseSelection = [true]
        // It means LARGE is selected, and ATTRITIONAL is not in the array (excluded by slice(1))
        const expectedLength = portfolioData.claimsNature.length - 1; // slice(1) in the computed
        
        if (portfolioData.normaliseSelection.length === expectedLength) {
          portfolioStore.normaliseSelection = [...portfolioData.normaliseSelection];
        } else {
          // Handle the mismatch by padding or truncating the array
          const newNormaliseSelection = Array(expectedLength).fill(false);
          
          // Copy existing values, padding with false if too short, or truncating if too long
          for (let i = 0; i < Math.min(portfolioData.normaliseSelection.length, expectedLength); i++) {
            newNormaliseSelection[i] = portfolioData.normaliseSelection[i];
          }
          
          // If the original array was too short, set all missing items to true
          if (portfolioData.normaliseSelection.length < expectedLength) {
            for (let i = portfolioData.normaliseSelection.length; i < expectedLength; i++) {
              newNormaliseSelection[i] = true;
            }
          }
          
          portfolioStore.normaliseSelection = newNormaliseSelection;
        }
      }
    }
  }

  function getNormalisedForApi(portfolioData: PortfolioData): number[] {
    if (!portfolioData.normaliseSelection || !portfolioData.claimsNature) {
      // Find the index of LARGE in claims_nature, fallback to 1 if not found
      const largeIndex = portfolioData.claimsNature?.indexOf('LARGE') ?? 1;
      return [largeIndex];
    }
    
    const selectedIndexes: number[] = [];
    for (let i = 0; i < portfolioData.normaliseSelection.length; i++) {
      if (portfolioData.normaliseSelection[i]) {
        selectedIndexes.push(i);
      }
    }
    
    if (selectedIndexes.length === 0) {
      const largeIndex = portfolioData.claimsNature?.indexOf('LARGE') ?? 1;
      return [largeIndex];
    }
    
    return selectedIndexes;
  }

  function convertFiltersToApiFormat() {
    let underwriting_filters: any = [];
    let accident_filters: any = [];
    return [underwriting_filters, accident_filters];
  }

  function getBinders(data: any[]): string[] {
    return [];
  }
  //SAME AS IN MAIN
  function convertToPeriod(period, data) {
    let format = 'YYYY';
    if (period == 'quarter') {
      format = '[Q]Q-YYYY';
    }
    
    let periods: string[] = [];
    
    if (period === 'binder') {
      periods = getBinders(data.map((x) => x[0]));
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
    
    let newData: any = {};

    const sections: any[] = [];
    let start = 0;

    for (let i = 1; i <= periods.length; i++) {
      if (i === periods.length || periods[i] !== periods[i - 1]) {
        sections.push({ value: periods[start], start, end: i - 1 });
        start = i;
      }
    }
    
    sections.forEach((p, i) => {
      const startIndex = p['start'];
      const endIndex = p['end'] + 1;
      let newRowData = data.slice(startIndex, endIndex);
      newData[endIndex - 1] = calculateTotal(newRowData, p['value'], data[endIndex - 1][0]);
    });

    return newData;
  }

  //SAME AS IN MAIN
  function numberWithRatios(x: number, isValue: boolean) {
    if (isValue) {
      return x;
    } else {
      return (x * 100).toFixed(1) + '%';
    }
  }

  function seasAdjApriori(data_row: any, isValue: boolean) {
    let ans = 0;
    if (dashboards.value.ccr_nlr == 'CCR') {
      data_row[dashboard_data_column.value['uw_data.GEP_AMOUNT']] != 0
        ? (ans =
            (claimsType.value
              .map(
                (x) =>
                  data_row[dashboard_data_column.value['uw_data.' + x + '_MODEL']] *
                  (!dashboards.value.seasonFactor ||
                  (underwriting_loss_ratios.value == 'Written' && dashboards.value.uw_acc == 'uw')
                    ? 1
                    : data_row[dashboard_data_column.value['uw_data.' + x + '_seasonality']])
              )
              .reduce((ps: number, s: number) => ps + s, 0) +
              data_CommissionColumns.value
                .map((x) => data_row[dashboard_data_column.value[x]])
                .reduce((ps: number, s: number) => ps + s, 0)) /
            data_row[dashboard_data_column.value['uw_data.GEP_AMOUNT']])
        : (ans = 0);
    } else {
      data_row[dashboard_data_column.value['uw_data.GEP_AMOUNT']] != 0
        ? (ans =
            claimsType.value
              .map(
                (x) =>
                  data_row[dashboard_data_column.value['uw_data.' + x + '_MODEL']] *
                  (!dashboards.value.seasonFactor ||
                  (underwriting_loss_ratios.value == 'Written' && dashboards.value.uw_acc == 'uw')
                    ? 1
                    : data_row[dashboard_data_column.value['uw_data.' + x + '_seasonality']])
              )
              .reduce((ps: number, s: number) => ps + s, 0) /
            (data_row[dashboard_data_column.value['uw_data.GEP_AMOUNT']] -
              data_CommissionColumns.value
                .map((x) => data_row[dashboard_data_column.value[x]])
                .reduce((ps: number, s: number) => ps + s, 0)))
        : (ans = 0);
    }

    return numberWithRatios(ans, isValue);
  }

  function seasAdjAprioriGLR(data_row: any, isValue: boolean) {
    let ans = 0;
    data_row[dashboard_data_column.value['uw_data.GEP_AMOUNT']] != 0
      ? (ans =
          claimsType.value
            .map(
              (x) =>
                data_row[dashboard_data_column.value['uw_data.' + x + '_MODEL']] *
                (!dashboards.value.seasonFactor &&
                !(underwriting_loss_ratios.value == 'Written' && dashboards.value.uw_acc == 'uw')
                  ? 1
                  : data_row[dashboard_data_column.value['uw_data.' + x + '_seasonality']])
            )
            .reduce((ps: number, s: number) => ps + s, 0) / data_row[dashboard_data_column.value['uw_data.GEP_AMOUNT']])
      : (ans = 0);

    return numberWithRatios(ans, isValue);
  }

  function graphApriori(data_row: any, isValue: boolean) {
    if (!graphConfig.value['isGLR']) {
      return seasAdjAprioriGLR(data_row, isValue);
    } else {
      return seasAdjApriori(data_row, isValue);
    }
  }

  function graphIncurred(idx: number, claimsCalculation: ClaimsCalculation) {
    if (graphConfig.value['isGLR']) {
      if (graphConfig.value['isNormalised']) {
        const ans = claimsCalculation.normalisedCCRNLR(
          idx,
          dashboards.value.uw_acc,
          underwriting_loss_ratios.value,
          normalise.value,
          dashboards.value.ccr_nlr,
          dashboards.value.seasonFactor,
          true
        );
        return numberWithRatios(ans, true) as number;
      } else {
        const ans = claimsCalculation.ccrNlr(
          idx,
          dashboards.value.uw_acc,
          underwriting_loss_ratios.value,
          dashboards.value.ccr_nlr,
          true
        );
        return numberWithRatios(ans, true) as number;
      }
    } else {
      if (graphConfig.value['isNormalised']) {
        return (
          claimsCalculation.ultimateTotal(
            idx,
            dashboards.value.uw_acc,
            underwriting_loss_ratios.value,
            normalise.value,
            true
          ) / claimsCalculation.gwpSumOrGEPAmount(idx, underwriting_loss_ratios.value, dashboards.value.uw_acc)
        );
      } else {
        return (
          claimsCalculation.ultimateTotal(idx, dashboards.value.uw_acc, underwriting_loss_ratios.value, null, true) /
          claimsCalculation.gwpSumOrGEPAmount(idx, underwriting_loss_ratios.value, dashboards.value.uw_acc)
        );
      }
    }
  }

  function targetData(temp: any) {
    if (
      portfolioStore.parameters &&
      portfolioStore.parameters['target'] &&
      portfolioStore.parameters['target']['target_value']
    ) {
      const paramTarget = portfolioStore.parameters['target'];
      if (dashboards.value.ccr_nlr == 'CCR') {
        temp['target'] = targetCCR(paramTarget['target_value'], paramTarget['target_commission']);
      }

      if (dashboards.value.ccr_nlr == 'NLR') {
        temp['target'] = targetNLR(paramTarget['target_value'], paramTarget['target_commission']);
      }
    }
  }

  function setChartData() {
    const claimsCalculation = new ClaimsCalculation(
      dashboard_data.value,
      dashboard_data_column.value,
      claimsType.value
    );

    // Note: AVE mode not available in Slido yet
    // const claimsCalculationAve = new ClaimsCalculation(
    //   dashboard_ave_store.dashboard_data,
    //   dashboard_data_column.value,
    //   claimsType.value
    // );

    function targetData(temp: any) {
      if (
        portfolioStore.parameters &&
        portfolioStore.parameters['target'] &&
        portfolioStore.parameters['target']['target_value']
      ) {
        const paramTarget = portfolioStore.parameters['target'];
        if (dashboards.value.ccr_nlr == 'CCR') {
          temp['target'] = targetCCR(paramTarget['target_value'], paramTarget['target_commission']);
        }

        if (dashboards.value.ccr_nlr == 'NLR') {
          temp['target'] = targetNLR(paramTarget['target_value'], paramTarget['target_commission']);
        }
      }
    }

    setTimeout(() => {
      let obj: any = [];

      // Note: AVE mode not available in Slido yet
      // if (!portfolioStore.isAve) {
        for (const idx in dashboard_data.value) {
          const idxInt = parseInt(idx);
          let temp = {
            gwp: dashboard_data.value[idx][dashboard_data_column.value['uws.GWP_SUM']],
            gep: dashboard_data.value[idx][dashboard_data_column.value['uw_data.GEP_AMOUNT']],
            ccr: graphCCRNLR(idxInt, claimsCalculation) * 100,
            incurred: graphIncurred(idxInt, claimsCalculation) * 100,
            apriori: <any>graphApriori(dashboard_data.value[idx], true) * 100,
            date: dashboard_data.value[idx][dashboard_data_column.value['months.MONTH']],
          };
          targetData(temp);
          obj.push(temp);
        }
      // } else {
      //   // AVE mode logic would go here
      // }
      chart_data.value = obj;
    });
  }

  function graphCCRNLR(idx: number, claimsCalculation: ClaimsCalculation) {
    if (!graphConfig.value['isGLR']) {
      if (graphConfig.value['isNormalised']) {
        return (
          claimsCalculation.ultimateTotal(
            idx,
            dashboards.value.uw_acc,
            underwriting_loss_ratios.value,
            normalise.value
          ) / claimsCalculation.gwpSumOrGEPAmount(idx, underwriting_loss_ratios.value, dashboards.value.uw_acc)
        );
      } else {
        return (
          claimsCalculation.ultimateTotal(idx, dashboards.value.uw_acc, underwriting_loss_ratios.value) /
          claimsCalculation.gwpSumOrGEPAmount(idx, underwriting_loss_ratios.value, dashboards.value.uw_acc)
        );
      }
    } else {
      if (graphConfig.value['isNormalised']) {
        const ans = claimsCalculation.normalisedCCRNLR(
          idx,
          dashboards.value.uw_acc,
          underwriting_loss_ratios.value,
          normalise.value,
          dashboards.value.ccr_nlr,
          dashboards.value.seasonFactor
        );
        return numberWithRatios(ans, true) as number;
      } else {
        const ans = claimsCalculation.ccrNlr(
          idx,
          dashboards.value.uw_acc,
          underwriting_loss_ratios.value,
          dashboards.value.ccr_nlr
        );
        return numberWithRatios(ans, true) as number;
      }
    }
  }

  function calculateTotal(data: any, date: string, month: string) {
    let totals = new Array(Object.keys(dashboard_data_column.value).length).fill(0);

    const exposureIndex = {};

    // Do not sum exposure values, find the column index and not sum them
    for (let i = 0; i < portfolioStore.getExposureLength(); i++) {
      const exposure = portfolioStore.parameters['exposure'][i];
      const columnName = 'uw_data.exposure.' + exposure['method'] + '.' + exposure['name'];
      exposureIndex[dashboard_data_column.value[columnName]] = i;
    }

    totals[0] = date;
    totals[1] = month;

    const averageColumns = Object.keys(dashboard_data_column.value).filter((x) => x.includes('uw_data.exposure.avg'));

    let numberOfRows = 0;
    data.forEach((row: any) => {
      numberOfRows++;
      row.forEach((value: any, columnIndex: number) => {
        if (columnIndex in exposureIndex) {
          if (portfolioStore.parameters['exposure'][exposureIndex[columnIndex]]['method'] == 'sum') {
            if (value > 0) {
              totals[columnIndex] = (totals[columnIndex] || 0) + value;
            }
          } else if (portfolioStore.parameters['exposure'][exposureIndex[columnIndex]]['method'] == 'min') {
            if (value > 0) {
              totals[columnIndex] = Math.min(totals[columnIndex] || Number.POSITIVE_INFINITY, value);
            }
          } else if (portfolioStore.parameters['exposure'][exposureIndex[columnIndex]]['method'] == 'max') {
            if (value > 0) {
              totals[columnIndex] = Math.max(totals[columnIndex] || Number.NEGATIVE_INFINITY, value);
            }
          } else if (portfolioStore.parameters['exposure'][exposureIndex[columnIndex]]['method'] == 'avg') {
            totals[columnIndex] = (totals[columnIndex] || 0) + value;
          }
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
    normalise,
    data_CommissionColumns,
    graphConfig,
    chart_data,
    numberWithRatios,
    seasAdjApriori,
    seasAdjAprioriGLR,
    graphApriori,
    graphIncurred,
    targetData,
    setChartData,
    graphCCRNLR,
    
    availableFilters: availableFiltersComputed,
    selectedFilters: selectedFiltersComputed,
    filterAccidentUnderwriting,
    
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
    seasonality_parameters,
    large_threshold,
    large_method,
    UWCommissionColumns,
    unDataFilters,
    unDateFilters,
    isYearSubTotal,
    isYearSubTotalUp,
    isQuarterSubTotal,
    isQuarterSubTotalUp,
    isBinderSubTotal,
    isBinderSubTotalUp,
    dashboardForwardLookings,
    
    changeSeas: () => { 
      dashboards.value.seasonFactor = !dashboards.value.seasonFactor;
      setChartData();
    },
    switch_ratio_amount: async () => {
      if (dashboards.value.ratio_amount == 'amount') {
        dashboards.value.ratio_amount = 'ratios';
      } else {
        dashboards.value.ratio_amount = 'amount';
      }
    },
    change_uw_acc: async () => {
      if (isBindedYears.value) {
        isBindedYears.value = false;
        dashboards.value.uw_acc = 'acc';
        // Note: amtFunc and amtLabel not available in Slido yet
        // amtFunc.value = ['Paid', 'OS', 'Incurred', 'IBNR', 'Ultimate'];
        // amtLabel.value = ['Paid', 'O/S', 'Incurred', 'IBNR', 'Ultimate'];
        if (currentPortfolio.value) {
          await loadDashboard(currentPortfolio.value);
        }
      } else if (dashboards.value.uw_acc == 'uw' && dashboards.value.mqy == 'year') {
        isBindedYears.value = true;
        if (underwriting_loss_ratios.value == 'Written') {
          // Note: amtFunc and amtLabel not available in Slido yet
          // amtFunc.value = ['Paid', 'OS', 'Incurred', 'IBNR', 'Unearned', 'Ultimate'];
          // amtLabel.value = ['Paid', 'O/S', 'Incurred', 'IBNR', 'Unearned Expected Loss', 'Ultimate'];
        }
        if (currentPortfolio.value) {
          await loadDashboard(currentPortfolio.value);
        }
      } else if (dashboards.value.uw_acc == 'acc') {
        isBindedYears.value = false;
        dashboards.value.uw_acc = 'uw';

        if (underwriting_loss_ratios.value == 'Written') {
          // Note: amtFunc and amtLabel not available in Slido yet
          // amtFunc.value = ['Paid', 'OS', 'Incurred', 'IBNR', 'Unearned', 'Ultimate'];
          // amtLabel.value = ['Paid', 'O/S', 'Incurred', 'IBNR', 'Unearned Expected Loss', 'Ultimate'];
        }

        if (currentPortfolio.value) {
          await loadDashboard(currentPortfolio.value);
        }
      } else {
        isBindedYears.value = false;
        dashboards.value.uw_acc = 'acc';
        // Note: amtFunc and amtLabel not available in Slido yet
        // amtFunc.value = ['Paid', 'OS', 'Incurred', 'IBNR', 'Ultimate'];
        // amtLabel.value = ['Paid', 'O/S', 'Incurred', 'IBNR', 'Ultimate'];
        if (currentPortfolio.value) {
          await loadDashboard(currentPortfolio.value);
        }
      }
    },
    
    //SAME AS IN MAIN
    change_mqy: () => { 
      if (dashboards.value.mqy == 'month') {
        dashboards.value.mqy = 'year';
      } else if (dashboards.value.mqy == 'quarter') {
        dashboards.value.mqy = 'month';
      } else {
        dashboards.value.mqy = 'quarter';
      }

      isBindedYears.value = false;

      transformDataToDate();
      // Note: AVE mode not available in Slido yet
      // if (portfolioStore.isAve) {
      //   dashboard_ave_store.transformDataToDate();
      // }
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