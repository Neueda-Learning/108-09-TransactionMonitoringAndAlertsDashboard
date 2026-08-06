package com.stocks.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/** New in Module 03. Represents one day of OHLCV price data for a stock. */
public record HistoricalPrice(
        Long id,
        Long stockId,
        LocalDate priceDate,
        BigDecimal openPrice,
        BigDecimal closePrice,
        BigDecimal highPrice,
        BigDecimal lowPrice,
        long volume
) {}
