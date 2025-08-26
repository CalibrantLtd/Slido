<script setup lang="ts">
import * as dagre from 'dagre'
import { onMounted, ref, watch, type PropType } from 'vue'
import { ConnectionMode, Position, VueFlow, isNode, useVueFlow, type ViewportFunctions } from '@vue-flow/core'
import { Background, BackgroundVariant } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import BounceNode from './BounceNode.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const emit = defineEmits(['onClickTree'])
const props = defineProps({
  data: { type: Object as PropType<any[]>, required: true },
  selectedNode: { type: Number, required: true },
  chartKey: { type: Number, required: true },
  treeSelected: { type: String, required: false, default: '' },
  selectedDraftList: { type: Object as PropType<Record<string, any>>, required: false, default: () => ({}) },
})

watch(() => props.chartKey, () => { onLayout(a) })
onMounted(() => { onLayout(a) })

const elements = ref<any>(props.data)
const selectedId = ref<number | null>(props.selectedNode)
const a = useVueFlow()
const defaultZoom = ref(2)

function onLayout(i: ViewportFunctions) {
  const direction = 'TB'
  if (props.selectedNode != null) {
    i.fitView({ nodes: [props.selectedNode.toString()] })
  } else {
    i.fitView({ nodes: [(0).toString()] })
  }
  i.zoomTo(defaultZoom.value)
  dagreGraph.setGraph({ rankdir: 'TB' })

  elements.value.forEach((el: any) => {
    if (isNode(el)) {
      dagreGraph.setNode(el.id, { width: 200, height: 150 })
    } else {
      dagreGraph.setEdge(el.source, el.target)
    }
  })

  dagre.layout(dagreGraph)

  elements.value.forEach((el: any) => {
    if (isNode(el)) {
      const nodeWithPosition = dagreGraph.node(el.id)
      el.targetPosition = Position.Top
      el.sourcePosition = Position.Bottom
      el.position = { x: nodeWithPosition.x, y: nodeWithPosition.y }
    }
  })
}

function onZoom() { defaultZoom.value = a.getViewport().zoom }

function onNodeClick(id: string) {
  selectedId.value = Number(id)
  emit('onClickTree', id)
}
</script>

<template>
  <div class="layoutflow">
    <VueFlow
      v-if="elements"
      :key="chartKey"
      v-model="elements"
      :default-zoom="defaultZoom"
      :connection-mode="ConnectionMode.Strict"
      :pan-on-scroll="true"
      @pane-ready="onLayout($event)"
    >
      <Background :variant="BackgroundVariant.Lines" class="bg-gray-200" />
      <template #node-custom="{ id, data }">
        <div @click.stop="onNodeClick(id)">
          <BounceNode :data="data" :selected="id === String(selectedId)" />
        </div>
      </template>
      <Controls :show-interactive="false" @zoom-out="onZoom" @zoom-in="onZoom" />
    </VueFlow>
  </div>
</template>

<style scoped>
.layoutflow {
  width: 100%;
  height: 100%;
}
</style>


