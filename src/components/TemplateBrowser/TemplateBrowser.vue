<template>
  <div class="template-browser">
    <div class="browser-header">
      <h2>My Templates</h2>
    </div>

    <div class="template-grid" v-if="paginatedTemplates.length > 0">
      <div 
        v-for="(template, index) in paginatedTemplates" 
        :key="template.id || index"
        class="template-card"
        @click="loadTemplate(template)"
      >
        <div class="template-info">
          <h3>{{ template.name }}</h3>
        </div>
        <div class="template-actions">
          <button 
            @click.stop="openDeleteDialog(template)" 
            class="delete-btn" 
            title="Delete template"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📄</div>
      <h3>No templates found</h3>
      <p>Create your first template by designing slides and saving it as a template.</p>
    </div>

    <!-- Pagination -->
    <div v-if="templates.length > itemsPerPage" class="pagination">
      <button 
        @click="previousPage" 
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        ← Previous
      </button>
      <span class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        @click="nextPage" 
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Next →
      </button>
    </div>

    <!-- Delete confirmation dialog -->
    <div v-if="showDeleteDialog" class="modal-overlay">
      <div class="modal">
        <h3>Delete Template</h3>
        <p>Are you sure you want to delete <strong>{{ selectedTemplate?.name }}</strong>? This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeDeleteDialog">Cancel</button>
          <button class="confirm-btn" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { templateService } from '@/services/templateService'

interface Template {
  id?: string
  name: string
  slides: any[]
  metadata?: {
    createdAt: string
    updatedAt: string
    version: string
  }
}

const router = useRouter()
const templates = ref<Template[]>([])

const showDeleteDialog = ref(false)
const selectedTemplate = ref<Template | null>(null)

const itemsPerPage = 16
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(templates.value.length / itemsPerPage))

const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return templates.value.slice(start, end)
})

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const openDeleteDialog = (template: Template) => {
  selectedTemplate.value = template
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  selectedTemplate.value = null
  showDeleteDialog.value = false
}

const confirmDelete = async () => {
  if (!selectedTemplate.value || !selectedTemplate.value.id) return
  
  try {
    await templateService.deleteTemplate(selectedTemplate.value.id)
    await loadTemplates()
  } catch (error) {
    console.error('❌ Failed to delete template:', error)
  } finally {
    closeDeleteDialog()
  }
}

const loadTemplates = async () => {
  try {
    templates.value = await templateService.loadTemplates()
    currentPage.value = 1 // Reset to first page when loading new templates
  } catch (error) {
    console.error('Failed to load templates:', error)
  }
}

const loadTemplate = async (template: Template) => {
  try {
    if (!template.id) {
      console.error('Template ID is missing')
      return
    }
    router.push(`/template/${template.id}`)
  } catch (error) {
    console.error('❌ Failed to load template:', error)
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.template-browser {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.browser-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 32px;
}

.browser-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.template-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding: 24px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.template-info {
  text-align: center;
}

.template-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  word-break: break-word;
}

.template-actions {
  position: absolute;
  top: 12px;
  right: 12px;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
  opacity: 0.6;
}

.delete-btn:hover {
  background: #fee2e2;
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #374151;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  max-width: 400px;
  margin: 0 auto;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.modal p {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #4b5563;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
}

.cancel-btn:hover {
  background: #d1d5db;
}

.confirm-btn {
  background: #ef4444;
  color: white;
}

.confirm-btn:hover {
  background: #dc2626;
}

/* Pagination styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding: 20px 0;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}
</style>
