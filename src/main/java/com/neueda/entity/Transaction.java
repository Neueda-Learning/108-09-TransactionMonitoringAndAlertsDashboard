package com.neueda.entity;

import java.time.LocalDateTime;
import java.util.Objects;

public class Transaction {

    private Long id;
    private String transactionId;
    private String accountId;
    private String payeeId;
    private Double amount;
    private String currency;
    private String transactionType;
    private LocalDateTime transactionTime;
    private String description;
    private String status;

    public Transaction() {
    }

    public Transaction(Long id, String transactionId, String accountId, String payeeId, Double amount,
                       String currency, String transactionType, LocalDateTime transactionTime,
                       String description, String status) {
        this.id = id;
        this.transactionId = transactionId;
        this.accountId = accountId;
        this.payeeId = payeeId;
        this.amount = amount;
        this.currency = currency;
        this.transactionType = transactionType;
        this.transactionTime = transactionTime;
        this.description = description;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public String getPayeeId() {
        return payeeId;
    }

    public void setPayeeId(String payeeId) {
        this.payeeId = payeeId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public LocalDateTime getTransactionTime() {
        return transactionTime;
    }

    public void setTransactionTime(LocalDateTime transactionTime) {
        this.transactionTime = transactionTime;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Transaction that)) {
            return false;
        }
        return Objects.equals(id, that.id)
                && Objects.equals(transactionId, that.transactionId)
                && Objects.equals(accountId, that.accountId)
                && Objects.equals(payeeId, that.payeeId)
                && Objects.equals(amount, that.amount)
                && Objects.equals(currency, that.currency)
                && Objects.equals(transactionType, that.transactionType)
                && Objects.equals(transactionTime, that.transactionTime)
                && Objects.equals(description, that.description)
                && Objects.equals(status, that.status);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, transactionId, accountId, payeeId, amount, currency, transactionType,
                transactionTime, description, status);
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "id=" + id +
                ", transactionId='" + transactionId + '\'' +
                ", accountId='" + accountId + '\'' +
                ", payeeId='" + payeeId + '\'' +
                ", amount=" + amount +
                ", currency='" + currency + '\'' +
                ", transactionType='" + transactionType + '\'' +
                ", transactionTime=" + transactionTime +
                ", description='" + description + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}
