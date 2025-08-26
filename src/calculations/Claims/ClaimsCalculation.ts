import type { DashboardData } from '../../types/dashboard';
import type { ExposureParameters } from '../../types/portfolio';
import { safeDivide, safeTypeNumber } from '../../utils/calculationHelper';
/**
 * Represents the location of columns in the claims data.
 */
type ClaimsColumnLocation = {
  [key: string]: number;
};

export default class ClaimsCalculation {
  data: DashboardData;
  columns: ClaimsColumnLocation;
  claimsType: string[];
  commissionColumns: string[];

  /**
   * Creates an instance of ClaimsCalculation.
   * @param data - The claims data.
   * @param columns - The column locations in the claims data.
   * @param claimsType - The types of claims.
   */
  constructor(data: DashboardData, columns: ClaimsColumnLocation, claimsType: string[]) {
    this.data = data;
    this.columns = columns;
    this.claimsType = claimsType;
    this.commissionColumns = Object.keys(this.columns).filter((key) => key.includes('uw_data.COM'));
  }

  exposure(idx: number, exposureObj: ExposureParameters): number {
    if (exposureObj.method == 'avg') {
      if (safeTypeNumber(this.data[idx][this.columns['uw_data.exposure.sum.count.' + exposureObj.name]]) == 0) {
        return 0;
      }

      return (
        safeTypeNumber(
          this.data[idx][this.columns['uw_data.exposure.' + exposureObj.method + '.' + exposureObj.name]]
        ) / safeTypeNumber(this.data[idx][this.columns['uw_data.exposure.sum.count.' + exposureObj.name]])
      );
    }

    return safeTypeNumber(
      this.data[idx][this.columns['uw_data.exposure.' + exposureObj.method + '.' + exposureObj.name]]
    );
  }

  averageGWP(idx: number): number {
    const dataRow = this.data[idx];
    return safeDivide(
      safeTypeNumber(dataRow[this.columns['uws.GWP_SUM']]),
      safeTypeNumber(dataRow[this.columns['uw_data.exposure.sum.Policy Count']])
    );
  }

  /**
   * Calculates the total paid amount for a given index.
   * @param idx - The index of the data row.
   * @returns The total paid amount.
   */
  paidTotal(idx: number): number {
    return this.claimsType.reduce((ps: number, claims: string) => ps + this.paid(idx, claims), 0);
  }

  /**
   * Calculates the paid amount for a given index and claims type.
   * @param idx - The index of the data row.
   * @param claims - The type of claims.
   * @returns The paid amount.
   */
  paid(idx: number, claims: string): number {
    const dataRow = this.data[idx];

    return safeTypeNumber(dataRow[this.columns['claims_data.' + claims + '_paid']]);
  }

  /**
   * Calculates the total outstanding amount for a given index.
   * @param idx - The index of the data row.
   * @returns The total outstanding amount.
   */
  osTotal(idx: number): number {
    return this.claimsType.reduce((ps: number, claims: string) => ps + this.os(idx, claims), 0);
  }

  /**
   * Calculates the outstanding amount for a given index and claims type.
   * @param idx - The index of the data row.
   * @param claims - The type of claims.
   * @returns The outstanding amount.
   */
  os(idx: number, claims: string): number {
    const dataRow = this.data[idx];

    return (
      safeTypeNumber(dataRow[this.columns['claims_data.' + claims + '_inc']]) -
      safeTypeNumber(dataRow[this.columns['claims_data.' + claims + '_paid']])
    );
  }

  /**
   * Calculates the total incurred amount for a given index.
   * @param idx - The index of the data row.
   * @returns The total incurred amount.
   */
  incurredTotal(idx: number, normalise: string[] | null = null): number {
    return this.claimsType.reduce((ps: number, claims: string) => ps + this.incurred(idx, claims, normalise), 0);
  }

