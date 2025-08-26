import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import moment from 'moment';
import { useDashboardStore } from './dashboard';

export const usePortfolioStore = defineStore('portfolio', () => {
  // State
  const selectedPortfolioID = ref<string>('');
  const selectedPortfolioName = ref<string>('');
  const selectedBounceDate = ref<string>('');
  const selectedBounceFullName = ref<string>('');
  const selectedBounceName = ref<string>('');
  
  // Parameters
  const parameters = ref({
    hierarchies: [],
    default_hierarchies: [] as string[],
    large_threshold: null,
    actuarial_grouping: [],
    claims_nature: [],
    line_size: [],
    commission: [],
    large_method: null,
    binding_years: [],
    target: {},
    exposure: [],
    exposure_order: [],
    bands: {},
    default_dashboard: {
      accident_underwriting: 'uw',
      cohort: 'quarter'
    }
  });
  
  // Normalization settings
  const normaliseSelection = ref<boolean[]>([]);
  const normalise = ref<boolean[]>([]);

  // Date arrays for UW/ACC
  const all_uw_dates = ref({
    month: [] as string[],
    quarter: [] as string[],
    year: [] as string[]
  });
  
  const all_acc_dates = ref({
    month: [] as string[],
    quarter: [] as string[],
    year: [] as string[]
  });

  // Function to update parameters from API data
  function onSetParameters(parameters_to_be_set: any) {
    parameters.value = parameters_to_be_set;
  }

  function convert_distinct_uw_acc(portfolio_data: any) {
    let temp_uw_month: string[] = [];
    let temp_acc_month: string[] = [];

    let quarter_set = new Set();
    let temp_uw_quarter: string[] = [];
    let temp_acc_quarter: string[] = [];

    let year_set = new Set();
    let temp_uw_year: string[] = [];
    let temp_acc_year: string[] = [];

    for (const i of portfolio_data['uw_month']) {
      const quarter = moment(i[0], 'YYYY/MM/DD').format('[Q]Q-YYYY');
      const year = moment(i[0], 'YYYY/MM/DD').format('YYYY');

      if (!quarter_set.has(quarter)) {
        quarter_set.add(quarter);
        temp_uw_quarter.push(quarter);
      }

      if (!year_set.has(year)) {
        year_set.add(year);
        temp_uw_year.push(year);
      }

      temp_uw_month.push(moment(i[0], 'YYYY/MM/DD').format('MMM-YYYY'));
    }

    quarter_set = new Set();
    year_set = new Set();

    for (const i of portfolio_data['acc_month']) {
      const quarter = moment(i[0], 'YYYY/MM/DD').format('[Q]Q-YYYY');
      const year = moment(i[0], 'YYYY/MM/DD').format('YYYY');

      if (!quarter_set.has(quarter)) {
        quarter_set.add(quarter);
        temp_acc_quarter.push(quarter);
      }

      if (!year_set.has(year)) {
        year_set.add(year);
        temp_acc_year.push(year);
      }
    }

    all_uw_dates.value['month'] = temp_uw_month;
    all_acc_dates.value['month'] = temp_acc_month;

    all_uw_dates.value['quarter'] = temp_uw_quarter;
    all_acc_dates.value['quarter'] = temp_acc_quarter;

    all_uw_dates.value['year'] = temp_uw_year;
    all_acc_dates.value['year'] = temp_acc_year;
  }

  function onSetPortfolio(portfolio_data: any) {
    // Set dictionary and parameters from portfolio data
    dictionary.value = portfolio_data['dictionary'];
    parameters.value = portfolio_data['parameters'];

    /**
     * Create default values if not available
     */
    if (!parameters.value['binding_years']) {
      parameters.value['binding_years'] = [];
    }

    if (!parameters.value['default_hierarchies']) {
      parameters.value['default_hierarchies'] = [];
    }

    if (!parameters.value['target']) {
      parameters.value['target'] = {};
    }

    /**
     * End
     */

    convert_distinct_uw_acc(portfolio_data);

    let temp_normalised: boolean[] = [];
    let temp_normalised_selection: boolean[] = [];

    for (const i of parameters.value.claims_nature.slice(1)) {
      temp_normalised.push(true);
      temp_normalised_selection.push(true);
    }

    normalise.value = temp_normalised;
    normaliseSelection.value = temp_normalised_selection;

    // Note: createFiltersForDashboard and getSignedOff not available in Slido yet
    // createFiltersForDashboard();
    // getSignedOff();
  }
  
  // Signed off status
  const signedOff = ref({
    actuarial_module: {
      attritional: true,
      large: true
    },
    underwriting_module: true
  });
  
  // Computed
  const dictionary = ref({});
  
  // Methods
  const getExposureLength = () => parameters.value.exposure.length;
  
  function setNormalisedSelection(index: any, x: boolean) {
    normaliseSelection.value[index] = x;
    const dashboardStore = useDashboardStore();
    dashboardStore.setChartData();
  }
  
  const saveParameters = (oldParameters: any, message: string) => {
  };
  
  const updateParameters = (newParameters: any) => {
    parameters.value = { ...parameters.value, ...newParameters };
  };
  
  return {
    // State
    selectedPortfolioID,
    selectedPortfolioName,
    selectedBounceDate,
    selectedBounceFullName,
    selectedBounceName,
    
    // Parameters
    parameters,
    normaliseSelection,
    normalise,
    signedOff,
    
    // Functions
    onSetParameters,
    onSetPortfolio,
    convert_distinct_uw_acc,
    
    // Computed
    dictionary,
    all_uw_dates,
    all_acc_dates,
    
    // Methods
    getExposureLength,
    setNormalisedSelection,
    saveParameters,
    updateParameters
  };
});

