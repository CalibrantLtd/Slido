/**
 * Calculates the target CCR (Commission Conversion Ratio) based on the target value and target commission.
 *
 * @param targetValue - The target value.
 * @param targetCommission - The target commission.
 * @returns The target CCR.
 */
export function targetCCR(targetValue: number, targetCommission: number) {
  return targetValue + targetCommission;
}

/**
 * Calculates the target NLR (Net Loss Ratio) based on the target value and target commission.
 *
 * @param targetValue - The target value.
 * @param targetCommission - The target commission as a percentage.
 * @returns The calculated target NLR.
 */
export function targetNLR(targetValue: number, targetCommission: number) {
  return targetValue / (1 - targetCommission / 100);
}
