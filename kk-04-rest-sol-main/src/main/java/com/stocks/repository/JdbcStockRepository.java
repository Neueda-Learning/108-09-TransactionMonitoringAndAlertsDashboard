package com.stocks.repository;

import com.stocks.model.Stock;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class JdbcStockRepository implements StockRepository {

    private final JdbcTemplate jdbc;

    public JdbcStockRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Stock> stockRowMapper = (rs, rowNum) -> new Stock(
            rs.getLong("id"),
            rs.getString("symbol"),
            rs.getString("company_name"),
            rs.getString("sector"),
            rs.getString("exchange")
    );

    @Override
    public List<Stock> findAll() {
        return jdbc.query("SELECT * FROM stock ORDER BY symbol", stockRowMapper);
    }

    @Override
    public Optional<Stock> findById(Long id) {
        var results = jdbc.query("SELECT * FROM stock WHERE id = ?", stockRowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.getFirst());
    }

    @Override
    public Optional<Stock> findBySymbol(String symbol) {
        var results = jdbc.query("SELECT * FROM stock WHERE symbol = ?", stockRowMapper, symbol);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.getFirst());
    }

    @Override
    public Stock save(Stock stock) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO stock (symbol, company_name, sector, exchange) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, stock.symbol());
            ps.setString(2, stock.companyName());
            ps.setString(3, stock.sector());
            ps.setString(4, stock.exchange());
            return ps;
        }, keyHolder);
        Long generatedId = keyHolder.getKey().longValue();
        return new Stock(generatedId, stock.symbol(), stock.companyName(), stock.sector(), stock.exchange());
    }
}
