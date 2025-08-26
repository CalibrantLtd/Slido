import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const usePortfolioStore = defineStore('portfolio', () => {
  // State
  const selectedPortfolioID = ref<string>('');
  const selectedPortfolioName = ref<string>('');
  const selectedBounceDate = ref<string>('');
  const selectedBounceFullName = ref<string>('');
  const selectedBounceName = ref<string>('');
  
  // Parameters
  const parameters = ref({
    claims_nature: ['ATTRITIONAL', 'LARGE'],
    exposure: [
      { name: 'Total Risk Count', method: 'sum' },
      { name: 'Average GWP', method: 'average' }
    ],
    default_dashboard: {
      accident_underwriting: 'uw',
      cohort: 'quarter'
    }
  });
  
  // Normalization settings
  const normaliseSelection = ref<boolean[]>([false, true, true]);
  const normalise = ref<boolean[]>([false, true, true]);
  
  // Signed off status
  const signedOff = ref({
    actuarial_module: {
      attritional: true,
      large: true
    },
    underwriting_module: true
  });
  
  // Computed
  const dictionary = computed(() => ({}));
  
  // Methods
  const getExposureLength = () => parameters.value.exposure.length;
  
  const setNormalisedSelection = (index: number, value: boolean) => {
    if (normaliseSelection.value[index] !== undefined) {
      normaliseSelection.value[index] = value;
    }
  };
  
  const saveParameters = (oldParameters: any, message: string) => {
    console.log('Saving parameters:', message, oldParameters);
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
    
    // Computed
    dictionary,
    
    // Methods
    getExposureLength,
    setNormalisedSelection,
    saveParameters
  };
});

