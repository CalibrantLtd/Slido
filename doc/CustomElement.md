## How to Create a Custom Element

> Note: Due to version updates, the code in this document and repository cannot be used directly by copy-pasting. This document only provides guidance.

### Define the Element Structure and Configuration
First, we need to define the element's structure and add its type
```typescript 
// types/slides.ts

export const enum ElementTypes {
  TEXT = 'text',
  IMAGE = 'image',
  SHAPE = 'shape',
  LINE = 'line',
  CHART = 'chart',
  TABLE = 'table',
  LATEX = 'latex',
  VIDEO = 'video',
  AUDIO = 'audio',
  FRAME = 'frame', // add
}

// add
export interface PPTFrameElement extends PPTBaseElement {
  type: 'frame'
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  url: string; // Webpage URL
}

// Modify PPTElement Type
export type PPTElement = PPTTextElement | PPTImageElement | PPTShapeElement | PPTLineElement | PPTChartElement | PPTTableElement | PPTLatexElement | PPTVideoElement | PPTAudioElement | PPTFrameElement
```

Add the element's English name and minimum size to the configuration file:
```typescript
// configs/element

export const ELEMENT_TYPE_EN = {
  text: 'Text',
  image: 'Image',
  shape: 'Shape',
  line: 'Line',
  chart: 'Chart',
  table: 'Table',
  video: 'Video',
  audio: 'Audio',
  frame: 'Webpage', // add
}

export const MIN_SIZE = {
  text: 20,
  image: 20,
  shape: 15,
  chart: 200,
  table: 20,
  video: 250,
  audio: 20,
  frame: 200, // add
}
```

### Create the Element Component
Then we start creating the element's component:
```html
<!-- views/components/element/FrameElement/index.vue -->

<template>
  <div class="editable-element-frame"
    :style="{
      top: elementInfo.top + 'px',
      left: elementInfo.left + 'px',
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div 
        class="element-content" 
        v-contextmenu="contextmenus"
        @mousedown="$event => handleSelectElement($event)"
        @touchstart="$event => handleSelectElement($event)"
      >
        <iframe 
          :src="elementInfo.url"
          :width="elementInfo.width"
          :height="elementInfo.height"
          :frameborder="0" 
          :allowfullscreen="true"
        ></iframe>

        <div class="drag-handler top"></div>
        <div class="drag-handler bottom"></div>
        <div class="drag-handler left"></div>
        <div class="drag-handler right"></div>

        <div class="mask" 
          v-if="handleElementId !== elementInfo.id"
          @mousedown="$event => handleSelectElement($event, false)"
          @touchstart="$event => handleSelectElement($event, false)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { PPTFrameElement } from '@/types/slides'
import { ContextmenuItem } from '@/components/Contextmenu/types'

const props = defineProps({
  elementInfo: {
    type: Object as PropType<PPTFrameElement>,
    required: true,
  },
  selectElement: {
    type: Function as PropType<(e: MouseEvent | TouchEvent, element: PPTFrameElement, canMove?: boolean) => void>,
    required: true,
  },
  contextmenus: {
    type: Function as PropType<() => ContextmenuItem[] | null>,
  },
})

const { handleElementId } = storeToRefs(useMainStore())

const handleSelectElement = (e: MouseEvent | TouchEvent, canMove = true) => {
  e.stopPropagation()
  props.selectElement(e, props.elementInfo, canMove)
}
</script>

<style lang="scss" scoped>
.editable-element-frame {
  position: absolute;
}
.element-content {
  width: 100%;
  height: 100%;
  cursor: move;
}
.drag-handler {
  position: absolute;

  &.top {
    height: 20px;
    left: 0;
    right: 0;
    top: 0;
  }
  &.bottom {
    height: 20px;
    left: 0;
    right: 0;
    bottom: 0;
  }
  &.left {
    width: 20px;
    top: 0;
    bottom: 0;
    left: 0;
  }
  &.right {
    width: 20px;
    top: 0;
    bottom: 0;
    right: 0;
  }
}
.mask {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
```

Additionally, we need a basic version of the component without editing capabilities for display in thumbnail/presentation mode:
```html
<!-- views/components/element/FrameElement/BaseFrameElement.vue -->

<template>
  <div class="base-element-frame"
    :style="{
      top: elementInfo.top + 'px',
      left: elementInfo.left + 'px',
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div class="element-content">
        <iframe 
          :src="elementInfo.url"
          :width="elementInfo.width"
          :height="elementInfo.height"
          :frameborder="0" 
          :allowfullscreen="true"
        ></iframe>

        <div class="mask"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { PPTFrameElement } from '@/types/slides'

const props = defineProps({
  elementInfo: {
    type: Object as PropType<PPTFrameElement>,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.base-element-frame {
  position: absolute;
}
.element-content {
  width: 100%;
  height: 100%;
}
.mask {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
```

You may notice that these two components are very similar. Indeed, for simpler element components, the editable and non-editable versions are highly consistent, with the non-editable version perhaps just having fewer methods. However, for more complex element components, the differences become more significant (you can compare the two versions of text and image elements). Therefore, you can decide whether to merge them into a single abstract component - we won't go into detail about that here.

After creating the element component, we need to use it in the required places, which may include:

- Thumbnail element component `views/components/ThumbnailSlide/ThumbnailElement.vue`
- Presentation element component `views/Screen/ScreenElement.vue`
- Editable element component `views/Editor/Canvas/EditableElement.vue`
- Mobile editable element component `views/Mobile/MobileEditor/MobileEditableElement.vue`