  /**
   * Calculates the incurred amount for a given index and claims type.
   * @param idx - The index of the data row.
   * @param claims - The type of claims.
   * @returns The incurred amount.
   */
  incurred(idx: number, claims: string, normalise: string[] | null = null): number {
    const dataRow = this.data[idx];

    return normalise && normalise.includes(claims)
      ? safeTypeNumber(dataRow[this.columns['uw_data.' + claims + '_MODEL']]) *
          safeTypeNumber(dataRow[this.columns['uw_data.' + claims + '_seasonality']])
      : safeTypeNumber(dataRow[this.columns['claims_data.' + claims + '_inc']]);
  }

  /**
   * Calculates the total IBNR amount for a given index.
   * @param idx - The index of the data row.
   * @returns The total IBNR amount.
   */
  ibnrTotal(idx: number): number {
    return this.claimsType.reduce((ps: number, claims: string) => ps + this.ibnr(idx, claims), 0);
  }

  /**
   * Calculates the IBNR amount for a given index and claims type.
   * @param idx - The index of the data row.
   * @param claims - The type of claims.
   * @returns The IBNR amount.
   */
  ibnr(idx: number, claims: string): number {
    const dataRow = this.data[idx];

    return safeTypeNumber(dataRow[this.columns[claims + '_ibnr']]);
  }

  /**
   * Calculates the commission for a given index.
   * @param idx - The index of the data row.
   * @returns The commission value.
   */
  commission(idx: number): number {
    const dataRow = this.data[idx];
    return this.commissionColumns
      .map((x: string) => safeTypeNumber(dataRow[this.columns[x]]))
      .reduce((ps: number, s: number) => ps + s, 0);
  }

  /**
   * Calculates the ultimate amount for a given index, underwriting account, underwriting loss ratios, and claims type.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param claims - The type of claims.
   * @returns The ultimate amount.
   */
  ultimate(
    idx: number,
    uwAcc: string,
    underwritingLossRatios: string,
    claims: string,
    normalise: string[] | null = null,
    isExcludeIbnr: boolean = false
  ): number {
    const dataRow = this.data[idx];

    function ultimateModel(claims: string, columns: ClaimsColumnLocation): number {
      if (normalise && normalise.includes(claims)) {
        return (
          safeTypeNumber(dataRow[columns['uw_data.' + claims + '_MODEL']]) *
          safeTypeNumber(dataRow[columns['uw_data.' + claims + '_seasonality']])
        );
      } else {
        return (
          safeTypeNumber(dataRow[columns['claims_data.' + claims + '_inc']]) +
          (isExcludeIbnr ? 0 : safeTypeNumber(dataRow[columns[claims + '_ibnr']]))
        );
      }
    }

    return underwritingLossRatios == 'Written' && uwAcc == 'uw'
      ? safeTypeNumber(dataRow[this.columns[claims + '_unearned_apriori']]) + ultimateModel(claims, this.columns)
      : ultimateModel(claims, this.columns);
  }

  /**
   * Calculates the total ultimate amount for a given index, underwriting account, and underwriting loss ratios.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @returns The total ultimate amount.
   */
  ultimateTotal(
    idx: number,
    uwAcc: string,
    underwritingLossRatios: string,
    normalise: string[] | null = null,
    isExcludeIbnr: boolean = false
  ): number {
    return this.claimsType.reduce(
      (ps: number, claims: string) =>
        ps + this.ultimate(idx, uwAcc, underwritingLossRatios, claims, normalise, isExcludeIbnr),
      0
    );
  }

