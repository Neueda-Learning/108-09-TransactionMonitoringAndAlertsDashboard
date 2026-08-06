-- Shared schema for all LAB and SOLUTION projects (stocksdb)
-- All lab and solution projects from Module 03 onwards use this exact schema.
-- Run once against stocksdb, or let Spring Boot apply it via schema.sql on startup.

CREATE TABLE IF NOT EXISTS stock (
    id           BIGINT        AUTO_INCREMENT PRIMARY KEY,
    symbol       VARCHAR(10)   NOT NULL UNIQUE,
    company_name VARCHAR(200)  NOT NULL,
    sector       VARCHAR(50)   NOT NULL,
    exchange     VARCHAR(20)   NOT NULL    -- LSE, NYSE, NASDAQ
);

CREATE TABLE IF NOT EXISTS historical_price (
    id          BIGINT         AUTO_INCREMENT PRIMARY KEY,
    stock_id    BIGINT         NOT NULL,
    price_date  DATE           NOT NULL,
    open_price  DECIMAL(15, 4) NOT NULL,
    close_price DECIMAL(15, 4) NOT NULL,
    high_price  DECIMAL(15, 4) NOT NULL,
    low_price   DECIMAL(15, 4) NOT NULL,
    volume      BIGINT         NOT NULL,
    CONSTRAINT fk_price_stock FOREIGN KEY (stock_id) REFERENCES stock (id),
    CONSTRAINT uq_stock_date  UNIQUE (stock_id, price_date)
);
