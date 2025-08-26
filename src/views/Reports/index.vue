<template>
  <div class="reports-container">
    <div class="content-header">
      <h2>Reports</h2>
      <p>View and manage generated reports</p>
    </div>
    
    <div class="reports-content">
      <div v-if="reports.length > 0" class="reports-grid">
        <div 
          v-for="report in paginatedReports" 
          :key="report.id"
          class="report-card"
          @click="viewReport(report)"
          @contextmenu="showContextMenu($event, report)"
        >
          <div class="report-info">
            <h3 class="report-name">{{ report.name }}</h3>
            <p class="report-date">{{ formatDate(report.createdAt) }}</p>
          </div>
          <div class="report-actions">
            <button @click.stop="downloadReport(report)" class="download-btn" title="Download">
                Download
            </button>
            <button @click.stop="deleteReport(report)" class="delete-btn" title="Delete">
                Delete
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No Reports Generated Yet</h3>
        <p>Generated reports will appear here once you create them from templates.</p>
      </div>

      <!-- Pagination -->
      <div v-if="reports.length > itemsPerPage" class="pagination">
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
    </div>
    
    <div 
      v-if="contextMenu.visible" 
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="contextMenu.report && downloadReport(contextMenu.report)">
        📥 Download Report
      </div>
      <div class="context-menu-item" @click="contextMenu.report && deleteReport(contextMenu.report)">
        🗑️ Delete Report
      </div>
    </div>
    
    <div 
      v-if="contextMenu.visible" 
      class="context-menu-overlay"
      @click="hideContextMenu"
    ></div>
    
    <div v-if="deleteModal.visible" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Delete Report</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>"{{ deleteModal.report?.name }}"</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelDelete" class="btn cancel">Cancel</button>
          <button @click="confirmDelete" class="btn delete">Delete</button>
        </div>
      </div>
    </div>
    
    <div v-if="viewerModal.visible" class="modal-overlay" @click="closeViewer">
      <div class="viewer-modal-content" @click.stop>
        <div class="viewer-header">
          <h3>{{ viewerModal.report?.name }}</h3>
          <button @click="closeViewer" class="close-btn">×</button>
        </div>
        <div class="viewer-body">
          <div class="slide-viewer">
            <div class="slide-container">
              <div class="slide" v-if="viewerModal.currentSlide">
                <img :src="viewerModal.currentSlide" alt="Slide" />
              </div>
              <div v-else class="loading-slide">
                <div class="loading-spinner"></div>
                <p>Loading slides...</p>
              </div>
            </div>
            <div class="slide-controls">
              <button @click="previousSlide" :disabled="viewerModal.currentIndex === 0" class="nav-btn">
                ← Previous
              </button>
              <span class="slide-counter">
                {{ viewerModal.currentIndex + 1 }} / {{ viewerModal.slides.length }}
              </span>
              <button @click="nextSlide" :disabled="viewerModal.currentIndex === viewerModal.slides.length - 1" class="nav-btn">
                Next →
              </button>
            </div>
          </div>
        </div>
        <div class="viewer-footer">
          <button @click="downloadReport(viewerModal.report)" class="btn primary">Download</button>
          <button @click="closeViewer" class="btn cancel">Close</button>
        </div>
      </div>
    </div>
    
    <div v-if="errorModal.visible" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Error</h3>
        </div>
        <div class="modal-body">
          <p>{{ errorModal.message }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeErrorModal" class="btn primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { reportService, type Report } from '@/services/reportService'
import { saveAs } from 'file-saver'

const reports = ref<Report[]>([])
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  report: null as Report | null
})

// Pagination
const itemsPerPage = 9
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(reports.value.length / itemsPerPage))

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return reports.value.slice(start, end)
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

const deleteModal = ref({
  visible: false,
  report: null as Report | null
})

const errorModal = ref({
  visible: false,
  message: ''
})

const viewerModal = ref({
  visible: false,
  report: null as Report | null,
  slides: [] as string[],
  currentIndex: 0,
  currentSlide: null as string | null
})

onMounted(async () => {
  await loadReports()
})

const loadReports = async () => {
  try {
    console.log('📊 Reports page: Loading reports...')
    reports.value = await reportService.getAllReports()
    console.log('📊 Reports page: Loaded reports:', reports.value.length)
    currentPage.value = 1 // Reset to first page when loading new reports
  } catch (error) {
    console.error('📊 Reports page: Error loading reports:', error)
  }
}

