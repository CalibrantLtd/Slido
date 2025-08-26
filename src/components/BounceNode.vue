<script setup lang="ts">
import { InfoFilled, More } from '@element-plus/icons-vue'

const props = defineProps<{ data: any; treeSelected?: string; selectedDraftList?: Record<string, any>; selected?: boolean }>()

// Match main app color palette
const monthColors: Record<string, string> = {
  '01': '#85acbe',
  '02': '#859bbe',
  '03': '#858abe',
  '04': '#9185be',
  '05': '#a285be',
  '06': '#b385be',
  '07': '#be85b7',
  '08': '#be85a6',
  '09': '#be8595',
  '10': '#be8685',
  '11': '#be9785',
  '12': '#bea885'
}

function getName(node: any) {
  try {
    const split = (node?.name ?? '').split('-')
    if (split[0]?.length === 6) {
      return node.name.slice(split[0].length + 1 + (split[1]?.length ?? 0) + 1)
    }
    return node?.name ?? ''
  } catch {
    return node?.name ?? ''
  }
}

function checkColor(node: any) {
  try {
    const split = (node?.name ?? '').split('-')
    if (split[0]?.length === 6) {
      const month = split[0].substring(4, 6)
      return monthColors[month] || '#8ea1bf'
    }
    return '#55b691'
  } catch {
    return '#55b691'
  }
}

function treeNameFormatter(node: any) {
  try {
    const split = (node?.name ?? '').split('-')
    if (split[0]?.length === 6) {
      const yyyy = split[0].substring(0, 4)
      const mm = split[0].substring(4, 6)
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const monthName = months[parseInt(mm) - 1] || mm
      const user = split[2] || ''
      const timestamp = split[1] || '' // Show raw timestamp like main app
      return `As at Date: \n${monthName}-${yyyy}\nUser: ${user}\nTimestamp:\n${timestamp}`
    }
    return getName(node)
  } catch {
    return node?.name ?? ''
  }
}
</script>

<template>
  <el-tooltip class="box-item" :show-after="700" effect="dark" :content="getName(data)" placement="top">
    <div class="tree-node" :class="{ 'selected-border': selected }" :style="{ 'background-color': checkColor(data) }">
      <p style="white-space: pre-line">{{ treeNameFormatter(data) }}</p>
      <div class="abs-more" v-if="selectedDraftList && selectedDraftList[data.nodeID]">
        <span class="ellipsis">···</span>
      </div>
    </div>
  </el-tooltip>
 </template>

<style scoped>
.tree-node { width: 150px; height: 150px; padding: 8px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; color: #fff; border-radius: 8px; position: relative; }
.selected-border { border: 3px solid #000; }
.border-tree { border: none; }
.abs-info { display: none; }
.abs-more { position: absolute; right: 10px; bottom: 6px; }
.info-badge { width: 32px; height: 32px; background: rgba(255,255,255,0.9); color: #7aa596; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
.ellipsis { color: #fff; letter-spacing: 2px; font-weight: 700; }
</style>


