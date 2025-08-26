<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <template v-else-if="_isPC">
      <router-view />
    </template>
    <Mobile v-else />
  </template>
  <FullscreenSpin tip="Data is initializing, please wait..." v-else loading :mask="false" />
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useScreenStore, useMainStore, useSnapshotStore, useSlidesStore } from '@/store'
import { LOCALSTORAGE_KEY_DISCARDED_DB } from '@/configs/storage'
import { deleteDiscardedDB } from '@/utils/database'
import { isPC } from '@/utils/common'
import type { Slide } from '@/types/slides'
import api from '@/services'

import Editor from './views/Editor/index.vue'
import Screen from './views/Screen/index.vue'
import Mobile from './views/Mobile/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'

const router = useRouter()
const _isPC = isPC()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()
const { databaseId } = storeToRefs(mainStore)
const { slides } = storeToRefs(slidesStore)
const { screening } = storeToRefs(useScreenStore())

if (import.meta.env.MODE !== 'development') {
  window.onbeforeunload = () => false
}

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const targetPath = urlParams.get('path')
  
  if (targetPath && targetPath !== '/editor') {
    router.push(targetPath)
  }

  api.getFileData('slides').then((slides: Slide[]) => {
    slidesStore.setSlides(slides)
  })
  api.getFileData('layouts').then((slides: Slide[]) => {
    slidesStore.setLayouts(slides)
  })

  await deleteDiscardedDB()
  snapshotStore.initSnapshotDatabase()
})

// When the application is unloaded, record the current indexedDB database ID in localStorage for later database cleanup
window.addEventListener('unload', () => {
  const discardedDB = localStorage.getItem(LOCALSTORAGE_KEY_DISCARDED_DB)
  const discardedDBList: string[] = discardedDB ? JSON.parse(discardedDB) : []

  discardedDBList.push(databaseId.value)

  const newDiscardedDB = JSON.stringify(discardedDBList)
  localStorage.setItem(LOCALSTORAGE_KEY_DISCARDED_DB, newDiscardedDB)
})
</script>

<style lang="scss">
#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
