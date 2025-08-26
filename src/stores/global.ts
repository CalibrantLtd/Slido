import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGlobalStore = defineStore('global', () => {
  const isLoading = ref(false)

  function setLoading(status: boolean) {
    isLoading.value = status
  }

  return {
    isLoading,
    setLoading
  }
})
