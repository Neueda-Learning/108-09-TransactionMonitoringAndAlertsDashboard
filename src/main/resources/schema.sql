CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    transaction_id VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    payee_id VARCHAR(255) NOT NULL,
    payee_name VARCHAR(255),
    amount DOUBLE NOT NULL,
    currency VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(255) NOT NULL,
    transaction_time DATETIME(6) NOT NULL,
    description VARCHAR(255),
    status VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_transactions_transaction_id (transaction_id)
);

CREATE TABLE IF NOT EXISTS rules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    rule_name VARCHAR(255),
    rule_type VARCHAR(255),
    threshold DOUBLE,
    time_window_minutes INT,
    severity VARCHAR(255),
    active BIT,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    alert_id VARCHAR(255),
    transaction_id BIGINT NOT NULL,
    rule_id BIGINT NOT NULL,
    severity VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_alerts_transaction_id ON alerts (transaction_id);
CREATE INDEX idx_alerts_rule_id ON alerts (rule_id);
CREATE INDEX idx_alerts_status ON alerts (status);
CREATE INDEX idx_alerts_severity ON alerts (severity);
CREATE INDEX idx_rules_rule_type ON rules (rule_type);
CREATE INDEX idx_rules_severity ON rules (severity);
CREATE INDEX idx_rules_active ON rules (active);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);

