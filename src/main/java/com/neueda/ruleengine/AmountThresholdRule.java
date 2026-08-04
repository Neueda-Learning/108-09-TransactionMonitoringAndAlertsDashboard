package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AmountThresholdRule implements Rule {

	private static final Logger LOGGER = LoggerFactory.getLogger(AmountThresholdRule.class);

	private static final BigDecimal TEMPORARY_DEFAULT_THRESHOLD = BigDecimal.valueOf(10_000d);

	private static final String DEFAULT_RULE_NAME = "Amount Threshold Rule";
	private static final String DEFAULT_SEVERITY = "MEDIUM";

	private final com.neueda.entity.Rule configuration;
	private final BigDecimal effectiveThreshold;
	private final String effectiveRuleName;
	private final String effectiveSeverity;

	public AmountThresholdRule(final com.neueda.entity.Rule configuration) {
		this.configuration = configuration;
		this.effectiveThreshold = resolveThreshold(configuration);
		this.effectiveRuleName = resolveRuleName(configuration);
		this.effectiveSeverity = resolveSeverity(configuration);
	}

	@Override
	public EvaluationResult evaluate(final Transaction transaction, final List<Transaction> accountHistory) {
		if (transaction == null) {
			LOGGER.warn("Amount threshold evaluation skipped because transaction is null");
			return EvaluationResult.notTriggered(
					ruleId(),
					null,
					effectiveRuleName,
					effectiveSeverity,
					"Transaction is null",
					Map.of("threshold", effectiveThreshold)
			);
		}

		if (!isActive()) {
			LOGGER.debug("Amount threshold rule '{}' is inactive; transaction '{}' will not be evaluated", effectiveRuleName, transaction.getTransactionId());
			return EvaluationResult.notTriggered(
					ruleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Rule is inactive",
					Map.of("threshold", effectiveThreshold)
			);
		}

		final Double amount = transaction.getAmount();
		if (amount == null) {
			LOGGER.warn("Amount threshold evaluation skipped for transaction '{}' because amount is null", transaction.getTransactionId());
			return EvaluationResult.notTriggered(
					ruleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Transaction amount is null",
					Map.of("threshold", effectiveThreshold)
			);
		}

		final BigDecimal transactionAmount = BigDecimal.valueOf(amount);
		final boolean triggered = transactionAmount.compareTo(effectiveThreshold) > 0;
		final Map<String, Object> metadata = new HashMap<>();
		metadata.put("transactionAmount", transactionAmount);
		metadata.put("threshold", effectiveThreshold);
		if (triggered) {
			final String reason = String.format(
					"Transaction amount %s exceeds threshold %s",
					transactionAmount,
					effectiveThreshold
			);
			LOGGER.info("Amount threshold rule triggered for transaction '{}' with amount {}", transaction.getTransactionId(), transactionAmount);
			return EvaluationResult.triggered(
					ruleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					reason,
					metadata
			);
		}

		LOGGER.debug("Amount threshold rule not triggered for transaction '{}' (amount={}, threshold={})", transaction.getTransactionId(), transactionAmount, effectiveThreshold);
		return EvaluationResult.notTriggered(
				ruleId(),
				transaction.getId(),
				effectiveRuleName,
				effectiveSeverity,
				"Transaction amount does not exceed threshold",
				metadata
		);
	}

	public boolean isTriggeredBy(final Transaction transaction) {
		return evaluate(transaction).triggered();
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
		return ruleId();
	}

	@Override
	public boolean isActive() {
		return configuration == null || configuration.getActive() == null || configuration.getActive();
	}

	private Long ruleId() {
		return configuration == null ? null : configuration.getId();
	}

	private static String resolveRuleName(final com.neueda.entity.Rule configuration) {
		if (configuration != null && hasText(configuration.getRuleName())) {
			return configuration.getRuleName().trim();
		}
		LOGGER.debug("Using default rule name because configuration ruleName is missing");
		return DEFAULT_RULE_NAME;
	}

	private static String resolveSeverity(final com.neueda.entity.Rule configuration) {
		if (configuration != null && hasText(configuration.getSeverity())) {
			return configuration.getSeverity().trim();
		}
		LOGGER.debug("Using default severity because configuration severity is missing");
		return DEFAULT_SEVERITY;
	}

	private static BigDecimal resolveThreshold(final com.neueda.entity.Rule configuration) {
		if (configuration != null && configuration.getThreshold() != null && configuration.getThreshold() > 0d) {
			return BigDecimal.valueOf(configuration.getThreshold());
		}
		LOGGER.warn("Using temporary default threshold {} because configuration threshold is missing or invalid", TEMPORARY_DEFAULT_THRESHOLD);
		return TEMPORARY_DEFAULT_THRESHOLD;
	}

	private static boolean hasText(final String value) {
		return value != null && !value.trim().isEmpty();
	}

}
