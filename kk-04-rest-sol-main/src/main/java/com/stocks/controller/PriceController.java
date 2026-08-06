package com.stocks.controller;

import com.stocks.model.HistoricalPrice;
import com.stocks.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks/{stockId}")
public class PriceController {

    private final StockService stockService;

    public PriceController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/prices")
    public List<HistoricalPrice> getPrices(@PathVariable Long stockId) {
        return stockService.getPriceHistory(stockId);
    }

    @PostMapping("/prices")
    public ResponseEntity<HistoricalPrice> addPrice(
            @PathVariable Long stockId,
            @RequestBody HistoricalPrice price) {
        // Override stockId with the value from the URL path so callers don't need
        // to include it in the body (cleaner REST design).
        HistoricalPrice priceWithStockId = new HistoricalPrice(
                null, stockId, price.priceDate(),
                price.openPrice(), price.closePrice(),
                price.highPrice(), price.lowPrice(), price.volume());
        return ResponseEntity.ok(stockService.addPrice(priceWithStockId));
    }
}
