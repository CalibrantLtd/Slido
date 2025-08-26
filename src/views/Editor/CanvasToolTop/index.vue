<template> 
  <div class="canvas-tool bg-gray-50">
    <div class="left-handler mt-1">
        <IconUndo class="handler-item " :class="{ 'disable': !canUndo }" v-tooltip="'Undo (Ctrl + Z)'" @click="undo()" />
      <IconRedo class="handler-item " :class="{ 'disable': !canRedo }" v-tooltip="'Redo (Ctrl + Y)'" @click="redo()" /> 
    </div>

    <div class="add-element-handler">
      <Popover trigger="click" v-model:value="textTypeSelectVisible" :offset="10">
        <template #content>
            <PopoverMenuItem center @click="() => { drawText(); textTypeSelectVisible = false }"><IconTextRotationNone /> Horizontal Text Box</PopoverMenuItem>
            <PopoverMenuItem center @click="() => { drawText(true); textTypeSelectVisible = false }"><IconTextRotationDown /> Vertical Text Box</PopoverMenuItem>
          </template>
        <IconFontSize class="handler-item " :class="{ 'active': creatingElement?.type === 'text' }" v-tooltip="'Insert Text'" />
      </Popover>

        <Popover trigger="click" style="height: 100%;" v-model:value="shapePoolVisible" :offset="10">
          <template #content>
            <ShapePool @select="shape => drawShape(shape)" />
          </template>
          <IconGraphicDesign class="handler-item" :class="{ 'active': creatingCustomShape || creatingElement?.type === 'shape' }" v-tooltip="'Insert Shape'" />
        </Popover>
        
        <Popover trigger="click" v-model:value="shapeMenuVisible" style="height: 100%;" :offset="10">
          <template #content>
            <PopoverMenuItem center @click="() => { drawCustomShape(); shapeMenuVisible = false }">Freeform Drawing</PopoverMenuItem>
          </template>
          <IconEdit class="handler-item" :class="{ 'active': creatingCustomShape || creatingElement?.type === 'shape' }" v-tooltip="'Draw Shape'" />
        </Popover>

      <FileInput @change="files => insertImageElement(files)">
        <IconPicture class="handler-item" v-tooltip="'Insert Image'" />
      </FileInput>
      <Popover trigger="click" v-model:value="linePoolVisible" :offset="10">
        <template #content>
          <LinePool @select="line => drawLine(line)" />
        </template>
        <IconConnection class="handler-item" :class="{ 'active': creatingElement?.type === 'line' }" v-tooltip="'Insert Line'" />
      </Popover>
      <Popover trigger="click" v-model:value="chartPoolVisible" :offset="10">
        <template #content>
          <ChartPool @select="chart => { createChartElement(chart); chartPoolVisible = false }" />
        </template>
        <IconChartProportion class="handler-item" v-tooltip="'Insert Chart'" />
      </Popover>
      <Popover trigger="click" v-model:value="tableGeneratorVisible" :offset="10">
        <template #content>
          <TableGenerator
            @close="tableGeneratorVisible = false"
            @insert="({ row, col }) => { createTableElement(row, col); tableGeneratorVisible = false }"
          />
        </template>
        <IconInsertTable class="handler-item" v-tooltip="'Insert Table'" />
      </Popover>
      <IconFormula class="handler-item" v-tooltip="'Insert Formula'" @click="latexEditorVisible = true" />
      <Popover trigger="click" v-model:value="sybilPoolVisible" :offset="10">
        <template #content>
          <SybilPool @select="sybilObject => { handleSybilObjectSelect(sybilObject); sybilPoolVisible = false }" />
          </template>
        <IconListView class="handler-item" v-tooltip="'Insert Sybil object'" />
      </Popover>

    </div>

    <div class="right-handler">
     
    </div>

    <Modal
      v-model:visible="latexEditorVisible" 
      :width="880"
    >
      <LaTeXEditor 
        @close="latexEditorVisible = false"
        @update="data => { createLatexElement(data); latexEditorVisible = false }"
      />
    </Modal>

    <Modal
      v-model:visible="sybilWizardVisible"
      :width="520"
    >
      <SybilWizard
        :wizardType="selectedSybilType"
        @close="sybilWizardVisible = false"
        @finish="handleWizardFinish"
      />
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { getImageDataURL } from '@/utils/image'
import type { ShapePoolItem } from '@/configs/shapes'
import type { LinePoolItem } from '@/configs/lines'
import type { SybilObjectItem } from './SybilPool.vue'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useCreateElement from '@/hooks/useCreateElement'
import { nanoid } from 'nanoid'

