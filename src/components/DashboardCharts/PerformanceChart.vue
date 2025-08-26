<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as am5 from '@amcharts/amcharts5/index';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5plugins_exporting from '@amcharts/amcharts5/plugins/exporting';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

interface ChartDataPoint {
  date: string;
  gwp: number;
  gep: number;
  apriori: number;
  target?: number;
  ccr: number;
  incurred: number;
  comp_apriori?: number;
  comp_ccr?: number;
  comp_incurred?: number;
  null?: number;
}

interface Props {
  chartData: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  showSeasonality?: boolean;
  showTarget?: boolean;
  isGLR?: boolean;
  isNormalised?: boolean;
  claimsType?: string[];
  normalise?: boolean[];
  ccrnlr?: string;
  uwAcc?: 'uw' | 'acc';
  mqy?: string;
  isAve?: boolean;
  gwpnwp?: string;
  showGwpBars?: boolean;
  showGepBars?: boolean;
  showSeasonalityApriori?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Results',
  subtitle: '',
  showSeasonality: false,
  showTarget: false,
  isGLR: false,
  isNormalised: false,
  claimsType: () => [],
  normalise: () => [],
  ccrnlr: 'GLR',
  uwAcc: 'uw',
  mqy: 'month',
  isAve: false,
  gwpnwp: 'GWP',
  showGwpBars: true,
  showGepBars: true,
  showSeasonalityApriori: true,
})

const showSeasonality = ref(props.showSeasonality)
const isGLR = ref(props.isGLR)
const isNormalised = ref(props.isNormalised)
const accidentUnderwriting = ref(props.uwAcc)
const timePeriod = ref(props.mqy);

let root: am5.Root | null = null;
let titleLabel: am5.Label | null = null;

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function toggleSeasonality() {
  showSeasonality.value = !showSeasonality.value;
  updateChart();
  updateTitle();
}

function toggleGLR() {
  isGLR.value = !isGLR.value;
  updateChart();
  updateTitle();
}

function toggleAccidentUnderwriting() {
  accidentUnderwriting.value = accidentUnderwriting.value === 'uw' ? 'acc' : 'uw';
  updateChart();
  updateTitle();
}

function toggleTimePeriod() {
  const periods = ['month', 'quarter', 'year'];
  const currentIndex = periods.indexOf(timePeriod.value);
  timePeriod.value = periods[(currentIndex + 1) % periods.length];
  updateChart();
  updateTitle();
}

function updateChart() {
  if (root) {
    createChart();
  }
}
function updateTitle() {
  if (!titleLabel) return;
  
  const seasonalityText = props.showSeasonality ? 'Seasonality Adjusted ' : 'No Seas. Adj. ';
  const glrText = props.ccrnlr || 'GLR';
  const accidentText = props.uwAcc === 'acc' ? 'Accident' : 'Underwriting';
  const timeText = props.mqy === 'month' ? 'Month' : props.mqy === 'quarter' ? 'Quarter' : 'Year';
  
  const title = `Actual vs ${seasonalityText}A-priori ${glrText} by ${accidentText} ${timeText}`;
  titleLabel.set("text", title);
}

