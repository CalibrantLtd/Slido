import type { Ref } from 'vue'
import { uniq } from 'lodash'
import { storeToRefs } from 'pinia'
import { useMainStore, useKeyboardStore } from '@/store'
import type { PPTElement } from '@/types/slides'

export default (
  elementList: Ref<PPTElement[]>,
  moveElement: (e: MouseEvent | TouchEvent, element: PPTElement) => void,
) => {
  const mainStore = useMainStore()
  const { activeElementIdList, activeGroupElementId, handleElementId, editorAreaFocus } = storeToRefs(mainStore)
  const { ctrlOrShiftKeyActive } = storeToRefs(useKeyboardStore())

  // Select element
  // startMove indicates whether to enter move state after selection
  const selectElement = (e: MouseEvent | TouchEvent, element: PPTElement, startMove = true) => {
    if (!editorAreaFocus.value) mainStore.setEditorareaFocus(true)

    // If the target element is not currently selected, select it
    // If Ctrl or Shift is pressed, enter multi-select mode and select both currently selected elements and target element
    // Otherwise only select the target element
    // If the target element is part of a group, select all group members
    if (!activeElementIdList.value.includes(element.id)) {
      let newActiveIdList: string[] = []

      if (ctrlOrShiftKeyActive.value) {
        newActiveIdList = [...activeElementIdList.value, element.id]
      }
      else newActiveIdList = [element.id]
      
      if (element.groupId) {
        const groupMembersId: string[] = []
        elementList.value.forEach((el: PPTElement) => {
          if (el.groupId === element.groupId) groupMembersId.push(el.id)
        })
        newActiveIdList = [...newActiveIdList, ...groupMembersId]
      }

      mainStore.setActiveElementIdList(uniq(newActiveIdList))
      mainStore.setHandleElementId(element.id)
    }

    // If the target element is already selected and Ctrl or Shift is pressed, deselect it
    // Unless it's the last selected element or its group is the last selected group
    // If the target element is part of a group, deselect all group members
    else if (ctrlOrShiftKeyActive.value) {
      let newActiveIdList: string[] = []

      if (element.groupId) {
        const groupMembersId: string[] = []
        elementList.value.forEach((el: PPTElement) => {
          if (el.groupId === element.groupId) groupMembersId.push(el.id)
        })
        newActiveIdList = activeElementIdList.value.filter(id => !groupMembersId.includes(id))
      }
      else {
        newActiveIdList = activeElementIdList.value.filter(id => id !== element.id)
      }

      if (newActiveIdList.length > 0) {
        mainStore.setActiveElementIdList(newActiveIdList)
      }
    }

    // If the target element is already selected but not the current handle element, set it as handle element
    else if (handleElementId.value !== element.id) {
      mainStore.setHandleElementId(element.id)
    }

    // If the target element is already selected and is the current handle element,
    // clicking it again in this state will set it as the active member in multi-select
    else if (activeGroupElementId.value !== element.id) {
      const startPageX = e instanceof MouseEvent ? e.pageX : e.changedTouches[0].pageX
      const startPageY = e instanceof MouseEvent ? e.pageY : e.changedTouches[0].pageY

      ;(e.target as HTMLElement).onmouseup = (e: MouseEvent) => {
        const currentPageX = e.pageX
        const currentPageY = e.pageY

        if (startPageX === currentPageX && startPageY === currentPageY) {
          mainStore.setActiveGroupElementId(element.id)
          ;(e.target as HTMLElement).onmouseup = null
        }
      }
    }

    if (startMove) moveElement(e, element)
  }

  return {
    selectElement,
  }
}