import ShapePool from './ShapePool.vue'
import LinePool from './LinePool.vue'
import ChartPool from './ChartPool.vue'
import TableGenerator from './TableGenerator.vue'
import SybilPool from './SybilPool.vue'
import SybilWizard from './SybilWizard.vue'
import LaTeXEditor from '@/components/LaTeXEditor/index.vue'
import FileInput from '@/components/FileInput.vue'
import Modal from '@/components/Modal.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { title } = storeToRefs(slidesStore)
const { creatingElement, creatingCustomShape, showSelectPanel, showSearchPanel, showNotesPanel } = storeToRefs(mainStore)
const { canUndo, canRedo } = storeToRefs(useSnapshotStore())

const { redo, undo } = useHistorySnapshot()

const {
  createImageElement,
  createChartElement,
  createTableElement,
  createLatexElement,
} = useCreateElement()

const insertImageElement = (files: FileList) => {
  const imageFile = files[0]
  if (!imageFile) return
  getImageDataURL(imageFile).then(dataURL => createImageElement(dataURL))
}

const shapePoolVisible = ref(false)
const linePoolVisible = ref(false)
const chartPoolVisible = ref(false)
const tableGeneratorVisible = ref(false)
const latexEditorVisible = ref(false)
const textTypeSelectVisible = ref(false)
const shapeMenuVisible = ref(false)
const sybilPoolVisible = ref(false)
const sybilWizardVisible = ref(false)
const selectedSybilType = ref('')

// Draw text area
const drawText = (vertical = false) => {
  mainStore.setCreatingElement({
    type: 'text',
    vertical,
  })
}

// Draw shape area
const drawShape = (shape: ShapePoolItem) => {
  mainStore.setCreatingElement({
    type: 'shape',
    data: shape,
  })
  shapePoolVisible.value = false
}
// Draw custom polygon
const drawCustomShape = () => {
  mainStore.setCreatingCustomShapeState(true)
  shapePoolVisible.value = false
}

// Draw line path
const drawLine = (line: LinePoolItem) => {
  mainStore.setCreatingElement({
    type: 'line',
    data: line,
  })
  linePoolVisible.value = false
}

// Handle Sybil object selection
const handleSybilObjectSelect = (sybilObject: SybilObjectItem) => {
  selectedSybilType.value = sybilObject.type
  sybilWizardVisible.value = true
}

// Create performance table with dummy data
const createPerformanceTable = (wizardData: any) => {
  // Get the time period info from wizard data
  const timePeriodType = wizardData.timePeriodType || 'accident' // accident or underwriting
  const timePeriod = wizardData.timePeriod || 'accident-quarter' // quarter, month, year
  
  // Determine first column header based on time period selection
  let firstColumnHeader = 'Accident Quarter' // default
  if (timePeriodType === 'accident') {
    if (timePeriod.includes('quarter')) firstColumnHeader = 'Accident Quarter'
    else if (timePeriod.includes('month')) firstColumnHeader = 'Accident Month'
    else if (timePeriod.includes('year')) firstColumnHeader = 'Accident Year'
  } else if (timePeriodType === 'underwriting') {
    if (timePeriod.includes('quarter')) firstColumnHeader = 'Underwriting Quarter'
    else if (timePeriod.includes('month')) firstColumnHeader = 'Underwriting Month'
    else if (timePeriod.includes('year')) firstColumnHeader = 'Underwriting Year'
  }
  
  // Create table 
  const headers = [
    firstColumnHeader,
    'GWP\n(underwriting quarter)',
    'GEP',
    'Attritional\nUltimate',
    'Large\nUltimate',
    'Total\nUltimate',
    'Comm.',
    'Earned\nCCR',
    'Large\nNormalised\nEarned\nCCR',
    'No Seas. Adj.\nA-priori\nCCR'
  ]
  
  // Create sample data rows based on time period
  const sampleData = generateSampleData(timePeriodType, timePeriod)
  
  createPerformanceTableWithData([headers, ...sampleData])
}

