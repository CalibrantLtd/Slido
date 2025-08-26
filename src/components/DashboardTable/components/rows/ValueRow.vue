<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDashboardStore } from '@/store/dashboard';
import { usePortfolioStore } from '@/store/portfolio';
import '../../dashboardTable.css';
import type { NumericDictionary, BooleanDictionary } from '@/types/common';
import { numberWithCommas, numberWithCommasOrRatios, decimalToPercentage } from '@/utils/numberFormatter';
import ClaimsCalculation from '../../../../calculations/Claims/ClaimsCalculation';
import type { DashboardData } from '@/types/dashboard';
import { safeTypeNumber } from '@/utils/calculationHelper';
import moment from 'moment';
import generateRandomKey from '@/utils/generateRandomKey';

const dashboardStore = useDashboardStore();
const portfolioStore = usePortfolioStore();

const visibleColumns = computed(() => dashboardStore.visibleColumns);
const ratioAmount = computed(() => dashboardStore.dashboards.ratio_amount);
const isBindedYears = computed<boolean>(() => dashboardStore.isBindedYears);
const dashboardDataColumn = computed(() => dashboardStore.dashboard_data_column);
const claimsType = computed<string[]>(() => portfolioStore.parameters.claims_nature || ['ATTRITIONAL', 'LARGE']);
const maxSeasonality = computed(
  () => dashboardStore.seasonality_parameters?.map((x) => Math.max(...x.map((y) => Math.abs(1 - y))))
);

const props = withDefaults(
  defineProps<{
    rowIndex: number;
    margin: NumericDictionary;
    showColumn: BooleanDictionary;
    showColumnTotal: boolean;
    totalMargin: number;
    totalMarginCcr: number;
    dashboardData: DashboardData;
    isTotal: boolean;
    rowClass: string;
    isTotalRow: boolean;
    leftColumnSize: number;
    mqy: string;
  }>(),
  { isTotal: false, rowIndex: 0 }
);

function openClaimsInformation(type: string, period: string, dateUnit = 'month') {
  if (dateUnit == 'quarter') {
    period = moment(period, '[Q]Q-YYYY').format('MMM-YYYY');
  } else if (dateUnit == 'year') {
    period = moment(period, 'YYYY').format('MMM-YYYY');
  }
  if (type == 'ATTRITIONAL' || type == 'All') {
    claimsAttritionalInformation(period, dateUnit, type);
  } else {
    claimsOthersInformation(period, type, dateUnit);
  }
}

async function claimsOthersInformation(period: string, type: string, dateUnit: string) {
  dashboardStore.onSetClaimsOthersInformationModal(true);
  await dashboardStore.claimsOthersInformation(period, type, dateUnit);
}

async function claimsAttritionalInformation(period: string, dateUnit: string, type: string) {
  await dashboardStore.claimsAttritionalInformation(period, dateUnit, type);
}

function gwpNwpAmount(index: number, isValue: boolean) {
  if (dashboardStore.dashboards.gwpnwp == 'NWP') {
    return numberWithCommas(claimsCalculation.value.gwpNWPAmount(index, 'NWP'), isValue);
  } else {
    return numberWithCommas(claimsCalculation.value.gwpNWPAmount(index, 'GWP'), isValue);
  }
}

function gepNepAmount(index: number, isValue: boolean) {
  if (dashboardStore.dashboards.gwpnwp == 'NWP') {
    return numberWithCommas(claimsCalculation.value.nepAmount(index), isValue);
  } else {
    return numberWithCommas(claimsCalculation.value.gepAmount(index), isValue);
  }
}

const claimsCalculation = ref<ClaimsCalculation>(
  new ClaimsCalculation(props.dashboardData, dashboardDataColumn.value, claimsType.value)
);

