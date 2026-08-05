package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import com.neueda.service.SdnScreeningService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SdnPayeeRule implements Rule {

    private static final String DEFAULT_RULE_NAME = "SDN Screening Rule";
    private static final String DEFAULT_SEVERITY = "HIGH";

    private final com.neueda.entity.Rule configuration;
    private final SdnScreeningService screeningService;
    private final String effectiveRuleName;
    private final String effectiveSeverity;

    public SdnPayeeRule(final com.neueda.entity.Rule configuration, final SdnScreeningService screeningService) {
        this.configuration = configuration;
        this.screeningService = screeningService;
        this.effectiveRuleName = resolveRuleName(configuration);
        this.effectiveSeverity = resolveSeverity(configuration);
    }

    @Override
    public EvaluationResult evaluate(final Transaction transaction, final List<Transaction> accountHistory) {
        if (transaction == null) {
            return EvaluationResult.notTriggered(
                    getRuleId(),
                    null,
                    effectiveRuleName,
                    effectiveSeverity,
                    "Transaction is null",
                    Map.of()
            );
        }

        if (!isActive()) {
            return EvaluationResult.notTriggered(
                    getRuleId(),
                    transaction.getId(),
                    effectiveRuleName,
                    effectiveSeverity,
                    "Rule is inactive",
                    Map.of()
            );
        }

        final String payeeName = resolvePayeeName(transaction);
        if (!hasText(payeeName)) {
            final Map<String, Object> missingPayeeMetadata = new HashMap<>();
            missingPayeeMetadata.put("payeeName", null);
            return EvaluationResult.notTriggered(
                    getRuleId(),
                    transaction.getId(),
                    effectiveRuleName,
                    effectiveSeverity,
                    "Payee name is missing",
                    missingPayeeMetadata
            );
        }

        final SdnScreeningService.ScreeningResult screeningResult = screeningService
                .screenPayee(payeeName, configuration == null ? null : configuration.getThreshold());

        final Map<String, Object> metadata = new HashMap<>();
        metadata.put("payeeName", payeeName);
        metadata.put("screeningAvailable", screeningResult.available());
        metadata.put("screeningSource", screeningResult.source());
        metadata.put("screeningReason", screeningResult.reason());
        metadata.put("matchedName", screeningResult.matchedName());
        metadata.put("confidence", screeningResult.confidence());

        if (screeningResult.matched()) {
            return EvaluationResult.triggered(
                    getRuleId(),
                    transaction.getId(),
                    effectiveRuleName,
                    effectiveSeverity,
                    "Potential SDN match for payee '" + payeeName + "'",
                    metadata
            );
        }

        return EvaluationResult.notTriggered(
                getRuleId(),
                transaction.getId(),
                effectiveRuleName,
                effectiveSeverity,
                screeningResult.reason(),
                metadata
        );
    }

    @Override
    public String getRuleName() {
        return effectiveRuleName;
    }

    @Override
    public String getSeverity() {
        return effectiveSeverity;
    }

    @Override
    public Long getRuleId() {
        return configuration == null ? null : configuration.getId();
    }

    @Override
    public boolean isActive() {
        return configuration == null || configuration.getActive() == null || configuration.getActive();
    }

    private static String resolveRuleName(final com.neueda.entity.Rule configuration) {
        return configuration != null && hasText(configuration.getRuleName())
                ? configuration.getRuleName().trim()
                : DEFAULT_RULE_NAME;
    }

    private static String resolveSeverity(final com.neueda.entity.Rule configuration) {
        return configuration != null && hasText(configuration.getSeverity())
                ? configuration.getSeverity().trim()
                : DEFAULT_SEVERITY;
    }

    private static String resolvePayeeName(final Transaction transaction) {
        if (transaction == null) {
            return null;
        }
        if (hasText(transaction.getPayeeName())) {
            return transaction.getPayeeName().trim();
        }
        if (hasText(transaction.getPayeeId())) {
            return transaction.getPayeeId().trim();
        }
        return null;
    }

    private static boolean hasText(final String value) {
        return value != null && !value.trim().isEmpty();
    }
}

