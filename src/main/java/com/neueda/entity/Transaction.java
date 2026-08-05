package com.neueda.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false, unique = true)
    private String transactionId;

    @Column(name = "account_id", nullable =false)
    private String accountId;

    @Column(name = "payee_id", nullable = false)
    private String payeeId;

    @Column(name = "payee_name")
    private String payeeName;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String currency;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType;

    @Column(name = "transaction_time", nullable = false)
    private LocalDateTime transactionTime;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private String status;

    // Default Constructor
    public Transaction() {
    }

    // Parameterized Constructor
    public Transaction(Long id,
                       String transactionId,
                       String accountId,
                       String payeeId,
                       String payeeName,
                       Double amount,
                       String currency,
                       String transactionType,
                       LocalDateTime transactionTime,
                       String description,
                       String status) {

        this.id = id;
        this.transactionId = transactionId;
        this.accountId = accountId;
        this.payeeId = payeeId;
        this.payeeName = payeeName;
        this.amount = amount;
        this.currency = currency;
        this.transactionType = transactionType;
        this.transactionTime = transactionTime;
        this.description = description;
        this.status = status;
    }

    // Getters and Setters

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

    public String getPayeeName() {
        return payeeName;
    }

    public void setPayeeName(String payeeName) {
        this.payeeName = payeeName;
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
}