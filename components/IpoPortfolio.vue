<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { usePortfolioStore, type Holding } from '../stores/portfolio';
import VueApexCharts from 'vue3-apexcharts';
import EditPortfolioModal from './EditPortfolioModal.vue';
import ConfirmModal from './ConfirmModal.vue';

const portfolioStore = usePortfolioStore();

type ChartType = 'donut' | 'treemap' | 'radialBar';
const activeChart = ref<ChartType>('donut');

const isEditModalVisible = ref(false);
const isConfirmModalVisible = ref(false);
const selectedHolding = ref<Holding | null>(null);

onMounted(() => {
  portfolioStore.fetchPortfolio();
});

const formatCurrency = (value: number) => `Rs. ${value.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatKpiValue = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return `Rs. ${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
};

// A safe default configuration to prevent rendering errors before data is loaded.
const safeDefaultChart = {
  series: [],
  options: {
    chart: { type: 'donut' as const, sparkline: { enabled: true } },
    labels: [],
  }
};

// --- COMPUTED PROPERTIES FOR APEXCHARTS ---

const donutChart = computed(() => {
  if (!portfolioStore.chartData?.values.length) return safeDefaultChart;
  return {
    series: portfolioStore.chartData.values,
    options: {
      chart: { type: 'donut' as const, sparkline: { enabled: true } },
      labels: portfolioStore.chartData.labels,
      theme: {
        monochrome: {
          enabled: true,
          color: '#3B82F6',
          shadeIntensity: 0.6,
          shadeTo: 'dark'
        }
      },
      legend: {
        position: 'bottom' as const,
        horizontalAlign: 'center' as const,
        labels: { colors: '#94A3B8' },
        itemMargin: { horizontal: 10 },
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Value',
                color: '#94A3B8',
                fontSize: '14px',
                fontWeight: 400,
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return formatKpiValue(total);
                }
              },
              value: {
                fontSize: '22px',
                fontWeight: 600,
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        theme: 'dark' as const,
        y: {
          formatter: (val: number) => formatCurrency(val)
        }
      }
    }
  };
});

const treemapChart = computed(() => {
  if (!portfolioStore.chartData?.labels.length) return safeDefaultChart;
  const seriesData = portfolioStore.chartData.labels.map((label, index) => ({
    x: label,
    y: portfolioStore.chartData.values[index],
  }));
  return {
    series: [{ data: seriesData }],
    options: {
      chart: { type: 'treemap' as const, toolbar: { show: false } },
      theme: { theme: 'dark' as const },
      dataLabels: {
        enabled: true,
        style: { fontSize: '14px' },
        formatter: (text: string, opts: any) => `${text}: ${formatKpiValue(opts.value)}`,
      },
      legend: { show: false },
      tooltip: {
        theme: 'dark' as const,
        y: { formatter: (val: number) => formatCurrency(val) }
      }
    }
  };
});

const radialBarChart = computed(() => {
  if (!portfolioStore.summary) return safeDefaultChart;
  const percentage = portfolioStore.summary.totalGainLossPercentage;
  const color = percentage >= 0 ? '#34D399' : '#F87171';
  return {
    series: [Number(percentage.toFixed(1))],
    options: {
      chart: { type: 'radialBar' as const },
      theme: { theme: 'dark' as const },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: {
            margin: 15,
            size: '65%',
          },
          dataLabels: {
            name: {
              fontSize: '16px',
              color: '#A1A1AA',
              offsetY: -10,
              show: true,
              formatter: () => 'Total Return',
            },
            value: {
              fontSize: '24px',
              color: color,
              fontWeight: 600,
              offsetY: 5,
              formatter: (val: number) => `${val}%`,
            },
          },
        },
      },
      fill: { colors: [color] },
      stroke: { lineCap: 'round' },
    },
  };
});

const currentChart = computed(() => {
  switch(activeChart.value) {
    case 'treemap': return treemapChart.value;
    case 'radialBar': return radialBarChart.value;
    case 'donut': default: return donutChart.value;
  }
});