watch(
  () => props.dashboardData,
  () => {
    claimsCalculation.value = new ClaimsCalculation(props.dashboardData, dashboardDataColumn.value, claimsType.value);
  },
  { deep: true }
);
</script>
<template>
  <td class="fixWidth sticky left-0 z-20 side-teal month-col" :class="{ [rowClass]: true }">
    {{
      mqy == 'month'
        ? dashboardData[rowIndex][0]
        : mqy == 'quarter'
        ? dashboardData[rowIndex][0] +
          (['Mar', 'Jun', 'Sep', 'Dec', 'Total'].some((substring: string) =>
            String(dashboardData[rowIndex][1]).includes(substring)
          )
            ? ''
            : ' QTD')
        : isBindedYears
        ? 'B - ' + dashboardData[rowIndex][0]
        : dashboardData[rowIndex][0] + ' ' + (String(dashboardData[rowIndex][1]).includes('Dec') || isTotal ? '' : 'YTD')
    }}
  </td>
  <td
    v-if="visibleColumns?.includes(1)"
    data-testid="gwp-nwp-value"
    class="fixWidth bg-white text-sybil-teal"
    :class="{
      [rowClass]: true,
    }"
  >
    {{ gwpNwpAmount(rowIndex, false) }}
  </td>
  <template v-if="portfolioStore.getExposureLength() > 0 && dashboardStore.isShowingExposure">
    <td
      class="fixWidth bg-white text-sybil-teal"
      :class="{
        [rowClass]: true,
      }"
    >
      {{ numberWithCommas(claimsCalculation.exposure(rowIndex, portfolioStore.parameters['exposure'][0] as any), false) }}
    </td>
    <td
      class="fixWidth bg-white text-sybil-teal"
      :class="{
        [rowClass]: true,
      }"
    >
      {{ numberWithCommas(claimsCalculation.averageGWP(rowIndex), false) }}
    </td>
    <td
      v-for="(i, idx) in portfolioStore.parameters['exposure'].slice(1)"
      :key="generateRandomKey(idx)"
      class="fixWidth bg-white text-sybil-teal"
      :class="{
        [rowClass]: true,
      }"
    >
      {{ numberWithCommas(claimsCalculation.exposure(rowIndex, i as any), false) }}
    </td>
  </template>
  <td
    v-if="visibleColumns?.includes(2)"
    data-testid="gep-nep-value"
    class="fixWidth bg-white text-sybil-teal"
    :class="{
      [rowClass]: true,
    }"
  >
    {{ gepNepAmount(rowIndex, false) }}
  </td>

  <template v-for="(item, idx_claims) in claimsType" :key="generateRandomKey(idx_claims)">
    <td
      class="fixWidth text-red-500 bg-gray-50 absolute z-10"
      :data-testid="'paid' + '-' + item.toLowerCase()"
      :class="{ 'cursor-pointer': isBindedYears, [rowClass]: true }"
      :style="{
        left:
          112 * (leftColumnSize + idx_claims) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, idx_claims)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out all',
        transform: 'translateX(' + margin[item] * 0 + 'px)',
      }"
      @click="
        isTotalRow
          ? openClaimsInformation('All', '', 'total')
          : isBindedYears
          ? ''
          : openClaimsInformation(item, String(dashboardData[rowIndex][dashboardDataColumn['months.MONTH']]), mqy)
      "
    >
      {{
        numberWithCommasOrRatios(
          claimsCalculation.paid(rowIndex, item),
          safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
          ratioAmount == 'amount'
        )
      }}
    </td>
    <td
      class="fixWidth text-red-500 bg-gray-50 absolute z-10"
      :class="{ 'cursor-pointer': !isBindedYears, [rowClass]: true }"
      :style="{
        left:
          112 * (leftColumnSize + idx_claims) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, idx_claims)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out all',
        transform: 'translateX(' + margin[item] * 1 + 'px)',
      }"
      @click="
        isBindedYears
          ? ''
          : isTotalRow
          ? openClaimsInformation('All', '', 'total')
          : openClaimsInformation(item, String(dashboardData[rowIndex][dashboardDataColumn['months.MONTH']]), mqy)
      "
    >
      {{
        numberWithCommasOrRatios(
          claimsCalculation.os(rowIndex, item),
          safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
          ratioAmount == 'amount'
        )
      }}
    </td>
    <td
      class="fixWidth text-red-500 bg-gray-50 absolute z-10"
      :data-testid="'incurred' + '-' + item.toLowerCase()"
      :class="{ 'cursor-pointer': !isBindedYears, [rowClass]: true }"
      :style="{
        left:
          112 * (leftColumnSize + idx_claims) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, idx_claims)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out all',
        transform: 'translateX(' + margin[item] * 2 + 'px)',
      }"
      @click="
        isBindedYears
          ? ''
          : isTotalRow
          ? openClaimsInformation('All', '', 'total')
          : openClaimsInformation(item, String(dashboardData[rowIndex][dashboardDataColumn['months.MONTH']]), mqy)
      "
    >
      {{
        numberWithCommasOrRatios(
          claimsCalculation.incurred(rowIndex, item),
          safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
          ratioAmount == 'amount'
        )
      }}
    </td>
    <td
      v-if="visibleColumns?.includes(3)"
      class="fixWidth text-red-500 bg-gray-50 absolute z-10"
      :class="{
        [rowClass]: true,
      }"
      :style="{
        left:
          112 * (leftColumnSize + idx_claims) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, idx_claims)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out all',
        transform: 'translateX(' + margin[item] * 3 + 'px)',
      }"
    >
      {{
        numberWithCommasOrRatios(
          claimsCalculation.ibnr(rowIndex, item),
          safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
          ratioAmount == 'amount'
        )
      }}
    </td>
    <td
      v-if="
        dashboardStore.underwriting_loss_ratios == 'Written' &&
        dashboardStore.dashboards.uw_acc == 'uw' &&
        visibleColumns?.includes(3)
      "
      class="fixWidth text-red-500 bg-red-50 absolute z-10"
      :class="{
        [rowClass]: true,
      }"
      :style="{
        left:
          112 * (leftColumnSize + idx_claims) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, idx_claims)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out all',
        transform: 'translateX(' + margin[item] * 4 + 'px)',
      }"
    >
      {{
        numberWithCommasOrRatios(
          claimsCalculation.unearned(rowIndex, item),
          parseFloat(
            (
              safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uws.GWP_SUM']]) -
              safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']])
            ).toFixed(0)
          ),
          ratioAmount == 'amount'
        )
      }}
    </td>
    <td
      v-if="visibleColumns?.includes(3)"
      class="fixWidth text-red-500 bg-white absolute z-10"
      :class="{ 'cursor-pointer': !isBindedYears, [rowClass]: true }"
      :style="{
        left:
          112 * (leftColumnSize + idx_claims) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, idx_claims)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out all',
        transform:
          'translateX(' +
          margin[item] *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px)',
      }"
      @click="
        isBindedYears
          ? ''
          : isTotalRow
          ? openClaimsInformation(item, '', 'total')
          : openClaimsInformation(item, String(dashboardData[rowIndex][dashboardDataColumn['months.MONTH']]), mqy)
      "
    >
      {{
        dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
          ? numberWithCommasOrRatios(
              claimsCalculation.ultimate(
                rowIndex,
                dashboardStore.dashboards.uw_acc,
                dashboardStore.underwriting_loss_ratios,
                item
              ),
              parseFloat(safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uws.GWP_SUM']]).toFixed(0)),
              ratioAmount == 'amount'
            )
          : numberWithCommasOrRatios(
              claimsCalculation.ultimate(
                rowIndex,
                dashboardStore.dashboards.uw_acc,
                dashboardStore.underwriting_loss_ratios,
                item
              ),
              safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
              ratioAmount == 'amount'
            )
      }}
    </td>
  </template>

  <td
    class="fixWidth text-red-500 bg-gray-50 absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
      transform: 'translateX(' + totalMargin * 0 + 'px)',
    }"
  >
    {{
      numberWithCommasOrRatios(
        claimsCalculation.paidTotal(rowIndex),
        safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
        ratioAmount == 'amount'
      )
    }}
  </td>
  <td
    class="fixWidth text-red-500 bg-gray-50 absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
      transform: 'translateX(' + totalMargin * 1 + 'px)',
    }"
  >
    {{
      numberWithCommasOrRatios(
        claimsCalculation.osTotal(rowIndex),
        safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
        ratioAmount == 'amount'
      )
    }}
  </td>
  <td
    class="fixWidth text-red-500 bg-gray-50 absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
      transform: 'translateX(' + totalMargin * 2 + 'px)',
    }"
  >
    {{
      numberWithCommasOrRatios(
        claimsCalculation.incurredTotal(rowIndex),
        safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
        ratioAmount == 'amount'
      )
    }}
  </td>
  <td
    v-if="visibleColumns?.includes(3)"
    class="fixWidth text-red-500 bg-gray-50 absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
      transform: 'translateX(' + totalMargin * 3 + 'px)',
    }"
  >
    {{
      numberWithCommasOrRatios(
        claimsCalculation.ibnrTotal(rowIndex),
        safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
        ratioAmount == 'amount'
      )
    }}
  </td>
  <td
    v-if="
      dashboardStore.underwriting_loss_ratios == 'Written' &&
      dashboardStore.dashboards.uw_acc == 'uw' &&
      visibleColumns?.includes(3)
    "
    class="fixWidth text-red-500 bg-red-50 absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
      transform: 'translateX(' + totalMargin * 4 + 'px)',
    }"
  >
    {{
      numberWithCommasOrRatios(
        claimsCalculation.unearnedTotal(rowIndex),
        parseFloat(
          (
            safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uws.GWP_SUM']]) -
            safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']])
          ).toFixed(0)
        ),
        ratioAmount == 'amount'
      )
    }}
  </td>
  <td
    v-if="visibleColumns?.includes(3)"
    class="fixWidth text-red-500 bg-white absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
      transform:
        'translateX(' +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px)',
    }"
  >
    {{
      dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
        ? numberWithCommasOrRatios(
            claimsCalculation.ultimateTotal(
              rowIndex,
              dashboardStore.dashboards.uw_acc,
              dashboardStore.underwriting_loss_ratios
            ),
            safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uws.GWP_SUM']]),
            ratioAmount == 'amount'
          )
        : numberWithCommasOrRatios(
            claimsCalculation.ultimateTotal(
              rowIndex,
              dashboardStore.dashboards.uw_acc,
              dashboardStore.underwriting_loss_ratios
            ),
            safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
            ratioAmount == 'amount'
          )
    }}
  </td>

  <td
    v-if="visibleColumns?.includes(4)"
    class="fixWidth bg-white text-teal-400 absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + 1 + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
    }"
  >
    {{
      numberWithCommasOrRatios(
        claimsCalculation.commission(rowIndex),
        safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
        false
      )
    }}
  </td>
  <td
    v-if="visibleColumns?.includes(3)"
    data-testid="ccr-nlr"
    class="fixWidth bg-white absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + 2 + claimsType.length) -
        dashboardStore.offMarginAprioriCCR +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
    }"
  >
    {{
      decimalToPercentage(
        claimsCalculation.ccrNlr(
          rowIndex,
          dashboardStore.dashboards.uw_acc,
          dashboardStore.underwriting_loss_ratios,
          dashboardStore.dashboards.ccr_nlr
        ),
        false
      )
    }}
  </td>
  <td
    v-if="visibleColumns?.includes(3)"
    class="fixWidth bg-white text-orange-900 absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + 3 + claimsType.length) -
        dashboardStore.offMarginAprioriCCR +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
    }"
  >
    {{
      decimalToPercentage(
        claimsCalculation.normalisedCCRNLR(
          rowIndex,
          dashboardStore.dashboards.uw_acc,
          dashboardStore.underwriting_loss_ratios,
          (claimsType || []).filter((_: string, index: number) => dashboardStore.normalise[index]),
          dashboardStore.dashboards.ccr_nlr,
          dashboardStore.dashboards.seasonFactor
        ),
        false
      )
    }}
  </td>
  <td
    v-if="visibleColumns?.includes(5)"
    data-testid="seas-adj-ccr-nlr"
    class="fixWidth bg-white absolute z-10"
    :class="{ [rowClass]: true }"
    :style="{
      left:
        112 * (leftColumnSize + 4 + claimsType.length) -
        dashboardStore.offMarginAprioriCCR +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
    }"
  >
    {{
      decimalToPercentage(
        claimsCalculation.seasAdjustedCCRNLR(
          rowIndex,
          dashboardStore.dashboards.uw_acc,
          dashboardStore.underwriting_loss_ratios,
          dashboardStore.dashboards.seasonFactor,
          dashboardStore.dashboards.ccr_nlr
        ),
        false
      )
    }}
  </td>
  <template v-if="visibleColumns?.includes(5)">
    <template v-for="(i, idx_claims) in claimsType" :key="generateRandomKey(idx_claims)">
      <td
        v-if="totalMarginCcr == 112"
        data-testid="seas-adj-apriori-ccr-nlr"
        class="fixWidth bg-white absolute z-10"
        :class="{ [rowClass]: true }"
        :style="{
          left:
            112 * (leftColumnSize + 4 + idx_claims * 2 + 1 + claimsType.length) -
            dashboardStore.offMarginAprioriCCR +
            (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
              (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
                ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
                : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
            totalMargin *
              (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
                ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
                : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
            'px',
          transition: '0.5s ease-out all',
        }"
      >
        {{
          numberWithCommasOrRatios(
            claimsCalculation.seasAdjApriori(
              rowIndex,
              dashboardStore.dashboards.uw_acc,
              dashboardStore.underwriting_loss_ratios,
              dashboardStore.dashboards.seasonFactor,
              i
            ),
            safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.GEP_AMOUNT']]),
            false
          )
        }}
      </td>

      <td
        v-if="totalMarginCcr == 112"
        class="fixWidth bg-white absolute z-10"
        :class="{ [rowClass]: true }"
        :style="{
          left:
            112 * (leftColumnSize + 4 + idx_claims * 2 + 2 + claimsType.length) -
            dashboardStore.offMarginAprioriCCR +
            (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
              (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
                ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
                : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
            totalMargin *
              (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
                ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
                : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
            'px',
          transition: '0.5s ease-out all',
        }"
      >
        <div
          v-if="
            maxSeasonality[idx_claims] != 0 &&
            dashboardData[rowIndex][dashboardDataColumn['uw_data.' + i + '_seasonality']] != 1 &&
            !(dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw')
          "
          class="bg-red-300 h-1 absolute bottom-4"
          :style="{
            width:
              (Math.abs(
                1 - safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.' + i + '_seasonality']])
              ) *
                56) /
                maxSeasonality[idx_claims] +
              'px',
            'margin-left':
              safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.' + i + '_seasonality']]) < 1
                ? 56 -
                  (Math.abs(
                    1 - safeTypeNumber(dashboardData[rowIndex][dashboardDataColumn['uw_data.' + i + '_seasonality']])
                  ) *
                    56) /
                    maxSeasonality[idx_claims] +
                  'px'
                : '56px',
          }"
        ></div>
        <p class="item">
          {{
            claimsCalculation
              .seasonality(rowIndex, dashboardStore.dashboards.uw_acc, dashboardStore.underwriting_loss_ratios, i)
              .toFixed(2)
          }}
        </p>
      </td>
    </template>
  </template>
</template>
