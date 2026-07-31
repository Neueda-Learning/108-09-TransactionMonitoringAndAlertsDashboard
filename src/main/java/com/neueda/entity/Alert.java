package com.neueda.entity;

import java.time.LocalDateTime;

public record Alert(
        Long id,
        String alertId,
        Long transactionId,
        Long ruleId,
        String severity,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

