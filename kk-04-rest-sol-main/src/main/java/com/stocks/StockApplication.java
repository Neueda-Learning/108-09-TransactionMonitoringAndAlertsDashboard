package com.stocks;

import com.stocks.model.HistoricalPrice;
import com.stocks.model.Stock;
import com.stocks.service.StockService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootApplication
public class StockApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockApplication.class, args);
    }

    @Bean
    ApplicationRunner seedData(StockService service) {
        return args -> {
            if (service.getAllStocks().isEmpty()) {
                Stock hsbc = service.addStock(new Stock(null, "HSBA", "HSBC Holdings PLC", "Banking", "LSE"));
                Stock bp   = service.addStock(new Stock(null, "BP",   "BP PLC",            "Energy",  "LSE"));

                service.addPrice(new HistoricalPrice(null, hsbc.id(), LocalDate.of(2024, 6, 3),
                        bd("6.21"), bd("6.28"), bd("6.31"), bd("6.18"), 28_000_000L));
                service.addPrice(new HistoricalPrice(null, hsbc.id(), LocalDate.of(2024, 6, 4),
                        bd("6.28"), bd("6.19"), bd("6.30"), bd("6.15"), 32_000_000L));
                service.addPrice(new HistoricalPrice(null, hsbc.id(), LocalDate.of(2024, 6, 5),
                        bd("6.19"), bd("6.35"), bd("6.38"), bd("6.17"), 41_000_000L));

                service.addPrice(new HistoricalPrice(null, bp.id(), LocalDate.of(2024, 6, 3),
                        bd("4.52"), bd("4.48"), bd("4.55"), bd("4.45"), 19_000_000L));
                service.addPrice(new HistoricalPrice(null, bp.id(), LocalDate.of(2024, 6, 4),
                        bd("4.48"), bd("4.61"), bd("4.63"), bd("4.46"), 25_000_000L));
                service.addPrice(new HistoricalPrice(null, bp.id(), LocalDate.of(2024, 6, 5),
                        bd("4.61"), bd("4.57"), bd("4.65"), bd("4.54"), 22_000_000L));
            }
            System.out.println("API ready at http://localhost:8080/api/stocks");
        };
    }

    private static BigDecimal bd(String val) { return new BigDecimal(val); }
}
