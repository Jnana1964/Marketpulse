/**
 * Supported stock universe.
 *
 * Groww's public trading API (https://groww.in/trade-api/docs) does not
 * document an instrument-search endpoint — only quote/LTP/OHLC/historical
 * lookups by an exact `trading_symbol`. So `/api/stocks/search` searches
 * this fixed, backend-configured universe rather than pretending to hit a
 * live search API that doesn't exist. This is a documented limitation, not
 * a shortcut: see README "Limitations".
 *
 * All instruments are NSE, CASH segment large/liquid names — enough to
 * demo every change-detection and importance-ranking behavior credibly.
 */
const INSTRUMENT_UNIVERSE = [
  { symbol: 'RELIANCE', exchange: 'NSE', segment: 'CASH', name: 'Reliance Industries Ltd' },
  { symbol: 'TCS', exchange: 'NSE', segment: 'CASH', name: 'Tata Consultancy Services Ltd' },
  { symbol: 'INFY', exchange: 'NSE', segment: 'CASH', name: 'Infosys Ltd' },
  { symbol: 'HDFCBANK', exchange: 'NSE', segment: 'CASH', name: 'HDFC Bank Ltd' },
  { symbol: 'ICICIBANK', exchange: 'NSE', segment: 'CASH', name: 'ICICI Bank Ltd' },
  { symbol: 'ITC', exchange: 'NSE', segment: 'CASH', name: 'ITC Ltd' },
  { symbol: 'SBIN', exchange: 'NSE', segment: 'CASH', name: 'State Bank of India' },
  { symbol: 'TATAMOTORS', exchange: 'NSE', segment: 'CASH', name: 'Tata Motors Ltd' },
  { symbol: 'WIPRO', exchange: 'NSE', segment: 'CASH', name: 'Wipro Ltd' },
  { symbol: 'HINDUNILVR', exchange: 'NSE', segment: 'CASH', name: 'Hindustan Unilever Ltd' },
  { symbol: 'BHARTIARTL', exchange: 'NSE', segment: 'CASH', name: 'Bharti Airtel Ltd' },
  { symbol: 'ASIANPAINT', exchange: 'NSE', segment: 'CASH', name: 'Asian Paints Ltd' },
];

function searchInstruments(query) {
  const q = (query || '').trim().toUpperCase();
  if (!q) return [];
  return INSTRUMENT_UNIVERSE.filter(
    (inst) => inst.symbol.includes(q) || inst.name.toUpperCase().includes(q)
  ).slice(0, 20);
}

function findInstrument(symbol, exchange = 'NSE') {
  const s = (symbol || '').trim().toUpperCase();
  return INSTRUMENT_UNIVERSE.find((inst) => inst.symbol === s && inst.exchange === exchange) || null;
}

module.exports = { INSTRUMENT_UNIVERSE, searchInstruments, findInstrument };