// Generate sample data based on time period selection
const generateSampleData = (timePeriodType: string, timePeriod: string): string[][] => {
  const baseData = [
    ['1,157,670', '149,018', '220.6%', '123.6%', '344.2%', '21.0%', '365.2%', '266.6%', '102.3%'],
    ['1,963,234', '487,957', '66.9%', '0.2%', '67.1%', '21.0%', '88.1%', '112.9%', '101.7%'],
    ['2,697,140', '1,119,744', '69.4%', '1.0%', '70.3%', '21.0%', '91.3%', '115.4%', '94.6%'],
    ['2,934,483', '1,847,583', '84.5%', '6.6%', '91.1%', '21.0%', '112.1%', '130.5%', '95.7%'],
    ['2,619,732', '2,354,047', '51.5%', '1.5%', '53.1%', '21.0%', '74.1%', '97.5%', '91.6%'],
    ['3,010,163', '2,679,782', '64.8%', '6.0%', '70.8%', '21.0%', '91.8%', '110.8%', '87.6%'],
    ['2,948,530', '2,858,262', '74.0%', '7.2%', '81.2%', '21.0%', '102.2%', '120.0%', '85.5%'],
    ['4,466,878', '3,095,891', '43.5%', '3.2%', '46.7%', '21.0%', '67.7%', '89.5%', '82.5%']
  ]
  
  // Generate time period labels based on selection
  const timeLabels: string[] = []
  const prefix = timePeriodType === 'accident' ? '' : 'UW-' // UW prefix for underwriting
  
  if (timePeriod.includes('quarter')) {
    timeLabels.push(`${prefix}Q1-2018`, `${prefix}Q2-2018`, `${prefix}Q3-2018`, `${prefix}Q4-2018`, 
                   `${prefix}Q1-2019`, `${prefix}Q2-2019`, `${prefix}Q3-2019`, `${prefix}Q4-2019`)
  } else if (timePeriod.includes('month')) {
    timeLabels.push(`${prefix}Jan-2018`, `${prefix}Feb-2018`, `${prefix}Mar-2018`, `${prefix}Apr-2018`, 
                   `${prefix}May-2018`, `${prefix}Jun-2018`, `${prefix}Jul-2018`, `${prefix}Aug-2018`)
  } else if (timePeriod.includes('year')) {
    timeLabels.push(`${prefix}2018`, `${prefix}2019`, `${prefix}2020`, `${prefix}2021`, 
                   `${prefix}2022`, `${prefix}2023`, `${prefix}2024`, `${prefix}2025`)
  }
  
  // Combine time labels with base data
  const sampleData = baseData.map((row, index) => [
    timeLabels[index] || `${prefix}Period-${index + 1}`,
    ...row
  ])
  
  // Add total row
  sampleData.push(['Total', '51,560,446', '48,418,509', '35.8%', '12.4%', '48.2%', '21.0%', '69.2%', '81.8%', '81.8%'])
  
  return sampleData
}

// Create table element with pre-populated data
const createPerformanceTableWithData = (tableData: string[][]) => {
  const rows = tableData.length
  const cols = tableData[0].length
  
  // Get theme from store
  const { theme } = storeToRefs(slidesStore)
  
  // Create table cell style
  const style = {
    fontname: theme.value.fontName,
    color: theme.value.fontColor,
  }

  // Convert string data to table cell format with actual data
  const data = tableData.map((row, rowIndex) => 
    row.map((cellText, colIndex) => ({
      id: nanoid(10),
      colspan: 1,
      rowspan: 1,
      text: cellText,
      style: {
        ...style,
        ...(rowIndex === 0 ? { 
          bold: true,
          backcolor: '#a8d5a8', // Light green background for headers
          color: '#2d5016' // Dark green text for headers
        } : rowIndex === rows - 1 ? { 
          bold: true,
          backcolor: '#a8d5a8' // Light green for total row
        } : {
          // Alternating row colors for data rows - light green and white
          backcolor: rowIndex % 2 === 0 ? '#f0f9f0' : '#ffffff'
        })
      }
    }))
  )
  
  const DEFAULT_CELL_WIDTH = 100 // Reduced from 120
  const DEFAULT_CELL_HEIGHT = 28 // Reduced from 36
  
  const colWidths = new Array(cols).fill(1 / cols)
  const width = cols * DEFAULT_CELL_WIDTH
  const height = rows * DEFAULT_CELL_HEIGHT
  
  // Create the table element with actual data
  const element = {
    type: 'table' as const,
    id: nanoid(10),
    width,
    height,
    colWidths,
    rotate: 0,
    data, // This contains the actual populated data
    left: (1920 - width) / 2,
    top: (1080 - height) / 2,
    outline: {
      width: 1,
      style: 'solid' as const,
      color: '#d0d0d0',
    },
    theme: {
      color: theme.value.themeColor,
      rowHeader: true,
      rowFooter: true,
      colHeader: false,
      colFooter: false,
    },
    cellMinHeight: 20, // Reduced minimum height to allow more resizing
  }
  
  slidesStore.addElement(element)
}

