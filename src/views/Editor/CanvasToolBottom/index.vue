<template>
  <div class="canvas-tool">
    <div class="left-handler">
      <IconInfo class="handler-item" :class="{ 'active': showSearchPanel }" v-tooltip="'Shortcuts info'" @click="hotkeyDrawerVisible = true" />
    </div>

    <div class="center-handler">
     
    </div>

    <div class="right-handler">
      <IconPpt class="handler-item" :class="{ 'active': showSearchPanel }" v-tooltip="'Slide Show (F5)'" @click="enterScreening()" />
      <IconMinus class="handler-item viewport-size" v-tooltip="'Zoom Out Canvas (Ctrl + -)'" @click="scaleCanvas('-')" />
      <div class="zoom slider">
        <Slider 
          :value="localScalePercentage"
          :min="26"
          :max="213"
          @update:value="handleSliderChange"
        />
      </div>
      <IconPlus class="handler-item viewport-size" v-tooltip="'Zoom In Canvas (Ctrl + =)'" @click="scaleCanvas('+')" />
      <Popover trigger="click" v-model:value="canvasScaleVisible">
        <template #content>
          <PopoverMenuItem
            center
            v-for="item in canvasScalePresetList" 
            :key="item" 
            @click="applyCanvasPresetScale(item)"
          >{{item}}%</PopoverMenuItem>
          <PopoverMenuItem center @click="resetCanvas()">Fit to Screen</PopoverMenuItem>
        </template>
        <span class="text">{{canvasScalePercentage}}</span>
      </Popover>
      <IconFullScreen class="handler-item viewport-size-adaptation" v-tooltip="'Fit to Screen (Ctrl + 0)'" @click="resetCanvas()" />
    </div>

    <Drawer
      :width="320"
      v-model:visible="hotkeyDrawerVisible"
      placement="right"
    >
      <HotkeyDoc />
      <template v-slot:title>Shortcuts</template>
    </Drawer>

  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSnapshotStore } from '@/store'
import useScreening from '@/hooks/useScreening'
import { getImageDataURL } from '@/utils/image'
import type { ShapePoolItem } from '@/configs/shapes'
import type { LinePoolItem } from '@/configs/lines'
import useScaleCanvas from '@/hooks/useScaleCanvas'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import useCreateElement from '@/hooks/useCreateElement'

import HotkeyDoc from './HotkeyDoc.vue'
import ShapePool from './ShapePool.vue'
import LinePool from './LinePool.vue'
import ChartPool from './ChartPool.vue'
import TableGenerator from './TableGenerator.vue'
import MediaInput from './MediaInput.vue'
import LaTeXEditor from '@/components/LaTeXEditor/index.vue'
import FileInput from '@/components/FileInput.vue'
import Modal from '@/components/Modal.vue'
import Divider from '@/components/Divider.vue'
import Popover from '@/components/Popover.vue'
import PopoverMenuItem from '@/components/PopoverMenuItem.vue'
import Slider from '@/components/Slider.vue'
import Drawer from '@/components/Drawer.vue'

const mainStore = useMainStore()
const { creatingElement, creatingCustomShape, showSelectPanel, showSearchPanel, showNotesPanel } = storeToRefs(mainStore)
const { canUndo, canRedo } = storeToRefs(useSnapshotStore())

const { redo, undo } = useHistorySnapshot()
const { enterScreening, enterScreeningFromStart } = useScreening()

const hotkeyDrawerVisible = ref(false)

const {
  scaleCanvas,
  setCanvasScalePercentage,
  resetCanvas,
  canvasScalePercentage,
} = useScaleCanvas()

const canvasScalePresetList = [200, 150, 125, 100, 75, 50]
const localScalePercentage = ref<number>(parseInt(canvasScalePercentage.value))

watch(canvasScalePercentage, (newValue: string) => {
  localScalePercentage.value = parseInt(newValue)
})

const handleSliderChange = (value: number | [number, number]) => {
  if (Array.isArray(value)) return
  setCanvasScalePercentage(value)
}
const canvasScaleVisible = ref(false)

const applyCanvasPresetScale = (value: number) => {
  setCanvasScalePercentage(value)
  canvasScaleVisible.value = false
}

const {
  createImageElement,
  createChartElement,
  createTableElement,
  createLatexElement,
  createVideoElement,
  createAudioElement,
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
const mediaInputVisible = ref(false)
const latexEditorVisible = ref(false)
const textTypeSelectVisible = ref(false)
const shapeMenuVisible = ref(false)
const moreVisible = ref(false)

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

// Open selection panel
const toggleSelectPanel = () => {
  mainStore.setSelectPanelState(!showSelectPanel.value)
}

// Open find & replace panel
const toggleSraechPanel = () => {
  mainStore.setSearchPanelState(!showSearchPanel.value)
}

// Open notes panel
const toggleNotesPanel = () => {
  mainStore.setNotesPanelState(!showNotesPanel.value)
}
</script>

<style lang="scss" scoped>
.zoom.slider {
  width: 100px;
  margin: 0 8px;
  display: flex;
  align-items: center;
}
.canvas-tool {
  position: relative;
  border-bottom: 1px solid $borderColor;
  background-color: #fff;
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
.center-handler {
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
</style>
