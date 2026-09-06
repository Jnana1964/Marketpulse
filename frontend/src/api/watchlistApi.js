import apiClient from './apiClient';

export async function fetchWatchlists() {
  const { data } = await apiClient.get('/watchlists');
  return data.data.watchlists;
}

export async function fetchWatchlist(id) {
  const { data } = await apiClient.get(`/watchlists/${id}`);
  return data.data;
}

export async function addWatchlistItem(watchlistId, { symbol, exchange = 'NSE' }) {
  const { data } = await apiClient.post(`/watchlists/${watchlistId}/items`, { symbol, exchange });
  return data.data;
}

export async function removeWatchlistItem(watchlistId, itemId) {
  const { data } = await apiClient.delete(`/watchlists/${watchlistId}/items/${itemId}`);
  return data.data;
}

export async function searchStocks(query) {
  const { data } = await apiClient.get('/stocks/search', { params: { q: query } });
  return data.data.results;
}