// Create treemap element 
const createTreemapElement = (data: Array<{name: string, value: number, color: string}>) => {
  // Calculate total for proportions
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  // Generate SVG treemap layout
  const width = 800
  const height = 500
  
  // Sort by value descending for better layout
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  
  // Squarified treemap algorithm for better visual layout
  interface Rectangle {
    x: number
    y: number
    width: number
    height: number
    color: string
    name: string
    value: number
  }
  
  const squarify = (
    items: Array<{name: string, value: number, color: string}>,
    x: number,
    y: number,
    width: number,
    height: number
  ): Rectangle[] => {
    if (items.length === 0) return []
    if (items.length === 1) {
      return [{
        x, y, width, height,
        color: items[0].color,
        name: items[0].name,
        value: items[0].value
      }]
    }
    
    // Find the best split point
    const totalValue = items.reduce((sum, item) => sum + item.value, 0)
    let bestRatio = Infinity
    let bestSplit = 1
    
    for (let i = 1; i < items.length; i++) {
      const leftValue = items.slice(0, i).reduce((sum, item) => sum + item.value, 0)
      const rightValue = totalValue - leftValue
      
      const leftProportion = leftValue / totalValue
      const rightProportion = rightValue / totalValue
      
      // Calculate aspect ratios for both splits
      let leftRatio, rightRatio
      if (width > height) {
        // Split vertically
        const leftWidth = width * leftProportion
        const rightWidth = width * rightProportion
        leftRatio = Math.max(leftWidth / height, height / leftWidth)
        rightRatio = Math.max(rightWidth / height, height / rightWidth)
      } else {
        // Split horizontally
        const leftHeight = height * leftProportion
        const rightHeight = height * rightProportion
        leftRatio = Math.max(width / leftHeight, leftHeight / width)
        rightRatio = Math.max(width / rightHeight, rightHeight / width)
      }
      
      const maxRatio = Math.max(leftRatio, rightRatio)
      if (maxRatio < bestRatio) {
        bestRatio = maxRatio
        bestSplit = i
      }
    }
    
    const leftItems = items.slice(0, bestSplit)
    const rightItems = items.slice(bestSplit)
    const leftValue = leftItems.reduce((sum, item) => sum + item.value, 0)
    const leftProportion = leftValue / totalValue
    
    let leftRect, rightRect
    if (width > height) {
      // Split vertically
      const leftWidth = width * leftProportion
      leftRect = { x, y, width: leftWidth, height }
      rightRect = { x: x + leftWidth, y, width: width - leftWidth, height }
    } else {
      // Split horizontally
      const leftHeight = height * leftProportion
      leftRect = { x, y, width, height: leftHeight }
      rightRect = { x, y: y + leftHeight, width, height: height - leftHeight }
    }
    
    return [
      ...squarify(leftItems, leftRect.x, leftRect.y, leftRect.width, leftRect.height),
      ...squarify(rightItems, rightRect.x, rightRect.y, rightRect.width, rightRect.height)
    ]
  }
  
  const rects = squarify(sortedData, 0, 0, width, height)
  
  // Generate SVG string with professional styling
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.2)"/>
        </filter>
      </defs>
      ${rects.map(rect => {
        const fontSize = Math.min(16, Math.max(10, Math.min(rect.width / 10, rect.height / 6)))
        const textLines = rect.name.split(' ')
        const lineHeight = fontSize * 1.2
        const totalTextHeight = textLines.length * lineHeight
        const startY = rect.y + rect.height/2 - totalTextHeight/2 + lineHeight/2
        
        return `
          <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" 
                fill="${rect.color}" stroke="#ffffff" stroke-width="3" 
                filter="url(#shadow)" rx="4" ry="4"/>
          ${rect.width > 60 && rect.height > 30 ? textLines.map((line, index) => `
            <text x="${rect.x + rect.width/2}" y="${startY + index * lineHeight}" 
                  text-anchor="middle" dominant-baseline="middle" 
                  fill="white" font-size="${fontSize}" font-weight="bold" 
                  font-family="Arial, sans-serif">
              ${line}
            </text>
          `).join('') : ''}
        `
      }).join('')}
    </svg>
  `
  
  // Convert SVG to data URL
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`
  
  // Create image element with the treemap
  createImageElement(svgDataUrl)
}

// Create triangulation based on selected type
const createTriangulation = (wizardData: any) => {
  // Get the specific triangulation type from wizard data
  const selectedItem = wizardData.selectedItem || 'incurred-claims-triangles'
  
  switch (selectedItem) {
    case 'incurred-claims-triangles':
      createIncurredClaimsTriangle()
      break
    case 'link-ratios':
      createLinkRatios()
      break
    default:
      createIncurredClaimsTriangle()
  }
}

