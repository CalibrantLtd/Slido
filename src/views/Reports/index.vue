<template>
  <div class="reports-container">
    <div class="content-header">
      <h2>Reports</h2>
      <p>View and manage generated reports</p>
    </div>
    
    <div class="reports-content">
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No Reports Generated Yet</h3>
        <p>Generated reports will appear here once you create them from templates.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// This component will be implemented in future stages
</script>

<style scoped>
.reports-container {
  padding: 20px;
  height: 100vh;
  background-color: #f9fafb;
}

.content-header {
  margin-bottom: 30px;
}

.content-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.content-header p {
  color: #6b7280;
  margin: 0;
}

.reports-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 120px);
}

.empty-state {
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #374151;
}

.empty-state p {
  margin: 0;
  max-width: 400px;
}
</style>