const downloadReport = async (report: Report | null) => {
  if (!report) return
  
  try {
    const blob = new Blob([report.pptData], { 
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
    })
    saveAs(blob, `${report.name}.pptx`)
  } catch (error) {
    console.error('Error downloading report:', error)
    showErrorModal('Failed to download report. Please try again.')
  }
}

const deleteReport = async (report: Report) => {
  deleteModal.value = {
    visible: true,
    report: report
  }
}

const confirmDelete = async () => {
  if (deleteModal.value.report) {
    try {
      await reportService.deleteReport(deleteModal.value.report.id)
      await loadReports()
      deleteModal.value.visible = false
    } catch (error) {
      console.error('Error deleting report:', error)
      showErrorModal('Failed to delete report. Please try again.')
    }
  }
}

const cancelDelete = () => {
  deleteModal.value.visible = false
}

const showErrorModal = (message: string) => {
  errorModal.value.message = message
  errorModal.value.visible = true
}

const closeErrorModal = () => {
  errorModal.value.visible = false
}

const viewReport = async (report: Report) => {
  try {
    viewerModal.value = {
      visible: true,
      report: report,
      slides: [],
      currentIndex: 0,
      currentSlide: null
    }
    
    await extractSlidesFromPPT(report)
  } catch (error) {
    console.error('Error viewing report:', error)
    showErrorModal('Failed to view report. Please try again.')
  }
}

const extractSlidesFromPPT = async (report: Report) => {
  try {
    if (report.slideImages && report.slideImages.length > 0) {
      viewerModal.value.slides = report.slideImages
      viewerModal.value.currentSlide = report.slideImages[0]
      return
    }
    
    viewerModal.value.slides = []
    viewerModal.value.currentSlide = null
  } catch (error) {
    console.error('Error loading slides:', error)
    viewerModal.value.slides = []
    viewerModal.value.currentSlide = null
  }
}

const previousSlide = () => {
  if (viewerModal.value.currentIndex > 0) {
    viewerModal.value.currentIndex--
    viewerModal.value.currentSlide = viewerModal.value.slides[viewerModal.value.currentIndex]
  }
}

const nextSlide = () => {
  if (viewerModal.value.currentIndex < viewerModal.value.slides.length - 1) {
    viewerModal.value.currentIndex++
    viewerModal.value.currentSlide = viewerModal.value.slides[viewerModal.value.currentIndex]
  }
}

const closeViewer = () => {
  viewerModal.value.visible = false
}

const showContextMenu = (event: MouseEvent, report: Report) => {
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    report
  }
}

const hideContextMenu = () => {
  contextMenu.value.visible = false
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.reports-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
  position: relative;
}

.content-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 32px;
}

.content-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.content-header p {
  color: #6b7280;
  margin: 0;
  margin-left: 16px;
  font-size: 16px;
}

.reports-content {
  display: flex;
  flex-direction: column;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.report-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 108px;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.report-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.report-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-date {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.report-card:hover .report-actions {
  opacity: 1;
}

.download-btn,
.delete-btn {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 70px;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.download-btn {
  background: #55B691;
  color: white;
  border-color: #55B691;
}

.download-btn:hover {
  background: #4a9d7a;
  border-color: #4a9d7a;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(85, 182, 145, 0.3);
}

.delete-btn {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.delete-btn:hover {
  background: #dc2626;
  border-color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
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

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
}

.context-menu-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.2s ease;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

.context-menu-item:first-child {
  border-radius: 6px 6px 0 0;
}

.context-menu-item:last-child {
  border-radius: 0 0 6px 6px;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0 0 12px 0;
  color: #374151;
  line-height: 1.5;
}

.warning-text {
  color: #ef4444 !important;
  font-size: 14px;
  font-weight: 500;
}

.modal-footer {
  padding: 16px 24px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn.cancel {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn.cancel:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn.delete {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn.delete:hover {
  background: #dc2626;
  border-color: #dc2626;
}

.viewer-modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 85vw;
  max-height: 85vh;
  width: 800px;
  height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-top: -80px;
}

.viewer-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.viewer-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.viewer-body {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.slide-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.slide-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 12px;
}

.slide {
  max-width: 100%;
  max-height: 100%;
}

.slide img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.loading-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #55B691;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.slide-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.nav-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-counter {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.viewer-footer {
  padding: 8px 16px 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
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