// Create Incurred Claims Triangle (triangular format)
const createIncurredClaimsTriangle = () => {
  const triangleHeaders = [
    'Accident Year', '12', '24', '36', '48', '60', '72', '84', '96', '108', '120'
  ]
  
  const triangleData = [
    ['2018', '1,234,567', '2,345,678', '3,456,789', '4,567,890', '5,678,901', '6,789,012', '', '', '', ''],
    ['2019', '1,345,678', '2,456,789', '3,567,890', '4,678,901', '5,789,012', '', '', '', '', ''],
    ['2020', '1,456,789', '2,567,890', '3,678,901', '4,789,012', '', '', '', '', '', ''],
    ['2021', '1,567,890', '2,678,901', '3,789,012', '', '', '', '', '', '', ''],
    ['2022', '1,678,901', '2,789,012', '', '', '', '', '', '', '', ''],
    ['2023', '1,789,012', '', '', '', '', '', '', '', '', '']
  ]
  
  createTriangulationTableWithData([triangleHeaders, ...triangleData], true) // true = triangular
}

// Create Link Ratios (rectangular format)
const createLinkRatios = () => {
  const headers = [
    'Accident Year', '12-24', '24-36', '36-48', '48-60', '60-72', '72-84', '84-96', '96-108', '108-120'
  ]
  
  const data = [
    ['2018', '1.895', '1.474', '1.321', '1.243', '1.195', '1.165', '1.143', '1.127', '1.115'],
    ['2019', '1.823', '1.453', '1.311', '1.237', '1.189', '1.159', '1.137', '1.121', '1.109'],
    ['2020', '1.756', '1.433', '1.301', '1.231', '1.183', '1.153', '1.131', '1.115', '1.103'],
    ['2021', '1.689', '1.413', '1.291', '1.225', '1.177', '1.147', '1.125', '1.109', '1.097'],
    ['2022', '1.622', '1.393', '1.281', '1.219', '1.171', '1.141', '1.119', '1.103', '1.091'],
    ['2023', '1.555', '1.373', '1.271', '1.213', '1.165', '1.135', '1.113', '1.097', '1.085']
  ]
  
  createTriangulationTableWithData([headers, ...data], false) // false = rectangular
}

// Create Development Factors (rectangular format)
const createDevelopmentFactors = () => {
  const headers = [
    'Development Period', '12-24', '24-36', '36-48', '48-60', '60-72', '72-84', '84-96', '96-108', '108-120'
  ]
  
  const data = [
    ['Simple Average', '1.724', '1.413', '1.301', '1.231', '1.183', '1.153', '1.131', '1.115', '1.103'],
    ['Volume Weighted', '1.756', '1.433', '1.321', '1.243', '1.195', '1.165', '1.143', '1.127', '1.115'],
    ['Geometric Average', '1.689', '1.393', '1.281', '1.219', '1.171', '1.141', '1.119', '1.103', '1.091'],
    ['Selected', '1.750', '1.430', '1.320', '1.240', '1.190', '1.160', '1.140', '1.120', '1.110']
  ]
  
  createTriangulationTableWithData([headers, ...data], false) // false = rectangular
}

// Create Derived Link Ratios (rectangular format)
const createDerivedLinkRatios = () => {
  const headers = [
    'Accident Year', '12-24', '24-36', '36-48', '48-60', '60-72', '72-84', '84-96', '96-108', '108-120'
  ]
  
  const data = [
    ['2018', '1.750', '1.430', '1.320', '1.240', '1.190', '1.160', '1.140', '1.120', '1.110'],
    ['2019', '1.750', '1.430', '1.320', '1.240', '1.190', '1.160', '1.140', '1.120', '1.110'],
    ['2020', '1.750', '1.430', '1.320', '1.240', '1.190', '1.160', '1.140', '1.120', '1.110'],
    ['2021', '1.750', '1.430', '1.320', '1.240', '1.190', '1.160', '1.140', '1.120', '1.110'],
    ['2022', '1.750', '1.430', '1.320', '1.240', '1.190', '1.160', '1.140', '1.120', '1.110'],
    ['2023', '1.750', '1.430', '1.320', '1.240', '1.190', '1.160', '1.140', '1.120', '1.110']
  ]
  
  createTriangulationTableWithData([headers, ...data], false) // false = rectangular
}

// Create Diagnostic Chart
const createDiagnosticChart = () => {
  const labels = ['12', '24', '36', '48', '60', '72', '84', '96', '108', '120']
  const legends = ['Development Factors']
  const series = [[1.75, 1.43, 1.32, 1.24, 1.19, 1.16, 1.14, 1.12, 1.11, 1.10]]
  
  const chartData = {
    labels,
    legends,
    series
  }
  
  createChartElement('line')
  
  setTimeout(() => {
    const { handleElement } = storeToRefs(mainStore)
    if (handleElement.value && handleElement.value.type === 'chart') {
      slidesStore.updateElement({ 
        id: handleElement.value.id, 
        props: { 
          data: chartData,
          themeColors: ['#4299e1']
        }
      })
    }
  }, 100)
}

