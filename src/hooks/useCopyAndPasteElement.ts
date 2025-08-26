import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { copyText, readClipboard } from '@/utils/clipboard'
import { encrypt } from '@/utils/crypto'
import message from '@/utils/message'
import usePasteTextClipboardData from '@/hooks/usePasteTextClipboardData'
import useDeleteElement from './useDeleteElement'

export default () => {
  const mainStore = useMainStore()
  const { activeElementIdList, activeElementList } = storeToRefs(mainStore)

  const { pasteTextClipboardData } = usePasteTextClipboardData()
  const { deleteElement } = useDeleteElement()

  // Copy selected element data to clipboard after encryption
  const copyElement = () => {
    if (!activeElementIdList.value.length) return

    const text = encrypt(JSON.stringify({
      type: 'elements',
      data: activeElementList.value,
    }))

    copyText(text).then(() => {
      mainStore.setEditorareaFocus(true)
    })
  }

  // Copy then delete selected elements (cut)
  const cutElement = () => {
    copyElement()
    deleteElement()
  }

  // Attempt to decrypt clipboard element data then paste
  const pasteElement = () => {
    readClipboard().then(text => {
      pasteTextClipboardData(text)
    }).catch(err => message.warning(err))
  }

  // Copy then immediately paste selected elements
  const quickCopyElement = () => {
    copyElement()
    pasteElement()
  }

  return {
    copyElement,
    cutElement,
    pasteElement,
    quickCopyElement,
  }
}
