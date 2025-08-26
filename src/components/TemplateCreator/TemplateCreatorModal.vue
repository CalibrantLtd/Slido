<template>
  <div class="modal-header">
    <h3>{{ isEditing ? 'Edit Template' : 'Create New Template' }}</h3>
  </div>
  
  <div class="modal-content">
    <div class="form-group">
      <label for="templateName">Template Name</label>
      <input 
        id="templateName"
        v-model="localTemplateName" 
        type="text" 
        placeholder="Enter template name"
        class="form-input"
      />
    </div>
  </div>
  
  <div class="modal-footer">
    <button @click="$emit('close')" class="btn btn-secondary">Cancel</button>
    <button @click="handleSave" class="btn btn-primary" :disabled="!localTemplateName.trim()">
      {{ isEditing ? 'Update Template' : 'Save Template' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  templateName?: string
  isEditing?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: { name: string}): void
}

const props = withDefaults(defineProps<Props>(), {
  templateName: '',
  isEditing: false,
})

const emit = defineEmits<Emits>()

const localTemplateName = ref(props.templateName)

watch(() => props.templateName, (newVal) => {
  localTemplateName.value = newVal
}, { immediate: true })

const handleSave = () => {
  if (!localTemplateName.value.trim()) return
  
  emit('save', {
    name: localTemplateName.value.trim(),
  })
}
</script>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #6b7280;
  background: #f9fafb;
}

.modal-content {
  padding: 24px;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #374151;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.form-input {
  width: 100%;
  padding: 16px 20px;
  border: 3px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8fafc;
  color: #1f2937;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: rgb(187, 226, 211);
  background: white;
  box-shadow: 0 0 0 4px rgba(187, 226, 211, 0.15);
  transform: translateY(-1px);
}

.form-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.form-input:hover:not(:focus) {
  border-color: #d1d5db;
  background: #ffffff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px 24px 24px;
  border-top: 1px solid #f3f4f6;
}

.btn {
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  min-width: 110px;
}

.btn-secondary {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #f1f5f9;
  color: #475569;
  transform: translateY(-1px);
}

.btn-primary {
  background: rgb(187, 226, 211);
  color: #065f46;
}

.btn-primary:hover:not(:disabled) {
  background: rgb(167, 216, 191);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(187, 226, 211, 0.3);
}

.btn-primary:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