// Create Ultimate Selection (rectangular format)
const createUltimateSelection = () => {
  const headers = [
    'Accident Year', 'Latest Paid', 'Latest Incurred', 'Selected Ultimate', 'IBNR', 'IBNR %'
  ]
  
  const data = [
    ['2018', '6,789,012', '7,234,567', '7,500,000', '265,433', '3.5%'],
    ['2019', '5,789,012', '6,345,678', '6,800,000', '454,322', '6.7%'],
    ['2020', '4,789,012', '5,456,789', '6,200,000', '743,211', '12.0%'],
    ['2021', '3,789,012', '4,567,890', '5,800,000', '1,232,110', '21.2%'],
    ['2022', '2,789,012', '3,678,901', '5,500,000', '1,821,099', '33.1%'],
    ['2023', '1,789,012', '2,789,012', '5,200,000', '2,410,988', '46.4%']
  ]
  
  createTriangulationTableWithData([headers, ...data], false) // false = rectangular
}

// Create triangulation table element
const createTriangulationTableWithData = (tableData: string[][], isTriangular: boolean = true) => {
  const rows = tableData.length
  const cols = tableData[0].length
  
  // Get theme from store
  const { theme } = storeToRefs(slidesStore)
  
  // Create table cell style
  const style = {
    fontname: theme.value.fontName,
    color: theme.value.fontColor,
  }

  // Convert string data to table cell format with conditional styling
  const data = tableData.map((row, rowIndex) => 
    row.map((cellText, colIndex) => ({
      id: nanoid(10),
      colspan: 1,
      rowspan: 1,
      text: cellText,
      style: {
        ...style,
        ...(rowIndex === 0 ? { 
          bold: true,
          backcolor: '#4a5568', // Dark gray header
          color: '#ffffff' // White text for headers
        } : (isTriangular && cellText === '') ? {
          // Empty cells (triangular pattern only)
          backcolor: '#f7fafc'
        } : {
          // Data cells with alternating colors
          backcolor: rowIndex % 2 === 0 ? '#edf2f7' : '#ffffff'
        })
      }
    }))
  )
  
  const DEFAULT_CELL_WIDTH = 80
  const DEFAULT_CELL_HEIGHT = 28
  
  const colWidths = new Array(cols).fill(1 / cols)
  const width = cols * DEFAULT_CELL_WIDTH
  const height = rows * DEFAULT_CELL_HEIGHT
  
  // Create the table element
  const element = {
    type: 'table' as const,
    id: nanoid(10),
    width,
    height,
    colWidths,
    rotate: 0,
    data,
    left: (1920 - width) / 2,
    top: (1080 - height) / 2,
    outline: {
      width: 1,
      style: 'solid' as const,
      color: '#cbd5e0',
    },
    theme: {
      color: theme.value.themeColor,
      rowHeader: true,
      rowFooter: false,
      colHeader: false,
      colFooter: false,
    },
    cellMinHeight: 20,
  }
  
  slidesStore.addElement(element)
}

// Handle wizard finish
const handleWizardFinish = (data: any) => {
  console.log('Wizard finished:', data)
  
  // Create appropriate element based on wizard type
  if (data.wizardType === 'performance-table') {
    createPerformanceTable(data)
  } else if (data.wizardType === 'performance-chart') {
    createPerformanceChart(data)
  } else if (data.wizardType === 'comparison-table') {
    createComparisonTable(data)
  } else if (data.wizardType === 'comparison-chart') {
    createComparisonChart(data)
  } else if (data.wizardType === 'comparison-treemap') {
    createComparisonTreemap(data)
  } else if (data.wizardType === 'triangulation') {
    createTriangulation(data)
  }
  // Add other wizard types here as needed
  
  sybilWizardVisible.value = false
}

