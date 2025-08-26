export function numberWithCommas(value: number, isValue: boolean = false): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  if (isValue) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export function numberWithCommasOrRatios(value: number, denominator: number, isAmount: boolean = false): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  if (denominator === 0 || denominator === null || denominator === undefined) {
    return '0';
  }
  
  if (isAmount) {
    return numberWithCommas(value, true);
  }
  
  const ratio = value / denominator;
  return (ratio * 100).toFixed(1) + '%';
}

export function decimalToPercentage(value: number, isValue: boolean = false): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  
  if (isValue) {
    return value.toLocaleString('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }
  
  return (value * 100).toFixed(1) + '%';
}

