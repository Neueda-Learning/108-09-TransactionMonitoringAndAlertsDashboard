package com.neueda.entity;

public record Rule(
        Long id,
        String ruleName,
        String ruleType,
        Double threshold,
        Integer timeWindowMinutes,
        String severity,
        Boolean active
) {
}