// Create performance chart with sample data
const createPerformanceChart = (wizardData: any) => {
  // Get the time period info from wizard data
  const timePeriodType = wizardData.timePeriodType || 'accident'
  const timePeriod = wizardData.timePeriod || 'accident-quarter'
  
  // Generate chart data in the format expected by the application
  const labels = generateChartLabels(timePeriodType, timePeriod)
  
  // Create realistic data that matches the reference image
  const gwpData = [1.2, 1.5, 1.6, 1.3, 1.4, 1.7, 1.6, 1.8, 1.8, 1.7, 1.5, 1.6, 2.2, 1.7, 1.6, 1.6, 1.3, 2.0].slice(0, labels.length)
  const gepData = [1.0, 1.3, 1.4, 1.1, 1.2, 1.5, 1.4, 1.6, 1.6, 1.5, 1.3, 1.4, 2.0, 1.5, 1.4, 1.4, 1.1, 1.8].slice(0, labels.length)
  const aprioriData = [102, 98, 95, 92, 88, 85, 82, 80, 78, 76, 75, 74, 73, 72, 71, 70, 69, 68].slice(0, labels.length)
  const largeNormalisedData = [266, 240, 220, 200, 180, 160, 140, 120, 100, 90, 85, 80, 75, 70, 65, 60, 58, 56].slice(0, labels.length)
  
  // Use bar chart type but with custom data structure
  const legends = ['GWP', 'GEP', 'A-priori', 'Large Normalised CCR']
  const series = [gwpData, gepData, aprioriData, largeNormalisedData]
  
  const chartData = {
    labels,
    legends,
    series
  }
  
  // Create chart element with bar type
  createChartElement('bar')
  
  // Update the chart with our custom data and styling after creation
  setTimeout(() => {
    const { handleElement } = storeToRefs(mainStore)
    if (handleElement.value && handleElement.value.type === 'chart') {
      slidesStore.updateElement({ 
        id: handleElement.value.id, 
        props: { 
          data: chartData,
          // Use colors that match the reference image
          themeColors: ['#7dd3c0', '#5cb85c', '#ff4444', '#8b5cf6'], // Light green, dark green, red, purple
          options: {
            stack: false // Ensure bars are not stacked
          }
        }
      })
    }
  }, 100)
}

// Generate chart labels based on time period
const generateChartLabels = (timePeriodType: string, timePeriod: string): string[] => {
  const labels: string[] = []
  const prefix = timePeriodType === 'accident' ? '' : 'UW-'
  
  if (timePeriod.includes('quarter')) {
    // Generate quarterly labels from Q1-2018 to Q1-2023
    for (let year = 2018; year <= 2023; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        labels.push(`${prefix}Q${quarter}-${year}`)
        if (labels.length >= 20) break
      }
      if (labels.length >= 20) break
    }
  } else if (timePeriod.includes('month')) {
    // Generate monthly labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let year = 2018; year <= 2019; year++) {
      for (const month of months) {
        labels.push(`${prefix}${month}-${year}`)
        if (labels.length >= 20) break
      }
      if (labels.length >= 20) break
    }
  } else {
    // Generate yearly labels
    for (let year = 2018; year <= 2025; year++) {
      labels.push(`${prefix}${year}`)
    }
  }
  
  return labels.slice(0, 20) // Limit to 20 data points
}

// Create comparison table with sample data
const createComparisonTable = (wizardData: any) => {
  // Create table headers based on the reference image
  const headers = [
    'Section',
    'Expected Next 12 Months GWP',
    'Forward Looking Next 12 Months CCR',
    'Last 12 Underwriting Months CCR',
    'Last 12 Accident Months CCR',
    'All Time Written GWP',
    'All Time CCR'
  ]
  
  // Create sample data rows
  const sampleData = [
    ['Employers Liability', '4,722,961', '86.5%', '75.3%', '60.3%', '21,495,939', '62.3%'],
    ['Public Liability', '9,052,561', '85.0%', '59.9%', '55.2%', '30,063,507', '74.2%']
  ]
  
  createComparisonTableWithData([headers, ...sampleData])
}

// Create comparison chart (scatter plot)
const createComparisonChart = (wizardData: any) => {
  // Create scatter plot data
  const labels = ['Point 1', 'Point 2', 'Point 3', 'Point 4', 'Point 5']
  const legends = ['Forward Looking CCR', 'Monthly CCR']
  const series = [
    [86, 87, 85, 88, 84], // X-axis: Forward Looking CCR
    [86, 85, 87, 86, 88]  // Y-axis: Monthly CCR
  ]
  
  const chartData = {
    labels,
    legends,
    series
  }
  
  // Create scatter chart
  createChartElement('scatter')
  
  // Update with custom data
  setTimeout(() => {
    const { handleElement } = storeToRefs(mainStore)
    if (handleElement.value && handleElement.value.type === 'chart') {
      slidesStore.updateElement({ 
        id: handleElement.value.id, 
        props: { 
          data: chartData,
          themeColors: ['#5cb85c'] // Green color for scatter points
        }
      })
    }
  }, 100)
}