function createChart() {
  if (root) {
    root.dispose();
  }

  const chartDiv = document.getElementById('chartdiv');
  const containerWidth = chartDiv?.clientWidth || 800;
  const containerHeight = chartDiv?.clientHeight || 600;

  root = am5.Root.new('chartdiv');
  if (root._logo) {
    root._logo.dispose();
  }

  root.setThemes([am5themes_Animated.new(root)]);

  const data = JSON.parse(JSON.stringify(props.chartData));
  let dashboardChart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      layout: root.verticalLayout,
      width: am5.percent(100),
      height: am5.percent(100),
      paddingTop: 5,
      paddingBottom: 5,
      paddingLeft: 5,
      paddingRight: 5,
    })
  );

  let exporting = am5plugins_exporting.Exporting.new(root, {
    menu: am5plugins_exporting.ExportingMenu.new(root, {
      align: 'right',
      valign: 'top',
    }),
  });
  titleLabel = am5.Label.new(root, {
    text: "",
    fontSize: 14,
    textAlign: 'center',
    x: am5.percent(50),
    centerX: am5.percent(50),
  });

  dashboardChart.children.unshift(titleLabel);
  
  dashboardChart.children.unshift(
    am5.Label.new(root, {
      text: 'Results',
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
      x: am5.percent(50),
      centerX: am5.percent(50),
      paddingTop: 0,
      paddingBottom: 0,
    })
  );

  const scrollbarX = am5.Scrollbar.new(root, {
    orientation: 'horizontal',
    height: 6,
  });

  dashboardChart.set('scrollbarX', scrollbarX);
  dashboardChart.bottomAxesContainer.children.push(scrollbarX);

  const scrollbarY = am5.Scrollbar.new(root, {
    orientation: 'vertical',
    width: 6,
  });

  dashboardChart.set('scrollbarY', scrollbarY);
  let xAxis = dashboardChart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: 'date',
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 30,
        cellStartLocation: 0.2,
        cellEndLocation: 0.8,
      }),
      tooltip: am5.Tooltip.new(root, {}),
    })
  );

  xAxis.get('renderer').labels.template.setAll({
    rotation: -90,
    centerY: am5.p50,
    centerX: am5.p50,
    fontSize: 8,
  });

  let yAxis = dashboardChart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {
        opposite: true,
        cellStartLocation: 0,
        minGridDistance: 30,
      }),
      numberFormat: '#.0a',
      tooltip: am5.Tooltip.new(root, {}),
    })
  );

  yAxis.get('renderer').labels.template.setAll({
    fontSize: 8,
  });

  yAxis.get('renderer').grid.template.set('forceHidden', true);

  let yAxis2 = dashboardChart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {
        cellStartLocation: 0,
        minGridDistance: 30,
      }),
      numberFormat: "#'%'",
      min: 0,
      tooltip: am5.Tooltip.new(root, {}),
    })
  );

  yAxis2.get('renderer').labels.template.setAll({
    fontSize: 8,
  });

  let cursor = dashboardChart.set(
    'cursor',
    am5xy.XYCursor.new(root, {
      behavior: 'zoomX',
    })
  );

  let seriesNull = dashboardChart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: '',
      valueYField: 'null',
      categoryXField: 'date',
      xAxis: xAxis,
      yAxis: yAxis,
      legendValueText: '[bold #a00]{categoryX}',
      fill: am5.color(0xffffff),
      stroke: am5.color(0xffffff),
    })
  );

  let seriesGWP = dashboardChart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: props.gwpnwp,
      valueYField: 'gwp',
      categoryXField: 'date',
      xAxis: xAxis,
      yAxis: yAxis,
      legendValueText: "[bold #a00]{valueY.formatNumber('#.0a')}",
      fill: am5.color(0xb5e8d5),
      stroke: am5.color(0xb5e8d5),
      clustered: true,
    })
  );

  let seriesGEP = dashboardChart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: props.gwpnwp.replace('W', 'E'),
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: 'gep',
      categoryXField: 'date',
      legendValueText: "[bold #a00]{valueY.formatNumber('#.0a')}",
      fill: am5.color(0x55b691),
      stroke: am5.color(0xb5e8d5),
      clustered: true,
    })
  );

  seriesGWP.columns.template.setAll({
    width: am5.percent(200),
  });
  seriesGEP.columns.template.setAll({
    width: am5.percent(200),
  });

  if (!props.showGwpBars) {
    seriesGWP.hide();
  }
  if (!props.showGepBars) {
    seriesGEP.hide();
  }
  let seriesSeasonality = dashboardChart.series.push(
    am5xy.LineSeries.new(root, {
      name: (props.showSeasonality ? 'Seasonality Adjusted ' : '') + 'A-priori',
      valueYField: 'apriori',
      categoryXField: 'date',
      xAxis: xAxis,
      yAxis: yAxis2,
      legendValueText: "[bold #a00]{valueY.formatNumber('#.0p')}",
      stroke: am5.color(0xff0000),
    })
  );

  if (props.showTarget && data[0].target && data[0].target != 0) {
    let seriesTarget = dashboardChart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Target',
        valueYField: 'target',
        categoryXField: 'date',
        xAxis: xAxis,
        yAxis: yAxis2,
        legendValueText: "[bold #a00]{valueY.formatNumber('#.0p')}",
        stroke: am5.color(0x000000),
      })
    );
    seriesTarget.strokes.template.setAll({
      strokeDasharray: [3, 3],
    });
    seriesTarget.data.setAll(data);
  }

  seriesSeasonality.strokes.template.setAll({
    strokeWidth: 3,
  });

  if (!props.showSeasonalityApriori) {
    seriesSeasonality.hide();
  }
  let seriesAttritional = dashboardChart.series.push(
    am5xy.LineSeries.new(root, {
      name:
        (props.isNormalised
          ? props.claimsType
              .slice(1)
              .filter((x, i) => props.normalise[i] == true)
              .map((x) => toTitleCase(x))
              .join(', ') + ' Normalised '
          : '') + (props.isGLR ? props.ccrnlr : 'GLR'),
      xAxis: xAxis,
      yAxis: yAxis2,
      valueYField: 'ccr',
      categoryXField: 'date',
      legendValueText: "[bold #a00]{valueY.formatNumber('#.0p')}",
      stroke: am5.color(0x534fc6),
      snapTooltip: true,
    })
  );

  seriesAttritional.bullets.push(function () {
    return am5.Bullet.new(root!, {
      sprite: am5.Circle.new(root!, {
        stroke: am5.color(0x534fc6),
        strokeWidth: 2,
        fill: root!.interfaceColors.get('background'),
        radius: 3,
      }),
    });
  });

  seriesAttritional.strokes.template.setAll({
    strokeWidth: 2,
  });

  let seriesIncurred = dashboardChart.series.push(
    am5xy.LineSeries.new(root, {
      name:
        (props.isNormalised
          ? props.claimsType
              .slice(1)
              .filter((x, i) => props.normalise[i] == true)
              .map((x) => toTitleCase(x))
              .join(', ') + ' Normalised Incurred '
          : 'Incurred ') + (props.isGLR ? props.ccrnlr : 'GLR'),
      xAxis: xAxis,
      yAxis: yAxis2,
      valueYField: 'incurred',
      categoryXField: 'date',
      legendValueText: "[bold #a00]{valueY.formatNumber('#.0p')}",
      stroke: am5.color(0x800080),
      fill: am5.color(0xffffff),
    })
  );

  seriesIncurred.strokes.template.setAll({
    strokeWidth: 2,
  });

  seriesIncurred.hide();

  let comp_seriesSeasonality: am5xy.LineSeries | null = null;
  let comp_seriesAttritional: am5xy.LineSeries | null = null;
  let comp_seriesIncurred: am5xy.LineSeries | null = null;

  if (props.isAve) {
    comp_seriesSeasonality = dashboardChart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Comparator ' + (props.showSeasonality ? 'Seasonality Adjusted ' : '') + 'A-priori',
        valueYField: 'comp_apriori',
        categoryXField: 'date',
        xAxis: xAxis,
        yAxis: yAxis2,
        legendValueText: "[bold #a00]{valueY.formatNumber('#.0p')}",
        stroke: am5.color(0xff0000),
      })
    );

    comp_seriesSeasonality!.strokes.template.setAll({
      strokeDasharray: [7, 7],
    });

    comp_seriesAttritional = dashboardChart.series.push(
      am5xy.LineSeries.new(root, {
        name:
          'Comparator ' +
          (props.isNormalised
            ? props.claimsType
                .slice(1)
                .filter((x, i) => props.normalise[i] == true)
                .map((x) => toTitleCase(x))
                .join(', ') + ' Normalised '
            : '') +
          (props.isGLR ? props.ccrnlr : 'GLR'),
        xAxis: xAxis,
        yAxis: yAxis2,
        valueYField: 'comp_ccr',
        categoryXField: 'date',
        legendValueText: "[bold #a00]{valueY.formatNumber('#.0p')}",
        stroke: am5.color(0x534fc6),
        snapTooltip: true,
      })
    );

    comp_seriesAttritional!.bullets.push(function () {
      let graphics = am5.Rectangle.new(root!, {
        width: 5,
        height: 5,
        centerX: am5.p50,
        centerY: am5.p50,
        stroke: am5.color(0x534fc6),
        strokeWidth: 2,
        fill: am5.color(0xffffff),
      });

      return am5.Bullet.new(root!, {
        sprite: graphics,
      });
    });

    comp_seriesAttritional!.strokes.template.setAll({
      strokeDasharray: [7, 7],
    });

    comp_seriesIncurred = dashboardChart.series.push(
      am5xy.LineSeries.new(root, {
        name:
          'Comparator ' +
          (props.isNormalised
            ? props.claimsType
                .slice(1)
                .filter((x, i) => props.normalise[i] == true)
                .map((x) => toTitleCase(x))
                .join(', ') + ' Normalised Incurred '
            : 'Incurred ') +
          (props.isGLR ? props.ccrnlr : 'GLR'),
        xAxis: xAxis,
        yAxis: yAxis2,
        valueYField: 'comp_incurred',
        categoryXField: 'date',
        legendValueText: "[bold #a00]{valueY.formatNumber('#.0p')}",
        stroke: am5.color(0x800080),
        fill: am5.color(0xffffff),
      })
    );

    comp_seriesIncurred!.strokes.template.setAll({
      strokeDasharray: [7, 7],
    });
    comp_seriesIncurred!.hide();
  }

  let legend = dashboardChart.children.push(
    am5.Legend.new(root, {
      x: am5.percent(50),
      centerX: am5.p50,
      paddingLeft: 20,
      paddingRight: 20,
    })
  );
  legend.data.setAll(dashboardChart.series.values);
  legend.valueLabels.template.setAll({
    width: 20,
    textAlign: 'left',
    paddingLeft: 3,
    fontSize: 5,
  });
  legend.labels.template.setAll({
    fontSize: 5,
    maxWidth: 120,
  });
  legend.itemContainers.template.setAll({
    marginRight: 1,
    maxWidth: 140,
  });

  seriesNull.data.setAll(data);
  seriesGWP.data.setAll(data);
  xAxis.data.setAll(data);

  updateTitle();
  seriesGEP.data.setAll(data);
  seriesSeasonality.data.setAll(data);
  seriesSeasonality.toFront();
  seriesIncurred.data.setAll(data);
  seriesAttritional.data.setAll(data);

  if (props.isAve) {
    comp_seriesSeasonality!.data.setAll(data);
    comp_seriesAttritional!.data.setAll(data);
    comp_seriesIncurred!.data.setAll(data);
  }
}