  /**
   * Calculates the NEP amount for a given index.
   * @param idx - The index of the data row.
   * @returns The NEP amount value.
   */
  nepAmount(idx: number): number {
    const dataRow = this.data[idx];
    return (
      safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]) -
      this.commissionColumns
        .map((x: string) => dataRow[this.columns[x]])
        .reduce((ps: number, s: number | string) => ps + safeTypeNumber(s), 0)
    );
  }

  /**
   * Retrieves the GEP amount for a given index.
   * @param idx - The index of the data row.
   * @returns The GEP amount value.
   */
  gepAmount(idx: number): number {
    const dataRow = this.data[idx];
    return safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]);
  }

  /**
   * Calculates the GWP or NWP amount for a given index and GWP/NWP type.
   * @param idx - The index of the data row.
   * @param gwpNwp - The GWP/NWP type.
   * @returns The GWP or NWP amount value.
   */
  gwpNWPAmount(idx: number, gwpNwp: string): number {
    const dataRow = this.data[idx];

    if (gwpNwp == 'NWP') {
      return (
        safeTypeNumber(dataRow[this.columns['uws.GWP_SUM']]) -
        this.commissionColumns
          .map((x) => safeTypeNumber(dataRow[this.columns[x.replace('uw_data', 'uws')]]))
          .reduce((ps: number, s: number) => ps + s, 0)
      );
    } else {
      return safeTypeNumber(dataRow[this.columns['uws.GWP_SUM']]);
    }
  }

  gwpSumOrGEPAmount(idx: number, underwritingLossRatios: string, uwAcc: string): number {
    const dataRow = this.data[idx];
    return underwritingLossRatios == 'Written' && uwAcc == 'uw'
      ? safeTypeNumber(dataRow[this.columns['uws.GWP_SUM']])
      : safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]);
  }
  /**
   * Calculates the unearned amount for a given index and claims type.
   * @param idx - The index of the data row.
   * @param claims - The type of claims.
   * @returns The unearned amount.
   */
  unearned(idx: number, claims: string): number {
    const dataRow = this.data[idx];
    return safeTypeNumber(dataRow[this.columns[claims + '_unearned_apriori']]);
  }

  /**
   * Calculates the total unearned amount for a given index.
   * @param idx - The index of the data row.
   * @returns The total unearned amount.
   */
  unearnedTotal(idx: number): number {
    return this.claimsType.reduce((ps: number, claims: string) => ps + this.unearned(idx, claims), 0);
  }

  /**
   * Calculates the normalized NLR (Net Loss Ratio) for a given index, underwriting account, and underwriting loss ratios.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @returns The normalized NLR value.
   */
  normalisedNLR(
    idx: number,
    uwAcc: string,
    underwritingLossRatios: string,
    normalise: string[],
    seasonFactor: boolean,
    excludeIbnr: boolean = false
  ): number {
    let ans = 0;
    const dataRow = this.data[idx];
    dataRow[this.columns['uw_data.GEP_AMOUNT']] != 0
      ? underwritingLossRatios == 'Written' && uwAcc == 'uw'
        ? (ans =
            (this.claimsType
              .map((x) =>
                normalise.includes(x)
                  ? safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_MODEL']]) *
                    safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_seasonality']])
                  : safeTypeNumber(dataRow[this.columns['claims_data.' + x + '_inc']])
              )
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.claimsType
                .map((x) =>
                  normalise.includes(x) || excludeIbnr ? 0 : safeTypeNumber(dataRow[this.columns[x + '_ibnr']])
                )
                .reduce((ps: number, s: number) => ps + s, 0) +
              this.unearnedTotal(idx)) /
            (safeTypeNumber(dataRow[this.columns['uws.GWP_SUM']]) -
              this.commissionColumns
                .map((x) => safeTypeNumber(dataRow[this.columns[x.replace('uw_data', 'uws')]]))
                .reduce((ps: number, s: number) => ps + s, 0)))
        : (ans =
            (this.claimsType
              .map((x) =>
                normalise.includes(x)
                  ? safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_MODEL']]) *
                    safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_seasonality']])
                  : safeTypeNumber(dataRow[this.columns['claims_data.' + x + '_inc']])
              )
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.claimsType
                .map((x) =>
                  normalise.includes(x) || excludeIbnr ? 0 : safeTypeNumber(dataRow[this.columns[x + '_ibnr']])
                )
                .reduce((ps: number, s: number) => ps + s, 0)) /
            (safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]) -
              this.commissionColumns
                .map((x) => safeTypeNumber(dataRow[this.columns[x]]))
                .reduce((ps: number, s: number) => ps + s, 0)))
      : (ans = 0);
    return ans;
  }

  /**
   * Calculates the seasonally adjusted CCR or NLR (Combined Claims Ratio or Net Loss Ratio) for a given index, underwriting account, underwriting loss ratios, and season factor.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param seasonFactor - The season factor.
   * @returns The seasonally adjusted CCR or NLR ratios.
   */

  seasAdjustedCCRNLR(
    idx: number,
    uwAcc: string,
    underwritingLossRatios: string,
    seasonFactor: boolean,
    ccrNlr: string
  ): number {
    return ccrNlr == 'CCR'
      ? this.seasAdjustedCCR(idx, uwAcc, underwritingLossRatios, seasonFactor)
      : this.seasAdjustedNLR(idx, uwAcc, underwritingLossRatios, seasonFactor);
  }

  /**
   * Calculates the seasonally adjusted NLR (Net Loss Ratio) for a given index, underwriting account, underwriting loss ratios, and season factor.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param seasonFactor - The season factor.
   * @returns The seasonally adjusted NLR value.
   */
  seasAdjustedNLR(idx: number, uwAcc: string, underwritingLossRatios: string, seasonFactor: boolean): number {
    let ans = 0;
    const dataRow = this.data[idx];

    dataRow[this.columns['uw_data.GEP_AMOUNT']] != 0
      ? (ans =
          this.claimsType
            .map(
              (x) =>
                safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_MODEL']]) *
                (!seasonFactor || (underwritingLossRatios == 'Written' && uwAcc == 'uw')
                  ? 1
                  : safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_seasonality']]))
            )
            .reduce((ps: number, s: number) => ps + s, 0) /
          (safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]) -
            this.commissionColumns
              .map((x) => safeTypeNumber(dataRow[this.columns[x]]))
              .reduce((ps: number, s: number) => ps + s, 0)))
      : (ans = 0);
    return ans;
  }

  /**
   * Calculates the seasonally adjusted CCR (Combined Claims Ratio) for a given index, underwriting account, underwriting loss ratios, and season factor.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param seasonFactor - The season factor.
   * @returns The seasonally adjusted CCR value.
   */
  seasAdjustedCCR(idx: number, uwAcc: string, underwritingLossRatios: string, seasonFactor: boolean): number {
    let ans = 0;
    const dataRow = this.data[idx];

    dataRow[this.columns['uw_data.GEP_AMOUNT']] != 0
      ? (ans =
          (this.claimsType
            .map(
              (x) =>
                safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_MODEL']]) *
                (!seasonFactor || (underwritingLossRatios == 'Written' && uwAcc == 'uw')
                  ? 1
                  : safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_seasonality']]))
            )
            .reduce((ps: number, s: number) => ps + s, 0) +
            this.commissionColumns
              .map((x) => safeTypeNumber(dataRow[this.columns[x]]))
              .reduce((ps: number, s: number) => ps + s, 0)) /
          safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]))
      : (ans = 0);
    return ans;
  }

  /**
   *  Calculates the seasonally adjusted NEP (Net Earned Premium) for a given index, underwriting account, underwriting loss ratios, and season factor.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param seasonFactor - The season factor.
   * @param claims - The type of claims.
   * @returns - The seasonally adjusted NEP value.
   */

  seasAdjApriori(
    idx: number,
    uwAcc: string,
    underwritingLossRatios: string,
    seasonFactor: boolean,
    claims: string
  ): number {
    const dataRow = this.data[idx];

    return underwritingLossRatios == 'Written' && uwAcc == 'uw'
      ? safeTypeNumber(dataRow[this.columns['uw_data.' + claims + '_MODEL']])
      : safeTypeNumber(dataRow[this.columns['uw_data.' + claims + '_MODEL']]) *
          (!seasonFactor
            ? 1
            : parseFloat(safeTypeNumber(dataRow[this.columns['uw_data.' + claims + '_seasonality']]).toFixed(2)));
  }

  /**
   * Calculates the seasonally adjusted NLR (Net Loss Ratio) for a given index, underwriting account, underwriting loss ratios, and season factor.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param seasonFactor - The season factor.
   * @param claims - The type of claims.
   * @returns - The seasonally adjusted NLR value.
   */

  seasonality(idx: number, uwAcc: string, underwritingLossRatios: string, claims: string): number {
    const dataRow = this.data[idx];

    return underwritingLossRatios == 'Written' && uwAcc == 'uw'
      ? 1.0
      : safeTypeNumber(dataRow[this.columns['uw_data.' + claims + '_seasonality']]);
  }

  /** Calculates the normalised CCR or NLR (Combined Claims Ratio or Net Loss Ratio) for a given index, underwriting account, underwriting loss ratios, normalise, CCR/NLR type, and season factor.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param normalise - The normalise value.
   * @param ccrNlr - The CCR/NLR type.
   * @param seasonFactor - The season factor.
   * @returns The normalised CCR or NLR ratios.
   * */

  normalisedCCRNLR(
    idx: number,
    uwAcc: string,
    underwritingLossRatios: string,
    normalise: string[],
    ccrNlr: string,
    seasonFactor: boolean,
    excludeIbnr: boolean = false
  ): number {
    return ccrNlr == 'CCR'
      ? this.normalisedCCR(idx, uwAcc, underwritingLossRatios, normalise, seasonFactor, excludeIbnr)
      : this.normalisedNLR(idx, uwAcc, underwritingLossRatios, normalise, seasonFactor, excludeIbnr);
  }

  /**
   * Calculates the seasonally adjusted CCR (Combined Claims Ratio) for a given index, underwriting account, underwriting loss ratios, and season factor.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param seasonFactor - The season factor.
   * @param claims - The type of claims.
   * @returns - The seasonally adjusted CCR value.
   */

  normalisedCCR(
    idx: number,
    uwAcc: string,
    underwritingLossRatios: string,
    normalise: string[],
    seasonFactor: boolean,
    excludeIbnr: boolean
  ): number {
    let ans = 0;
    const dataRow = this.data[idx];
    
    dataRow[this.columns['uw_data.GEP_AMOUNT']] != 0
      ? underwritingLossRatios == 'Written' && uwAcc == 'uw'
        ? (ans =
            (this.claimsType
              .map((x) =>
                normalise.includes(x)
                  ? safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_MODEL']]) *
                    safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_seasonality']])
                  : safeTypeNumber(dataRow[this.columns['claims_data.' + x + '_inc']])
              )
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.claimsType
                .map((x) =>
                  normalise.includes(x) || excludeIbnr ? 0 : safeTypeNumber(dataRow[this.columns[x + '_ibnr']])
                )
                .reduce((ps: number, s: number) => ps + s, 0) +
              this.unearnedTotal(idx)) /
              safeTypeNumber(dataRow[this.columns['uws.GWP_SUM']]) +
            this.commissionColumns
              .map((x) => safeTypeNumber(dataRow[this.columns[x]]))
              .reduce((ps: number, s: number) => ps + s, 0) /
              safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]))
        : (ans =
            (this.claimsType
              .map((x) =>
                normalise.includes(x)
                  ? safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_MODEL']]) *
                    safeTypeNumber(dataRow[this.columns['uw_data.' + x + '_seasonality']])
                  : safeTypeNumber(dataRow[this.columns['claims_data.' + x + '_inc']])
              )
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.claimsType
                .map((x) =>
                  normalise.includes(x) || excludeIbnr ? 0 : safeTypeNumber(dataRow[this.columns[x + '_ibnr']])
                )
                .reduce((ps: number, s: number) => ps + s, 0) +
              this.commissionColumns
                .map((x) => safeTypeNumber(dataRow[this.columns[x]]))
                .reduce((ps: number, s: number) => ps + s, 0)) /
            safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]))
      : (ans = 0);
    
    
    return ans;
  }

  /**
   * Calculates the CCR or NLR (Combined Claims Ratio or Net Loss Ratio) for a given index, underwriting account, underwriting loss ratios, and CCR/NLR type.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @param ccrNlr - The CCR/NLR type.
   * @returns The CCR or NLR ratios.
   */

  ccrNlr(
    idx: number,
    uwAcc: string,
    underwritingLossRatios: string,
    ccrNlr: string,
    excludeIbnr: boolean = false
  ): number {
    return ccrNlr == 'CCR'
      ? this.ccr(idx, uwAcc, underwritingLossRatios, excludeIbnr)
      : this.nlr(idx, uwAcc, underwritingLossRatios, excludeIbnr);
  }

  /**
   * Calculates the CCR (Combined Claims Ratio) for a given index, underwriting account, and underwriting loss ratios.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @returns The CCR ratios.
   */
  ccr(idx: number, uwAcc: string, underwritingLossRatios: string, excludeIbnr: boolean = false): number {
    let ans = 0;
    const dataRow = this.data[idx];

    // Add basic logging to see if this method is called

    // Add detailed logging for recent months (last 12 months)
    const totalRows = Object.keys(this.data).length;
    const isRecentMonth = idx >= (totalRows - 12);
    

    dataRow[this.columns['uw_data.GEP_AMOUNT']] != 0
      ? underwritingLossRatios == 'Written' && uwAcc == 'uw'
        ? (ans =
            (this.claimsType
              .map((x) => safeTypeNumber(dataRow[this.columns['claims_data.' + x + '_inc']]))
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.claimsType
                .map((x) => (excludeIbnr ? 0 : safeTypeNumber(dataRow[this.columns[x + '_ibnr']])))
                .reduce((ps: number, s: number) => ps + s, 0) +
              this.unearnedTotal(idx)) /
              safeTypeNumber(dataRow[this.columns['uws.GWP_SUM']]) +
            this.commissionColumns
              .map((x) => safeTypeNumber(dataRow[this.columns[x]]))
              .reduce((ps: number, s: number) => ps + s, 0) /
              safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]))
        : (ans =
            (this.claimsType
              .map((x) => safeTypeNumber(dataRow[this.columns['claims_data.' + x + '_inc']]))
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.claimsType
                .map((x) => (excludeIbnr ? 0 : safeTypeNumber(dataRow[this.columns[x + '_ibnr']])))
                .reduce((ps: number, s: number) => ps + s, 0) +
              this.commissionColumns
                .map((x) => safeTypeNumber(dataRow[this.columns[x]]))
                .reduce((ps: number, s: number) => ps + s, 0)) /
            safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]))
      : (ans = 0);
    
    
    return ans;
  }

  /**
   * Calculates the NLR (Net Loss Ratio) for a given index, underwriting account, and underwriting loss ratios.
   * @param idx - The index of the data row.
   * @param uwAcc - Underwriting Or Accident
   * @param underwritingLossRatios - The underwriting loss ratios.
   * @returns The NLR ratios.
   */
  nlr(idx: number, uwAcc: string, underwritingLossRatios: string, excludeIbnr: boolean = false): number {
    let ans = 0;
    const dataRow = this.data[idx];

    // Add basic logging to see if this method is called

    // Add detailed logging for recent months (last 12 months)
    const totalRows = Object.keys(this.data).length;
    const isRecentMonth = idx >= (totalRows - 12);
    

    dataRow[this.columns['uw_data.GEP_AMOUNT']] != 0
      ? underwritingLossRatios == 'Written' && uwAcc == 'uw'
        ? (ans =
            (this.claimsType
              .map((x) => safeTypeNumber(dataRow[this.columns['claims_data.' + x + '_inc']]))
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.claimsType
                .map((x) => (excludeIbnr ? 0 : safeTypeNumber(dataRow[this.columns[x + '_ibnr']])))
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.unearnedTotal(idx)) /
            (safeTypeNumber(dataRow[this.columns['uws.GWP_SUM']]) -
              this.commissionColumns
                .map((x) => safeTypeNumber(dataRow[this.columns[x.replace('uw_data', 'uws')]]))
                .reduce((ps: number, s: number) => ps + s, 0)))
        : (ans =
            (this.claimsType
              .map((x) => safeTypeNumber(dataRow[this.columns['claims_data.' + x + '_inc']]))
              .reduce((ps: number, s: number) => ps + s, 0) +
              this.claimsType
                .map((x) => (excludeIbnr ? 0 : safeTypeNumber(dataRow[this.columns[x + '_ibnr']])))
                .reduce((ps: number, s: number) => ps + s, 0)) /
            (safeTypeNumber(dataRow[this.columns['uw_data.GEP_AMOUNT']]) -
              this.commissionColumns
                .map((x) => safeTypeNumber(dataRow[this.columns[x]]))
                .reduce((ps: number, s: number) => ps + s, 0)))
      : (ans = 0);
    
    
    return ans;
  }
}