// --- MODAL HANDLERS ---
function promptEdit(holding: Holding) {
  selectedHolding.value = holding;
  isEditModalVisible.value = true;
}

function promptRemove(holding: Holding) {
  selectedHolding.value = holding;
  isConfirmModalVisible.value = true;
}

async function handleSaveChanges(payload: { ipoId: number, data: any }) {
  const result = await portfolioStore.updateHolding(payload.ipoId, payload.data);
  // Emit the toast event to the parent (Popup.vue)
  emit('showToast', {
    message: result.message || (result.success ? 'Portfolio updated!' : 'Failed to update.'),
    type: result.success ? 'success' : 'error'
  });
  isEditModalVisible.value = false;
}

async function confirmRemove() {
  if (selectedHolding.value) {
    const result = await portfolioStore.removeFromPortfolio(selectedHolding.value.id);
    // Emit the toast event to the parent (Popup.vue)
    emit('showToast', {
      message: result.message || (result.success ? 'Holding removed.' : 'Failed to remove.'),
      type: result.success ? 'success' : 'error'
    });
  }
  isConfirmModalVisible.value = false;
}
</script>

<template>
  <div class="portfolio-view">
    <div v-if="portfolioStore.isLoading" class="state-message">Loading Your Portfolio...</div>
    <div v-else-if="portfolioStore.error" class="state-message error">{{ portfolioStore.error }}</div>

    <div v-else-if="portfolioStore.summary" class="portfolio-content">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Current Value</div>
          <div class="kpi-value" :title="formatCurrency(portfolioStore.summary.totalCurrentValue)">
            {{ formatKpiValue(portfolioStore.summary.totalCurrentValue) }}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Gain/Loss</div>
          <div
              class="kpi-value"
              :class="{
              'positive': portfolioStore.summary.totalGainLoss > 0,
              'negative': portfolioStore.summary.totalGainLoss < 0
            }"
              :title="formatCurrency(portfolioStore.summary.totalGainLoss)"
          >
            {{ formatKpiValue(portfolioStore.summary.totalGainLoss) }}
          </div>
        </div>
      </div>

      <div class="chart-container">
          <div class="chart-header">
            <h3 class="section-title">Allocation</h3>
            <select v-model="activeChart" class="chart-select">
              <option value="donut">By Sector (Donut)</option>
              <option value="treemap">By Sector (Treemap)</option>
              <option value="radialBar">Total Return %</option>
            </select>
          </div>
        <div class="chart-wrapper">
          <VueApexCharts
              :key="activeChart"
              :type="currentChart.options.chart?.type || 'donut'"
              height="180"
              :options="currentChart.options"
              :series="currentChart.series"
          />
        </div>
      </div>

      <div class="holdings-list">
        <h3 class="section-title">Your Holdings</h3>
        <div v-if="portfolioStore.holdings.length === 0" class="state-message">No holdings yet.</div>
        <ul v-else class="item-list-scroll-wrapper">
          <li v-for="holding in portfolioStore.holdings" :key="holding.id" class="holding-item">
            <div class="item-info">
              <span class="item-name">{{ holding.name }}</span>
              <span class="item-meta">{{ holding.unitsAllotted }} units @ {{ formatCurrency(holding.purchasePrice) }}</span>
            </div>
            <div class="item-value">
              <span class="value-main">{{ formatCurrency(holding.currentValue) }}</span>
              <span
                  class="value-change"
                  :class="{
                  'positive': holding.currentValue > holding.investmentValue,
                  'negative': holding.currentValue < holding.investmentValue
                }"
              >
                {{ (((holding.currentValue - holding.investmentValue) / holding.investmentValue) * 100).toFixed(1) }}%
              </span>
            </div>
            <div class="item-actions">
              <button @click="promptEdit(holding)" class="action-btn" title="Edit Holding">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 19.08a2.25 2.25 0 01-1.06.669l-3.328.788a.75.75 0 01-.976-.976l.788-3.328a2.25 2.25 0 01.669-1.06l12.13-12.132z" /></svg>
              </button>
              <button @click="promptRemove(holding)" class="action-btn remove-btn" title="Remove Holding">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div v-else class="state-message">
      You haven't added any IPOs to your portfolio yet.
    </div>

    <!-- MODALS -->
    <EditPortfolioModal
        :show="isEditModalVisible"
        :holding="selectedHolding"
        @close="isEditModalVisible = false"
        @save="handleSaveChanges"
    />
    <ConfirmModal
        :show="isConfirmModalVisible"
        title="Confirm Removal"
        message="Are you sure you want to remove this holding from your portfolio?"
        confirmText="Yes, Remove"
        @confirm="confirmRemove"
        @cancel="isConfirmModalVisible = false"
    />
  </div>