// Create comparison treemap
const createComparisonTreemap = (wizardData: any) => {
  // Create a custom HTML treemap since the chart system doesn't support treemaps
  const treemapData = [
    { name: 'Employers Liability', value: 45, color: '#7dd3c0' },
    { name: 'Public Liability', value: 35, color: '#6bc4a6' },
    { name: 'Construction/Building', value: 8, color: '#5cb85c' },
    { name: 'Warehouses/Factories', value: 5, color: '#4da847' },
    { name: 'Hospitality', value: 3, color: '#3e9938' },
    { name: 'Recreational Activities', value: 2, color: '#2f8a29' },
    { name: 'Taverns/Inns', value: 1, color: '#207b1a' },
    { name: 'No Longer Operating', value: 1, color: '#116c0b' }
  ]
  
  createTreemapElement(treemapData)
}

// Create comparison table element with pre-populated data
const createComparisonTableWithData = (tableData: string[][]) => {
  const rows = tableData.length
  const cols = tableData[0].length
  
  // Get theme from store
  const { theme } = storeToRefs(slidesStore)
  
  // Create table cell style
  const style = {
    fontname: theme.value.fontName,
    color: theme.value.fontColor,
  }

  // Convert string data to table cell format
  const data = tableData.map((row, rowIndex) => 
    row.map((cellText, colIndex) => ({
      id: nanoid(10),
      colspan: 1,
      rowspan: 1,
      text: cellText,
      style: {
        ...style,
        ...(rowIndex === 0 ? { 
          bold: true,
          backcolor: '#a8d5a8', // Light green background for headers
          color: '#2d5016' // Dark green text for headers
        } : {
          // Alternating row colors for data rows
          backcolor: rowIndex % 2 === 0 ? '#f0f9f0' : '#ffffff'
        })
      }
    }))
  )
  
  const DEFAULT_CELL_WIDTH = 120
  const DEFAULT_CELL_HEIGHT = 28
  
  const colWidths = new Array(cols).fill(1 / cols)
  const width = cols * DEFAULT_CELL_WIDTH
  const height = rows * DEFAULT_CELL_HEIGHT
  
  // Create the table element
  const element = {
    type: 'table' as const,
    id: nanoid(10),
    width,
    height,
    colWidths,
    rotate: 0,
    data,
    left: (1920 - width) / 2,
    top: (1080 - height) / 2,
    outline: {
      width: 1,
      style: 'solid' as const,
      color: '#d0d0d0',
    },
    theme: {
      color: theme.value.themeColor,
      rowHeader: true,
      rowFooter: false,
      colHeader: false,
      colFooter: false,
    },
    cellMinHeight: 20,
  }
  
  slidesStore.addElement(element)
}

</script>

<style lang="scss" scoped>
.canvas-tool {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 13px;
  user-select: none;
}
.left-handler, .more {
  display: flex;
  align-items: center;
}
.more-icon {
  display: none;
}
.add-element-handler {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;

  .handler-item {
    width: 32px;

    &:not(.group-btn):hover {
      background-color: #f1f1f1;
    }

    &.active {
      color: $themeColor;
    }

    &.group-btn {
      width: auto;
      margin-right: 5px;

      &:hover {
        background-color: #f3f3f3;
      }

      .icon, .arrow {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .icon {
        width: 26px;
        padding: 0 2px;

        &:hover {
          background-color: #e9e9e9;
        }
        &.active {
          color: $themeColor;
        }
      }
      .arrow {
        font-size: 12px;

        &:hover {
          background-color: #e9e9e9;
        }
      }
    }
  }
}
.handler-item {
  height: 30px;
  font-size: 14px;
  margin: 0 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: $borderRadius;
  overflow: hidden;
  cursor: pointer;

  &.disable {
    opacity: .5;
  }
}
.left-handler, .right-handler {
  .handler-item {
    padding: 0 8px;

    &.active,
    &:not(.disable):hover {
      background-color: #f1f1f1;
    }
  }
}
.right-handler {
  display: flex;
  align-items: center;

  .text {
    display: inline-block;
    width: 40px;
    text-align: center;
    cursor: pointer;
  }

  .viewport-size {
    font-size: 13px;
  }
}

@media screen and (width <= 1200px) {
  .right-handler .text {
    display: none;
  }
  .more > .handler-item {
    display: none;
  }
  .more-icon {
    display: block;
  }
}
@media screen and (width <= 1000px) {
  .left-handler, .right-handler {
    display: none;
  }
}

.title {
  height: 30px;
  margin-left: 2px;
  font-size: 13px;

  .title-input {
    width: 200px;
    height: 100%;
    padding-left: 0;
    padding-right: 0;

    ::v-deep(input) {
      height: 28px;
      line-height: 28px;
    }
  }
  .title-text {
    min-width: 20px;
    max-width: 400px;
    line-height: 30px;
    padding: 0 6px;
    border-radius: $borderRadius;
    cursor: pointer;

    @include ellipsis-oneline();

    &:hover {
      background-color: #f1f1f1;
    }
  }
}

</style>