package com.neueda.entity;

import java.time.LocalDateTime;

public record Transaction(

        Long id,

        String transactionId,

        String accountId,

        String payeeId,

        Double amount,

        String currency,

        String transactionType,

        LocalDateTime transactionTime,

        String description,

        String status

) {}