watch(
  () => props.chartData,
  () => {
    if (props.chartData.length != 0) {
      createChart();
    }
  },
  { deep: true }
);

watch(
  () => [props.showSeasonality, props.ccrnlr, props.uwAcc, props.mqy],
  () => {
    updateTitle();
  },
  { deep: true }
);

onMounted(() => {
  setTimeout(() => {
    if (props.chartData.length != 0) {
      createChart();
    }
  }, 100);
  
  const resizeObserver = new ResizeObserver(() => {
    if (root) {
      root.resize();
    }
  });
  
  const chartDiv = document.getElementById('chartdiv');
  if (chartDiv) {
    resizeObserver.observe(chartDiv);
  }
});

onBeforeUnmount(() => {
  if (root) {
    root.dispose();
  }
  root = null;
});
</script>

<template>
  <div class="performance-chart-container">
    <div id="chartdiv" class="chart bg-white w-full" :style="{ height: '100%' }"></div>
  </div>
</template>

<style scoped>
.performance-chart-container {
  width: 100%;
  height: 100%;
  background: white;
  padding: 0;
  margin: 0;
  overflow: visible;
  position: relative;
}

#chartdiv {
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  position: relative !important;
}

.text-sybil-teal {
  color: #20b2aa;
}

.hover\:brightness-75:hover {
  filter: brightness(0.75);
}
</style>
