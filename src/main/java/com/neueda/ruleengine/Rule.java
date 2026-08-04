package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public interface Rule {

    EvaluationResult evaluate(Transaction transaction, List<Transaction> accountHistory);

    default EvaluationResult evaluate(Transaction transaction) {
        return evaluate(transaction, Collections.emptyList());
    }

    String getRuleName();

    String getSeverity();

    Long getRuleId();

    boolean isActive();

    record EvaluationResult(
            boolean triggered,
            Long ruleId,
            Long transactionId,
            String ruleName,
            String severity,
            String reason,
            Map<String, Object> metadata
    ) {
        public static EvaluationResult triggered(
                final Long ruleId,
                final Long transactionId,
                final String ruleName,
                final String severity,
                final String reason,
                final Map<String, Object> metadata
        ) {
            return new EvaluationResult(true, ruleId, transactionId, ruleName, severity, reason, metadata);
        }

        public static EvaluationResult notTriggered(
                final Long ruleId,
                final Long transactionId,
                final String ruleName,
                final String severity,
                final String reason,
                final Map<String, Object> metadata
        ) {
            return new EvaluationResult(false, ruleId, transactionId, ruleName, severity, reason, metadata);
        }
    }
}