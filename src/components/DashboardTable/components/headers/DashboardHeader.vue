<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { icons } from '@/plugins/icon';
import toTitleCase from '@/utils/toTitleCase';
import { useDashboardStore } from '@/store/dashboard';
import { usePortfolioStore } from '@/store/portfolio';
import type { NumericDictionary } from '@/types/common';
import '../../dashboardTable.css';

const dashboardStore = useDashboardStore();
const portfolioStore = usePortfolioStore();

defineProps<{
  totalMarginCcr: number;
  margin: NumericDictionary;
  totalMargin: number;
  leftColumnSize: number;
}>();
// computed values from stores
const isBindedYears = computed<boolean>(() => dashboardStore.isBindedYears);
const ratioAmount = computed(() => dashboardStore.dashboards.ratio_amount);
const claimsType = computed<string[]>(() => portfolioStore.parameters.claims_nature);
const normaliseSelection = computed<boolean[]>(() => portfolioStore.normaliseSelection);
const seasonFactor = computed<boolean>(() => dashboardStore.dashboards.seasonFactor);
const normalise = computed<boolean[]>(() => portfolioStore.normalise);
const ccrnlr = computed<string>(() => dashboardStore.dashboards.ccr_nlr);
const visibleColumns = computed(() => dashboardStore.visibleColumns);

function capitalizeFirstLetter(val: any) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function removeBandFromName(name: string) {
  return name.replace(/Band/g, '');
}


function changeSeas() {
  dashboardStore.changeSeas();
}

function switchRatiosAmount() {
  dashboardStore.switch_ratio_amount();
}

function onChangeNormalised(index: number, val: boolean) {
  portfolioStore.setNormalisedSelection(index, val);
}


function changeCurrData() {
  dashboardStore.change_uw_acc();
}

function changeCurrentDispDate() {
  dashboardStore.change_mqy();
}

function changegwpnwp() {
  dashboardStore.switch_gwpnwp_amount();
}

function changeccrnlr() {
  dashboardStore.changeccrnlr();
}
const periodRightClick = ref(false);

function handleRightClick(event: any) {
  if (rightClickMenu.value) {
    rightClickMenu.value.showMenu(event);
  }
  periodRightClick.value = true;
}

function handleClickAnywhere() {
  periodRightClick.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleClickAnywhere);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickAnywhere);
});

const rightClickMenu = ref<{ showMenu: (event: MouseEvent) => void } | null>(null);

function setDefaultPeriod() {
  if (portfolioStore.parameters['default_dashboard']) {
    const oldParameters = structuredClone(portfolioStore.parameters);
    portfolioStore.parameters['default_dashboard'].accident_underwriting = dashboardStore.dashboards.uw_acc;
    portfolioStore.parameters['default_dashboard'].cohort = dashboardStore.dashboards.mqy;

    portfolioStore.saveParameters(oldParameters, 'Saved Parameters');
  }
}

defineEmits(['onChangeCcrMargin']);
</script>

