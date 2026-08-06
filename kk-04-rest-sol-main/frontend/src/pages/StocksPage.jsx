import { useState, useEffect } from 'react'
import { getStocks, createStock } from '../api.js'

const EMPTY_FORM = { symbol: '', companyName: '', sector: '', exchange: '' }

export default function StocksPage({ onSelect }) {
  const [stocks, setStocks] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStocks()
      .then(setStocks)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      const created = await createStock(form)
      setStocks(s => [...s, created])
      setForm(EMPTY_FORM)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <div className="card">
        <h2>Add Stock</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Symbol</label>
            <input name="symbol" value={form.symbol} onChange={handleChange}
              placeholder="AAPL" required style={{ width: 90 }} />
          </div>
          <div className="field">
            <label>Company Name</label>
            <input name="companyName" value={form.companyName} onChange={handleChange}
              placeholder="Apple Inc." required style={{ width: 200 }} />
          </div>
          <div className="field">
            <label>Sector</label>
            <input name="sector" value={form.sector} onChange={handleChange}
              placeholder="Technology" style={{ width: 140 }} />
          </div>
          <div className="field">
            <label>Exchange</label>
            <input name="exchange" value={form.exchange} onChange={handleChange}
              placeholder="NASDAQ" style={{ width: 110 }} />
          </div>
          <button type="submit" className="btn btn-primary">+ Add Stock</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Stocks</h2>
        {loading ? (
          <p className="empty">Loading…</p>
        ) : stocks.length === 0 ? (
          <p className="empty">No stocks yet. Add one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Symbol</th><th>Company</th><th>Sector</th><th>Exchange</th><th>Prices</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s.id} className="stock-row" onClick={() => onSelect(s)}>
                  <td>{s.id}</td>
                  <td><span className="tag">{s.symbol}</span></td>
                  <td className="stock-name">{s.companyName}</td>
                  <td>{s.sector}</td>
                  <td>{s.exchange}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm"
                      onClick={e => { e.stopPropagation(); onSelect(s) }}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
