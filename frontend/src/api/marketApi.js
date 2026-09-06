import apiClient from './apiClient';

export async function fetchQuote(symbol) {
  const { data } = await apiClient.get(`/market/quote/${symbol}`);
  return data.data;
}

export async function fetchWatchlistMarketData(watchlistId) {
  const { data } = await apiClient.get(`/market/watchlist/${watchlistId}`);
  return data.data;
}

export async function fetchStock(symbol) {
  const { data } = await apiClient.get(`/market/stock/${symbol}`);
  return data.data;
}

export async function fetchHistory(symbol, range = '1D') {
  const { data } = await apiClient.get(`/market/history/${symbol}`, { params: { range } });
  return data.data;
}
