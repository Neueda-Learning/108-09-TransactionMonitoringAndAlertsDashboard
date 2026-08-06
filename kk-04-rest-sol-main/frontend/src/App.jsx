import { useState } from 'react'
import StocksPage from './pages/StocksPage.jsx'
import StockDetailPage from './pages/StockDetailPage.jsx'

export default function App() {
  const [selectedStock, setSelectedStock] = useState(null)

  return (
    <>
      <header>📈 Stock Manager</header>
      <div className="container">
        {selectedStock
          ? <StockDetailPage stock={selectedStock} onBack={() => setSelectedStock(null)} />
          : <StocksPage onSelect={setSelectedStock} />
        }
      </div>
    </>
  )
}