Generally, the first two use the non-editable version, while the latter two use the editable version.
Here's an example using the canvas editable element component:
```html
<!-- views/Editor/Canvas/EditableElement.vue -->

<script lang="ts" setup>
 import FrameElement from '@/views/components/element/FrameElement/index.vue'

 const currentElementComponent = computed(() => {
  const elementTypeMap = {
    [ElementTypes.IMAGE]: ImageElement,
    [ElementTypes.TEXT]: TextElement,
    [ElementTypes.SHAPE]: ShapeElement,
    [ElementTypes.LINE]: LineElement,
    [ElementTypes.CHART]: ChartElement,
    [ElementTypes.TABLE]: TableElement,
    [ElementTypes.LATEX]: LatexElement,
    [ElementTypes.VIDEO]: VideoElement,
    [ElementTypes.AUDIO]: AudioElement,
    [ElementTypes.FRAME]: FrameElement, // add
  }
  return elementTypeMap[props.elementInfo.type] || null
})
</script>
```

In the canvas editable element, we also need to add operation nodes `Operate` (generally including eight scaling points, four edge lines, and one rotation point). For special elements (like lines whose operation nodes are clearly different from others), you can write your own component, but generally you can directly use the existing generic operation nodes:
```html
<!-- src\views\Editor\Canvas\Operate\index.vue -->

<script lang="ts" setup>
const currentOperateComponent = computed(() => {
  const elementTypeMap = {
    [ElementTypes.IMAGE]: ImageElementOperate,
    [ElementTypes.TEXT]: TextElementOperate,
    [ElementTypes.SHAPE]: ShapeElementOperate,
    [ElementTypes.LINE]: LineElementOperate,
    [ElementTypes.TABLE]: TableElementOperate,
    [ElementTypes.CHART]: CommonElementOperate,
    [ElementTypes.LATEX]: CommonElementOperate,
    [ElementTypes.VIDEO]: CommonElementOperate,
    [ElementTypes.AUDIO]: CommonElementOperate,
    [ElementTypes.FRAME]: CommonElementOperate, // add
  }
  return elementTypeMap[props.elementInfo.type] || null
})
</script>
```

### Create the Right-side Element Editing Panel
Next, we need to add a style panel for the element. When an element is selected, the right toolbar will automatically focus on this panel. You need to add the settings you think are necessary to manipulate the element itself. Just remember one thing: modifying an element actually means modifying its data - the fields we defined in the initial structure.
Also, don't forget to add the operation to the history after modifying an element.
```html
<!-- src\views\Editor\Toolbar\ElementStylePanel\FrameStylePanel.vue -->

<template>
  <div class="frame-style-panel">
    <div class="row">
      <div>Webpage URL:</div>
      <Input v-model:value="url" placeholder="Enter webpage URL" />
      <Button @click="updateURL()">Confirm</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

const slidesStore = useSlidesStore()
const { handleElementId } = storeToRefs(useMainStore())

const { addHistorySnapshot } = useHistorySnapshot()

const url = ref('')

const updateURL = () => {
  if (!handleElementId.value) return
  slidesStore.updateElement({ id: handleElementId.value, props: { url: url.value } })
  addHistorySnapshot()
}
</script>
```
```html
<script lang="ts" setup>
import FrameStylePanel from './FrameStylePanel.vue'
  
const panelMap = {
  [ElementTypes.TEXT]: TextStylePanel,
  [ElementTypes.IMAGE]: ImageStylePanel,
  [ElementTypes.SHAPE]: ShapeStylePanel,
  [ElementTypes.LINE]: LineStylePanel,
  [ElementTypes.CHART]: ChartStylePanel,
  [ElementTypes.TABLE]: TableStylePanel,
  [ElementTypes.LATEX]: LatexStylePanel,
  [ElementTypes.VIDEO]: VideoStylePanel,
  [ElementTypes.AUDIO]: AudioStylePanel,
  [ElementTypes.FRAME]: FrameStylePanel, // add
}
</script>
```

### Creating the Element
This is the final step in creating a custom element. First, we create a method to generate the element:
```typescript
// src\hooks\useCreateElement.ts

const createFrameElement = (url: string) => {
  createElement({
    type: 'frame',
    id: nanoid(10),
    width: 800,
    height: 480,
    rotate: 0,
    left: (VIEWPORT_SIZE - 800) / 2,
    top: (VIEWPORT_SIZE * viewportRatio.value - 480) / 2,
    url,
  })
}
```
Then use it in the insert toolbar:
```html
<!-- src\views\Editor\CanvasTool\index.vue -->

<template>
  <div class="canvas-tool">
    <div class="add-element-handler">
      <!-- add -->
      <span class="handler-item" @click="createFrameElement('https://v3.cn.vuejs.org/')">Insert Webpage</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const {
  createImageElement,
  createChartElement,
  createTableElement,
  createLatexElement,
  createVideoElement,
  createAudioElement,
  createFrameElement, // add
} = useCreateElement()
</script>
```
Click the [Insert Webpage] button, and you'll see a webpage element added to the canvas.

### Summary
This is the basic process for creating a custom element. The whole process is somewhat tedious but not complicated. The key points are defining the element structure and writing the element component, which determine what capabilities and appearance the new element will have. The other parts can be implemented by following the existing patterns.
Additionally, there are some optional adjustments: if you want export functionality to support the new element, you'll need to extend the export-related methods; if you want theme functionality to apply to the new element, you'll need to extend the theme-related methods, and so on.
