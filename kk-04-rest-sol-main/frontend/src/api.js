const BASE = '/api/stocks'

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : null
}

// Stocks
export const getStocks = () =>
  fetch(BASE).then(handleResponse)

export const createStock = (stock) =>
  fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stock),
  }).then(handleResponse)

// Prices
export const getPrices = (stockId) =>
  fetch(`${BASE}/${stockId}/prices`).then(handleResponse)

export const addPrice = (stockId, price) =>
  fetch(`${BASE}/${stockId}/prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(price),
  }).then(handleResponse)
