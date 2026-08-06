package com.stocks.service;

import com.stocks.model.HistoricalPrice;
import com.stocks.model.Stock;
import com.stocks.repository.HistoricalPriceRepository;
import com.stocks.repository.StockRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;
    private final HistoricalPriceRepository priceRepository;

    public StockServiceImpl(StockRepository stockRepository, HistoricalPriceRepository priceRepository) {
        this.stockRepository = stockRepository;
        this.priceRepository = priceRepository;
    }

    @Override
    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }

    @Override
    public Optional<Stock> getStockById(Long id) {
        return stockRepository.findById(id);
    }

    @Override
    public Stock addStock(Stock stock) {
        stockRepository.findBySymbol(stock.symbol()).ifPresent(s -> {
            throw new IllegalArgumentException("Duplicate symbol: " + stock.symbol());
        });
        return stockRepository.save(stock);
    }

    @Override
    public HistoricalPrice addPrice(HistoricalPrice price) {
        return priceRepository.save(price);
    }

    @Override
    public List<HistoricalPrice> getPriceHistory(Long stockId) {
        return priceRepository.findByStockId(stockId);
    }
}
