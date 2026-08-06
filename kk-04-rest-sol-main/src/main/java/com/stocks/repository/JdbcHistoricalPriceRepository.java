package com.stocks.repository;

import com.stocks.model.HistoricalPrice;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class JdbcHistoricalPriceRepository implements HistoricalPriceRepository {

    private final JdbcTemplate jdbc;

    public JdbcHistoricalPriceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<HistoricalPrice> priceRowMapper = (rs, rowNum) -> new HistoricalPrice(
            rs.getLong("id"),
            rs.getLong("stock_id"),
            rs.getDate("price_date").toLocalDate(),
            rs.getBigDecimal("open_price"),
            rs.getBigDecimal("close_price"),
            rs.getBigDecimal("high_price"),
            rs.getBigDecimal("low_price"),
            rs.getLong("volume")
    );

    @Override
    public List<HistoricalPrice> findByStockId(Long stockId) {
        return jdbc.query(
                "SELECT * FROM historical_price WHERE stock_id = ? ORDER BY price_date DESC",
                priceRowMapper,
                stockId
        );
    }

    @Override
    public HistoricalPrice save(HistoricalPrice price) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO historical_price (stock_id, price_date, open_price, close_price, high_price, low_price, volume) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setLong(1, price.stockId());
            ps.setDate(2, Date.valueOf(price.priceDate()));
            ps.setBigDecimal(3, price.openPrice());
            ps.setBigDecimal(4, price.closePrice());
            ps.setBigDecimal(5, price.highPrice());
            ps.setBigDecimal(6, price.lowPrice());
            ps.setLong(7, price.volume());
            return ps;
        }, keyHolder);
        Long generatedId = keyHolder.getKey().longValue();
        return new HistoricalPrice(generatedId, price.stockId(), price.priceDate(),
                price.openPrice(), price.closePrice(), price.highPrice(), price.lowPrice(), price.volume());
    }
}
