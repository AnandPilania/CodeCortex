<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-linear-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">CodeCortex</h1>
              <p class="text-xs text-gray-500">Code Quality Dashboard</p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="fetchData"
              :disabled="loading"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ loading ? 'Refreshing...' : 'Refresh' }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading && !data" class="text-center py-20">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p class="mt-4 text-gray-600">Loading analysis data...</p>
      </div>

      <div v-else-if="error" class="card border-danger-200 bg-danger-50">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-danger-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-danger-900">{{ error }}</h3>
            <p class="text-sm text-danger-700 mt-1">Run the analyzer with --ui flag to generate data</p>
            <pre class="mt-2 text-xs bg-white p-3 rounded-sm border border-danger-200 text-gray-700">project-analyzer . --ui</pre>
          </div>
        </div>
      </div>

      <div v-else-if="data">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <div class="metric-value">{{ data.globalStats?.totalFiles || 0 }}</div>
                <div class="metric-label">Total Files</div>
              </div>
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <div class="metric-value">{{ formatNumber(data.aggregateMetrics?.loc) }}</div>
                <div class="metric-label">Lines of Code</div>
              </div>
              <div class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <div class="metric-value">{{ data.globalStats?.directories?.size || 0 }}</div>
                <div class="metric-label">Directories</div>
              </div>
              <div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="stat-card" v-if="data.enhancedMetrics?.codeQualityScore !== undefined">
            <div class="flex items-center justify-between">
              <div>
                <div class="metric-value">{{ data.enhancedMetrics.codeQualityScore }}/100</div>
                <div class="metric-label">Quality Score</div>
              </div>
              <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="getScoreColorClass(data.enhancedMetrics.codeQualityScore)">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="card">
            <h3 class="card-header">Language Distribution</h3>
            <LanguageChart :data="getLanguageData()" />
          </div>

          <div class="card">
            <h3 class="card-header">Code Metrics</h3>
            <MetricsChart :data="getMetricsData()" />
          </div>
        </div>

        <div v-if="data.enhancedMetrics" class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Laravel Analysis</h2>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="card">
              <h3 class="card-header">Dead Code Analysis</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Unused Classes</span>
                  <span class="badge badge-danger">{{ data.enhancedMetrics.deadCode?.unusedClasses?.length || 0 }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Unused Methods</span>
                  <span class="badge badge-warning">{{ data.enhancedMetrics.deadCode?.unusedMethods?.length || 0 }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Unused Imports</span>
                  <span class="badge badge-warning">{{ data.enhancedMetrics.deadCode?.unusedImports?.length || 0 }}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <h3 class="card-header">Code Quality</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Duplicate Blocks</span>
                  <span class="badge badge-danger">{{ data.enhancedMetrics.duplicateCode?.length || 0 }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">Quality Score</span>
                  <span :class="getScoreBadgeClass(data.enhancedMetrics.codeQualityScore)">
                    {{ data.enhancedMetrics.codeQualityScore }}/100
                  </span>
                </div>
              </div>
            </div>

            <div class="card">
              <h3 class="card-header">Project Info</h3>
              <div class="space-y-3">
                <div v-if="data.enhancedMetrics.projectType">
                  <span class="text-sm text-gray-600">Type</span>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ data.enhancedMetrics.projectType }}</p>
                </div>
                <div v-if="data.enhancedMetrics.laravelVersion">
                  <span class="text-sm text-gray-600">Laravel Version</span>
                  <p class="text-sm font-medium text-gray-900 mt-1">{{ data.enhancedMetrics.laravelVersion }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-header">File Breakdown by Type</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOC</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(metrics, driver) in data.driverMetrics" :key="driver">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ driver }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ metrics.files || 0 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatNumber(metrics.loc) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                        <div
                          class="bg-primary-600 h-2 rounded-full"
                          :style="{ width: getPercentage(metrics.files, data.globalStats.analyzedFiles) + '%' }"
                        ></div>
                      </div>
                      <span class="text-sm text-gray-600">{{ getPercentage(metrics.files, data.globalStats.analyzedFiles) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-20">
        <svg class="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">No Analysis Data</h3>
        <p class="mt-2 text-sm text-gray-500">Run the analyzer with --ui flag to see results here</p>
        <div class="mt-6">
          <pre class="inline-block text-left bg-gray-100 px-4 py-3 rounded-lg text-sm text-gray-700">project-analyzer . --ui</pre>
        </div>
      </div>
    </main>

    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-sm text-gray-500">
          CodeCortex Dashboard • Last updated: {{ lastUpdated }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LanguageChart from './components/LanguageChart.vue';
import MetricsChart from './components/MetricsChart.vue';

const data = ref(null);
const loading = ref(false);
const error = ref(null);
const lastUpdated = ref('Never');

const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('/api/analysis');

    if (!response.ok) {
      throw new Error('No analysis data available');
    }

    const result = await response.json();
    data.value = result;
    lastUpdated.value = new Date(result.timestamp).toLocaleString();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num) => {
  return num?.toLocaleString() || '0';
};

const getPercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};

const getScoreColorClass = (score) => {
  if (score >= 80) return 'bg-success-100 text-success-600';
  if (score >= 60) return 'bg-warning-100 text-warning-600';
  return 'bg-danger-100 text-danger-600';
};

const getScoreBadgeClass = (score) => {
  if (score >= 80) return 'badge badge-success';
  if (score >= 60) return 'badge badge-warning';
  return 'badge badge-danger';
};

const getLanguageData = () => {
  if (!data.value?.driverMetrics) return null;

  const labels = [];
  const values = [];
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  Object.entries(data.value.driverMetrics).forEach(([driver, metrics], index) => {
    if (metrics.files > 0) {
      labels.push(driver);
      values.push(metrics.files);
    }
  });

  return { labels, values, colors: colors.slice(0, labels.length) };
};

const getMetricsData = () => {
  if (!data.value?.aggregateMetrics) return null;

  const metrics = data.value.aggregateMetrics;
  return {
    labels: ['LOC', 'CLOC', 'NCLOC', 'LLOC'],
    values: [
      metrics.loc || 0,
      metrics.cloc || 0,
      metrics.ncloc || 0,
      metrics.lloc || 0
    ]
  };
};

onMounted(() => {
  fetchData();

  setInterval(fetchData, 30000);
});
</script>
