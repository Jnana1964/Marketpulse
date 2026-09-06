import apiClient from './apiClient';

export async function fetchDashboard(watchlistId) {
  const { data } = await apiClient.get('/insights/dashboard', { params: watchlistId ? { watchlistId } : {} });
  return data.data;
}

export async function fetchStockInsight(symbol) {
  const { data } = await apiClient.get(`/insights/stock/${symbol}`);
  return data.data;
}

export async function fetchChanges({ priority = 'ALL', time = 'SINCE_LAST_CHECK' } = {}) {
  const { data } = await apiClient.get('/insights/changes', { params: { priority, time } });
  return data.data;
}

export async function fetchHistoryChecks() {
  const { data } = await apiClient.get('/insights/history');
  return data.data.checks;
}

export async function fetchHistoryDetail(snapshotTime) {
  const { data } = await apiClient.get(`/insights/history/${encodeURIComponent(snapshotTime)}`);
  return data.data;
}

export async function fetchSettings() {
  const { data } = await apiClient.get('/settings');
  return data.data;
}

export async function updateSettings(payload) {
  const { data } = await apiClient.put('/settings', payload);
  return data.data;
}