</template>

<style scoped>
.portfolio-view {
  height: 100%; display: flex; flex-direction: column; overflow: hidden;
  font-family: 'Inter', sans-serif;
}
.portfolio-content {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden; padding: 24px; gap: 24px;
}
.section-title {
  font-size: 1rem; font-weight: 600; color: #E4E4E7;
}
.kpi-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.kpi-card {
  background: #18181B; border-radius: 12px; padding: 16px;
  border: 1px solid #27272A; height: 62px; display: flex;
  flex-direction: column; justify-content: space-between;
}
.kpi-label { font-size: 0.8125rem; color: #A1A1AA; }
.kpi-value { font-size: 1.5rem; font-weight: 700; color: white; line-height: 1; cursor: help; }
.positive { color: #34D399; }
.negative { color: #F87171; }
.chart-container { position: relative; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.chart-select {
  background-color: #18181B; color: #E4E4E7; border: 1px solid #27272A;
  border-radius: 6px; padding: 6px 10px; font-family: 'Inter', sans-serif;
  font-size: 0.8125rem; -webkit-appearance: none; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='3' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
  background-size: 12px; padding-right: 32px;
}
.chart-wrapper { min-height: 180px; }

.holdings-list { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.item-list-scroll-wrapper { list-style: none; padding: 0; margin: 0; overflow-y: auto; }
.item-list-scroll-wrapper::-webkit-scrollbar { width: 4px; }
.item-list-scroll-wrapper::-webkit-scrollbar-thumb { background: #3F3F46; border-radius: 2px; }
.item-list-scroll-wrapper::-webkit-scrollbar-track { background: transparent; }

.holding-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 16px;
  padding: 12px 4px;
  border-bottom: 1px solid transparent;
  border-image: linear-gradient(to right, #18181B, #27272A, #18181B) 1;
}
.holding-item:last-child { border-bottom: none; }
.item-info { display: flex; flex-direction: column; min-width: 0; }
.item-name { font-weight: 500; color: #E4E4E7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta { font-size: 0.8125rem; color: #71717A; margin-top: 2px; }
.item-value { text-align: right; }
.value-main { font-weight: 500; color: white; }
.value-change { font-size: 0.8125rem; display: block; text-align: right; }
.item-actions { display: flex; gap: 8px; }
.action-btn {
  width: 32px; height: 32px; display: flex; align-items: center;
  justify-content: center; background-color: #27272A;
  border: 1px solid #3F3F46; border-radius: 6px;
  color: #A1A1AA; cursor: pointer; transition: all 150ms ease;
}
.action-btn:hover { background-color: #3F3F46; color: white; }
.remove-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #EF4444;
  color: #F87171;
}
.action-btn svg { width: 16px; height: 16px; }

.state-message {
  padding: 48px; text-align: center; color: #71717A;
  flex: 1; display: flex; align-items: center; justify-content: center;
}
.state-message.error { color: #F87171; }

:deep(.apexcharts-datalabel-value){
  font-size: 16px;
}
</style>