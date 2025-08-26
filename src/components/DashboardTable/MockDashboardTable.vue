<template>
  <div class="mock-dashboard-table" data-template-placeholder="true">
    <div class="table-panel relative shadow-md overflow-auto" style="width: 100%; height: 100%; overflow-x: auto; overflow-y: auto;">
      <table data-testid="mock-performance-table" id="mock_performance_table" class="shadow bg-white" style="border-spacing: 0; width: 100%; min-width: 100%; font-size: 11px; table-layout: auto;">
        <thead class="sticky top-0 z-30 header-teal">
          <!-- Header Row 1 -->
          <tr>
            <th rowspan="2" class="px-4 py-2 text-left font-semibold text-white bg-teal-600 border-r border-teal-500">
              Underwriting Year
            </th>
            <th rowspan="2" class="px-4 py-2 text-center font-semibold text-white bg-teal-600 border-r border-teal-500">
              GWP
            </th>
            <th rowspan="2" class="px-4 py-2 text-center font-semibold text-white bg-teal-600 border-r border-teal-500">
              GEP
            </th>
            <th colspan="3" class="px-4 py-2 text-center font-semibold text-red-600 bg-teal-600 border-r border-teal-500">
              Earned Loss Ratios
            </th>
            <th rowspan="2" class="px-4 py-2 text-center font-semibold text-blue-600 bg-teal-600 border-r border-teal-500">
              Comm.
            </th>
            <th rowspan="2" class="px-4 py-2 text-center font-semibold text-white bg-teal-600 border-r border-teal-500">
              Earned CCR
            </th>
            <th rowspan="2" class="px-4 py-2 text-center font-semibold text-white bg-teal-600 border-r border-teal-500">
              Large Normalised Earned CCR
            </th>
            <th rowspan="2" class="px-4 py-2 text-center font-semibold text-white bg-teal-600">
              No Seas. Adj. A-priori CCR
            </th>
          </tr>
          <!-- Header Row 2 -->
          <tr>
            <th class="px-4 py-2 text-center font-medium text-red-600 bg-teal-600 border-r border-teal-500">
              Attritional Ultimate
            </th>
            <th class="px-4 py-2 text-center font-medium text-red-600 bg-teal-600 border-r border-teal-500">
              Large Ultimate
            </th>
            <th class="px-4 py-2 text-center font-medium text-red-600 bg-teal-600 border-r border-teal-500">
              Total Ultimate
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Template Placeholder Row -->
          <tr>
            <td colspan="10" class="px-4 py-16 text-center text-gray-500 bg-gray-50" style="height: 200px;">
              <div class="flex flex-col items-center justify-center space-y-2">
                <div class="text-base font-medium text-gray-600">
                  📊 Dashboard Table Template
                </div>
                <div class="text-xs text-gray-500">
                  This is a template placeholder. Real data will be populated when portfolio data is added.
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple template component - no data needed
</script>

<style scoped>
.mock-dashboard-table {
  width: 100%;
  height: 100%;
}

.header-teal {
  background-color: #0d9488;
}

.table-panel {
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

th, td {
  border: 1px solid #d1d5db;
  padding: 3px 6px;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

th {
  background-color: #0d9488;
  color: white;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

tbody tr {
  background-color: white;
}

tbody tr:hover {
  background-color: #f8fafc;
}

.border-r {
  border-right: 1px solid #d1d5db;
}

.border-gray-200 {
  border-color: #d1d5db;
}

.border-gray-300 {
  border-color: #9ca3af;
}

.border-teal-500 {
  border-color: #14b8a6;
}

.text-blue-600 {
  color: #2563eb;
}

.text-red-600 {
  color: #dc2626;
}

.bg-teal-100 {
  background-color: #ccfbf1;
}

/* Ensure proper text alignment */
.text-right {
  text-align: right;
}

.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

/* Font weights */
.font-semibold {
  font-weight: 600;
}

.font-medium {
  font-weight: 500;
}
</style>
