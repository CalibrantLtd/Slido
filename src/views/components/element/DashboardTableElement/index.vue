<template>
  <div 
    class="dashboard-table-element"
    :class="{ 'lock': elementInfo.lock }"
    :style="{
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
      left: elementInfo.left + 'px',
      top: elementInfo.top + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div 
        class="element-content"
        ref="elementRef"
        :style="{
          width: elementInfo.width + 'px',
          height: elementInfo.height + 'px',
        }"
        v-contextmenu="contextmenus"
        @mousedown="$event => handleSelectElement($event)"
        @touchstart="$event => handleSelectElement($event)"
      >
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
        />
        <DashboardTable :overflow="elementInfo.props?.overflow || 'auto'" />
        
        <!-- Drag handlers to ensure the element can be selected -->
        <div class="drag-handler top"></div>
        <div class="drag-handler bottom"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type PPTElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import DashboardTable from '@/components/DashboardTable/DashboardTable.vue'
import ElementOutline from '@/views/components/element/ElementOutline.vue'

const props = defineProps<{
  elementInfo: PPTElement & {
    width: number
    height: number
    rotate: number
    outline?: any
    props?: any
  }
  selectElement: (e: MouseEvent | TouchEvent, element: PPTElement, canMove?: boolean) => void
  contextmenus: () => ContextmenuItem[] | null
}>()

const elementRef = ref<HTMLElement>()

const handleSelectElement = (e: MouseEvent | TouchEvent, canMove = true) => {
  if (props.elementInfo.lock) return
  e.stopPropagation()

  props.selectElement(e, props.elementInfo, canMove)
}
</script>

<style scoped>
.dashboard-table-element {
  position: absolute;
  cursor: pointer;
  user-select: none;
}

.rotate-wrapper {
  width: 100%;
  height: 100%;
}

.element-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.drag-handler {
  position: absolute;
  left: 0;
  right: 0;
  height: 10px;
  z-index: 1;
}

.drag-handler.top {
  top: 0;
}

.drag-handler.bottom {
  bottom: 0;
}

.lock {
  cursor: not-allowed;
}
</style>
