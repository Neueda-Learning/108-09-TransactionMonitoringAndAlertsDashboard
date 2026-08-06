import { useState, useEffect } from 'react'
import { getPrices, addPrice } from '../api.js'

const EMPTY_FORM = {
  priceDate: '',
  openPrice: '',
  closePrice: '',
  highPrice: '',
  lowPrice: '',
  volume: '',
}

export default function StockDetailPage({ stock, onBack }) {
  const [prices, setPrices] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPrices(stock.id)
      .then(setPrices)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [stock.id])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      const created = await addPrice(stock.id, {
        priceDate: form.priceDate,
        openPrice: parseFloat(form.openPrice),
        closePrice: parseFloat(form.closePrice),
        highPrice: parseFloat(form.highPrice),
        lowPrice: parseFloat(form.lowPrice),
        volume: parseInt(form.volume, 10),
      })
      setPrices(p => [...p, created])
      setForm(EMPTY_FORM)
    } catch (e) {
      setError(e.message)
    }
  }

  const fmt = n => n != null ? Number(n).toFixed(2) : '—'

  return (
    <>
      <button className="back-link" onClick={onBack}>← Back to Stocks</button>

      <div className="card">
        <h2>
          <span className="tag" style={{ marginRight: 8 }}>{stock.symbol}</span>
          {stock.companyName}
          <span style={{ color: '#999', fontWeight: 400, fontSize: '0.85rem', marginLeft: 12 }}>
            {stock.exchange} · {stock.sector}
          </span>
        </h2>
      </div>

      <div className="card">
        <h2>Add Price Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Date</label>
            <input type="date" name="priceDate" value={form.priceDate}
              onChange={handleChange} required />
          </div>
          {['openPrice','closePrice','highPrice','lowPrice'].map(f => (
            <div className="field" key={f}>
              <label>{f.replace('Price', ' Price').replace(/^./, c => c.toUpperCase())}</label>
              <input type="number" step="0.01" name={f} value={form[f]}
                onChange={handleChange} placeholder="0.00" required style={{ width: 100 }} />
            </div>
          ))}
          <div className="field">
            <label>Volume</label>
            <input type="number" name="volume" value={form.volume}
              onChange={handleChange} placeholder="1000000" required style={{ width: 120 }} />
          </div>
          <button type="submit" className="btn btn-primary">+ Add Price</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Price History</h2>
        {loading ? (
          <p className="empty">Loading…</p>
        ) : prices.length === 0 ? (
          <p className="empty">No price entries yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Open</th><th>Close</th><th>High</th><th>Low</th><th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {prices
                .slice()
                .sort((a, b) => b.priceDate.localeCompare(a.priceDate))
                .map(p => (
                  <tr key={p.id}>
                    <td>{p.priceDate}</td>
                    <td>{fmt(p.openPrice)}</td>
                    <td><strong>{fmt(p.closePrice)}</strong></td>
                    <td style={{ color: '#16a34a' }}>{fmt(p.highPrice)}</td>
                    <td style={{ color: '#e63946' }}>{fmt(p.lowPrice)}</td>
                    <td>{Number(p.volume).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
