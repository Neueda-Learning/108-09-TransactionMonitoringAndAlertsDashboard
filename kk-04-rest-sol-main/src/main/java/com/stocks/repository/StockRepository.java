package com.stocks.repository;

import com.stocks.model.Stock;
import java.util.List;
import java.util.Optional;

/** Data access interface for Stock. Carried forward from Module 02. */
public interface StockRepository {
    List<Stock> findAll();
    Optional<Stock> findById(Long id);
    Optional<Stock> findBySymbol(String symbol);
    Stock save(Stock stock);
}