<template>
  <th
    class="fixWidth header-teal left-0 whitespace-nowrap fixHeight z-30 sticky"
    rowspan="2"
    @contextmenu.prevent.stop="handleRightClick($event)"
  >
    <p class="cursor-pointer item" data-testid="uw-acc-bespoke" @click="changeCurrData()">
      {{ { uw: isBindedYears ? 'Bespoke' : 'Underwriting', acc: 'Accident' }[dashboardStore.dashboards.uw_acc] }}
    </p>
    <p class="cursor-pointer item" data-testid="dashboard-mqy" @click="changeCurrentDispDate()">
      {{ toTitleCase(dashboardStore.dashboards.mqy) }}
    </p>
    <div v-if="periodRightClick" class="absolute -right-10 py-2 bg-gray-200 shadow-md rounded-sm">
      <span
        class="hover:bg-sybil-teal hover:bg-opacity-10 hover:text-sybil-teal p-1 px-3 cursor-pointer text-sm"
        @click="setDefaultPeriod"
        >Set as Default</span
      >
    </div>
  </th>
  <th v-if="visibleColumns?.includes(1)" class="fixWidth fixHeight header-teal text-sybil-teal" rowspan="2">
    <div class="cursor-pointer" data-testid="gwp-nwp-col" @click="changegwpnwp()">
      {{ dashboardStore.dashboards.gwpnwp }}
    </div>
    <span v-if="dashboardStore.dashboards.uw_acc == 'acc'" class="italc text-xs"
      >(underwriting {{ dashboardStore.dashboards.mqy }})</span
    >
  </th>
  <template v-if="portfolioStore.getExposureLength() > 0 && dashboardStore.isShowingExposure">
    <th class="fixWidth fixHeight header-teal text-sybil-teal" rowspan="2">
      Total Risk Count
      <span v-if="dashboardStore.dashboards.uw_acc == 'acc'" class="italc text-xs"
        >(underwriting {{ dashboardStore.dashboards.mqy }})</span
      >
    </th>
    <th class="fixWidth fixHeight header-teal text-sybil-teal" rowspan="2">
      Average GWP
      <span v-if="dashboardStore.dashboards.uw_acc == 'acc'" class="italc text-xs"
        >(underwriting {{ dashboardStore.dashboards.mqy }})</span
      >
    </th>
    <th
      v-for="(i, idx) in portfolioStore.parameters['exposure'].slice(1)"
      :key="'exposure' + idx"
      class="fixWidth fixHeight header-teal text-sybil-teal"
      rowspan="2"
    >
      {{ capitalizeFirstLetter(i['method'] == 'sum' ? 'Total' : i['method']) }} {{ removeBandFromName(i['name']) }}
      <span v-if="dashboardStore.dashboards.uw_acc == 'acc'" class="italc text-xs"
        >(underwriting {{ dashboardStore.dashboards.mqy }})</span
      >
    </th>
  </template>
  <th v-if="visibleColumns?.includes(2)" class="fixWidth fixHeight header-teal text-sybil-teal" rowspan="2">
    <div class="cursor-pointer" data-testid="gep-nep-col" @click="changegwpnwp()">
      {{ dashboardStore.dashboards.gwpnwp.replace('W', 'E') }}
    </div>
  </th>
  <th
    class="lrfixWidth header-teal text-red-500 pt-1"
    :colspan="
      claimsType.length +
      1 +
      ((<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) / 112) * 4 +
      (totalMargin / 112) * 4
    "
    :style="{
      width:
        112 * (claimsType.length + 1) -
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
      'min-width':
        112 * (claimsType.length + 1) +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      'max-width':
        112 * (claimsType.length + 1) +
        (<any>Object).values(margin).reduce((ps: number, s: number) => ps + s, 0) *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        totalMargin *
          (dashboardStore.underwriting_loss_ratios == 'Written' && dashboardStore.dashboards.uw_acc == 'uw'
            ? 5 - (visibleColumns?.includes(3) ? 0 : 3)
            : 4 - (visibleColumns?.includes(3) ? 0 : 2)) +
        'px',
      height: '30px',
      transition: '0.5s ease-out',
    }"
  >
    <p v-if="dashboardStore.dashboards.uw_acc == 'acc'" style="display: inline">Earned</p>
    <p
      v-if="dashboardStore.dashboards.uw_acc == 'uw'"
      style="display: inline"
      class="cursor-pointer lossRatioItem"
      @click="dashboardStore.underwritingLossRatiosChange()"
    >
      {{ dashboardStore.underwriting_loss_ratios + ' ' }}
    </p>
    Loss
    <p
      class="cursor-pointer lossRatioItem"
      data-testid="switch-ratio"
      style="display: inline"
      @click="switchRatiosAmount()"
    >
      {{ ' ' + toTitleCase(ratioAmount) }}
    </p>
  </th>

  <th v-if="visibleColumns?.includes(4)" class="fixWidth header-teal z-20 text-teal-400" rowspan="2">Comm.</th>
  <th v-if="visibleColumns?.includes(3)" class="fixWidth header-teal z-20" rowspan="2">
    <div class="cursor-pointer" @click="changeccrnlr()">
      <p v-if="dashboardStore.dashboards.uw_acc == 'acc'">Earned</p>
      <p v-else>
        {{ dashboardStore.underwriting_loss_ratios }}
      </p>
      {{ ccrnlr }}
    </div>
  </th>

  <th v-if="visibleColumns?.includes(3)" class="fixWidth header-teal z-20 text-orange-900" rowspan="2">
    <div>
      <div class="normalise-dropdown">
        {{
          claimsType
            .slice(1)
            .filter((x: string, i: number) => normalise[i] == true)
            .map((x: any) =>
              normaliseSelection.filter((e: any) => e == true).length <= 1 ? toTitleCase(x) : toTitleCase(x).slice(0, 1)
            )
            .join(', ')
        }}
        <div class="normalise-options" style="display: none;">
          <div v-for="(item, index) in claimsType.slice(1)" :key="index" class="normalise-option">
            <input
              type="checkbox"
              :id="`normalise-${index}`"
              :checked="normaliseSelection[index]"
              :disabled="normaliseSelection.filter((e) => e == true).length <= 1 && normaliseSelection[index]"
              @change="(e) => onChangeNormalised(index, (e.target as HTMLInputElement).checked)"
            />
            <label :for="`normalise-${index}`">{{ item }}</label>
          </div>
        </div>
      </div>
      <br />Normalised <br />
      <p v-if="dashboardStore.dashboards.uw_acc == 'acc'">Earned</p>
      <p v-else>
        {{ dashboardStore.underwriting_loss_ratios }}
      </p>

      <div class="cursor-pointer" @click="changeccrnlr()">
        {{ ccrnlr }}
      </div>
    </div>
  </th>
  <th v-if="visibleColumns?.includes(5)" class="fixWidth header-teal z-20" rowspan="2" style="height: 90px">
    <p
      v-if="!seasonFactor"
      class="cursor-pointer item"
      style="display: inline"
      @click="changeSeas()"
    >
      No Seas.
    </p>
    <p
      v-if="seasonFactor"
      class="cursor-pointer item"
      style="display: inline"
      @click="changeSeas()"
    >
      Seas.
    </p>
    Adj.
    <p class="cursor-pointer">A-priori</p>
    <div class="cursor-pointer" @click="changeccrnlr()">
      {{ ccrnlr }}
    </div>
    <span v-if="totalMarginCcr == 0" class="cursor-pointer" @click="$emit('onChangeCcrMargin', 112 - totalMarginCcr)"
      ><component :is="icons.RiArrowRightLine"
    /></span>
    <span
      v-if="totalMarginCcr == 112"
      class="cursor-pointer"
      @click="$emit('onChangeCcrMargin', 112 - totalMarginCcr)"
      ><component :is="icons.RiArrowLeftLine"
    /></span>
  </th>
  <template v-if="visibleColumns?.includes(5)">
    <template v-for="(i, idx_claims) in claimsType" :key="idx_claims">
      <th
        v-if="totalMarginCcr == 112"
        class="fixWidth header-teal z-10"
        rowspan="2"
        :class="seasonFactor ? '' : 'pb-5'"
      >
        {{ seasonFactor ? 'Seas. adj.' : ' ' }}<br />
        {{ toTitleCase(i) }}
        <br />
        {{ idx_claims == 0 ? ' A-priori' : ' Load' }}
      </th>

      <th v-if="totalMarginCcr == 112" class="fixWidth header-teal z-10" rowspan="2">
        <p class="item">{{ toTitleCase(i) }}<br />Seasonality</p>
      </th>
    </template>
  </template>
</template>
