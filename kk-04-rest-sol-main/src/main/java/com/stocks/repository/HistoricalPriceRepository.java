package com.stocks.repository;

import com.stocks.model.HistoricalPrice;
import java.util.List;

/** Data access interface for HistoricalPrice. New in Module 03. */
public interface HistoricalPriceRepository {
    List<HistoricalPrice> findByStockId(Long stockId);
    HistoricalPrice save(HistoricalPrice price);
}
