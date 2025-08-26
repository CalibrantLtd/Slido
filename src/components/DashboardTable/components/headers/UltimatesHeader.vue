<script setup lang="ts">
import { computed } from 'vue';
import { useDashboardStore } from '@/store/dashboard';
import { usePortfolioStore } from '@/store/portfolio';
import type { NumericDictionary, BooleanDictionary } from '@/types/common';
import toTitleCase from '@/utils/toTitleCase';
import '../../dashboardTable.css';

const dashboardStore = useDashboardStore();
const portfolioStore = usePortfolioStore();

const emit = defineEmits(['onChangeMargin', 'onChangeTotalMargin', 'onChangeShowColumn', 'onChangeShowColumnTotal']);

const props = defineProps<{
  margin: NumericDictionary;
  showColumn: BooleanDictionary;
  showColumnTotal: boolean;
  totalMargin: number;
  leftColumnSize: number;
}>();

const visibleColumns = computed(() => dashboardStore.visibleColumns);

function onClickColumn(item: string) {
  emit('onChangeShowColumn', { val: !props.showColumn[item], item: item });
  emit('onChangeMargin', { val: 112 - props.margin[item], item: item });
}

function onClickTotalColumn() {
  emit('onChangeShowColumnTotal', !props.showColumnTotal);
  emit('onChangeTotalMargin', 112 - props.totalMargin);
}

const claimsType = computed<string[]>(() => portfolioStore.parameters.claims_nature);
</script>
<template>
  <template v-for="(item, index) in claimsType" :key="index">
    <th
      class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
      :style="{
        top: '30px',
        height: '60px',
        left:
          112 * (leftColumnSize + index) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, index)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out transform',
        transform: 'translateX(' + margin[item] * 0 + 'px)',
      }"
      @click="onClickColumn(item)"
    >
      Paid
    </th>
    <th
      class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
      :style="{
        top: '30px',
        height: '60px',
        left:
          112 * (leftColumnSize + index) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, index)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out transform',
        transform: 'translateX(' + margin[item] * 1 + 'px)',
      }"
      @click="onClickColumn(item)"
    >
      O/S
    </th>
    <th
      class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
      :style="{
        top: '30px',
        height: '60px',
        left:
          112 * (leftColumnSize + index) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, index)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out transform',
        transform: 'translateX(' + margin[item] * 2 + 'px)',
      }"
      @click="onClickColumn(item)"
    >
      Incurred
    </th>
    <th
      v-if="visibleColumns?.includes(3)"
      class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
      :style="{
        top: '30px',
        height: '60px',
        left:
          112 * (leftColumnSize + index) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, index)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw' ? 5 : 4) +
          'px',
        transition: '0.5s ease-out transform',
        transform: 'translateX(' + margin[item] * 3 + 'px)',
      }"
      @click="onClickColumn(item)"
    >
      IBNR
    </th>
    <th
      v-if="
        dashboardStore.underwriting_loss_ratios == 'Written' &&
        dashboardStore.dashboards.uw_acc == 'uw' &&
        visibleColumns?.includes(3)
      "
      class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
      :style="{
        top: '30px',
        height: '60px',
        left:
          112 * (leftColumnSize + index) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, index)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw' ? 5 : 4) +
          'px',
        transition: '0.5s ease-out transform',
        transform: 'translateX(' + margin[item] * 4 + 'px)',
      }"
      @click="onClickColumn(item)"
    >
      Unearned
    </th>
    <th
      v-if="visibleColumns?.includes(3)"
      class="fixWidth header-teal text-red-500 absolute z-10 cursor-pointer"
      :style="{
        top: '30px',
        height: '60px',
        left:
          112 * (leftColumnSize + index) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, index)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw' ? 5 : 4) +
          'px',
        transition: '0.5s ease-out transform',
        transform:
          'translateX(' +
          margin[item] *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw' ? 5 : 4) +
          'px)',
      }"
      :class="showColumn[item] ? 'pt-9' : 'pt-5'"
      @click="onClickColumn(item)"
    >
      Ultimate
    </th>
    <div
      class="fixWidth absolute z-20 text-red-500 header-teal cursor-pointer"
      :class="showColumn[item] ? 'pt-1' : 'pt-3'"
      style="top: 30px"
      :style="{
        left:
          112 * (leftColumnSize + index) -
          dashboardStore.offMarginGWPGEP +
          (<any>Object)
            .values(margin)
            .slice(0, index)
            .reduce((ps: number, s: number) => ps + s, 0) *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        height: 30 + ((112 - margin[item]) / 112) * 30 + 'px',
        width:
          112 +
          margin[item] *
            (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
              ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
              : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
          'px',
        transition: '0.5s ease-out all',
      }"
      @click="onClickColumn(item)"
    >
      {{ toTitleCase(item) }}<br />{{
        !showColumn[item] ? (visibleColumns?.includes(3) ? 'Ultimate' : 'Incurred') : ''
      }}
    </div>
  </template>

  <th
    class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
    :style="{
      top: '30px',
      height: '60px',
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
    @click="onClickTotalColumn"
  >
    Paid
  </th>
  <th
    class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
    :style="{
      top: '30px',
      height: '60px',
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
    @click="onClickTotalColumn"
  >
    O/S
  </th>
  <th
    class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
    :style="{
      top: '30px',
      height: '60px',
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
    @click="onClickTotalColumn"
  >
    Incurred
  </th>
  <th
    v-if="visibleColumns?.includes(3)"
    class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
    :style="{
      top: '30px',
      height: '60px',
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw' ? 5 : 4) +
        'px',
      transition: '0.5s ease-out all',
      transform: 'translateX(' + totalMargin * 3 + 'px)',
    }"
    @click="onClickTotalColumn"
  >
    IBNR
  </th>
  <th
    v-if="
      dashboardStore.underwriting_loss_ratios == 'Written' &&
      dashboardStore.dashboards.uw_acc == 'uw' &&
      visibleColumns?.includes(3)
    "
    class="fixWidth header-teal text-red-500 absolute z-10 pt-9 cursor-pointer"
    :style="{
      top: '30px',
      height: '60px',
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw' ? 5 : 4) +
        'px',
      transition: '0.5s ease-out all',
      transform: 'translateX(' + totalMargin * 4 + 'px)',
    }"
    @click="onClickTotalColumn"
  >
    Unearned
  </th>
  <th
    v-if="visibleColumns?.includes(3)"
    class="fixWidth header-teal text-red-500 absolute z-10 cursor-pointer"
    :class="showColumnTotal ? 'pt-9' : 'pt-5'"
    :style="{
      top: '30px',
      height: '60px',
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw' ? 5 : 4) +
        'px',
      transition: '0.5s ease-out all',
      transform:
        'translateX(' +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw' ? 5 : 4) +
        'px)',
    }"
    @click="onClickTotalColumn"
  >
    Ultimate
  </th>
  <div
    class="fixWidth absolute z-20 text-red-500 header-teal cursor-pointer"
    :class="showColumnTotal ? 'pt-1' : 'pt-3'"
    style="top: 30px"
    :style="{
      left:
        112 * (leftColumnSize + claimsType.length) -
        dashboardStore.offMarginGWPGEP +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      height: 30 + ((112 - totalMargin) / 112) * 30 + 'px',
      width:
        112 +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      transition: '0.5s ease-out all',
    }"
    @click="onClickTotalColumn"
  >
    Total<br />{{ !dashboardStore.visibleColumns?.includes(3) ? 'Incurred' : !showColumnTotal ? 'Ultimate' : '' }}
  </div>
</template>
