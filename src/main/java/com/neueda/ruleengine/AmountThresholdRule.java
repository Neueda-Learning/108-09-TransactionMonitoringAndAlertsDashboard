package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Fraud detection rule that flags transactions whose amount exceeds a configured threshold.
 *
 * <p>Design notes:
 * <ul>
 *     <li>Primary configuration source is {@code com.neueda.entity.Rule.threshold} to avoid hardcoded business values.</li>
 *     <li>A temporary fallback threshold is used only when configuration is missing/invalid.</li>
 *     <li>Evaluation returns structured metadata so downstream orchestration can build alerts consistently.</li>
 * </ul>
 */
public class AmountThresholdRule {

	private static final Logger LOGGER = LoggerFactory.getLogger(AmountThresholdRule.class);

	/**
	 * Temporary fallback threshold until central rule configuration management is wired end-to-end.
	 */
	private static final BigDecimal TEMPORARY_DEFAULT_THRESHOLD = BigDecimal.valueOf(10_000d);

	private static final String DEFAULT_RULE_NAME = "Amount Threshold Rule";
	private static final String DEFAULT_SEVERITY = "MEDIUM";

	private final com.neueda.entity.Rule ruleConfiguration;
	private final BigDecimal effectiveThreshold;
	private final String effectiveRuleName;
	private final String effectiveSeverity;

	/**
	 * Creates an amount-threshold rule from an existing persisted rule configuration.
	 *
	 * <p>If any configuration value is missing, sensible defaults are used so evaluation remains safe and deterministic.
	 *
	 * @param ruleConfiguration persisted rule definition; may be {@code null} when configuration is unavailable
	 */
	public AmountThresholdRule(final com.neueda.entity.Rule ruleConfiguration) {
		this.ruleConfiguration = ruleConfiguration;
		this.effectiveThreshold = resolveThreshold(ruleConfiguration);
		this.effectiveRuleName = resolveRuleName(ruleConfiguration);
		this.effectiveSeverity = resolveSeverity(ruleConfiguration);
	}

	/**
	 * Evaluates a transaction against the configured amount threshold.
	 *
	 * @param transaction transaction candidate for fraud checks; may be {@code null}
	 * @return a rich evaluation result containing trigger state and alert context details
	 */
	public EvaluationResult evaluate(final Transaction transaction) {
		// A null transaction cannot be evaluated safely, so return a traceable non-trigger result.
		if (transaction == null) {
			LOGGER.warn("Amount threshold evaluation skipped because transaction is null");
			return EvaluationResult.notTriggered(
					ruleId(),
					null,
					effectiveRuleName,
					effectiveSeverity,
					effectiveThreshold,
					"Transaction is null"
			);
		}

		// Inactive rules are intentionally skipped to respect operational toggles from configuration.
		if (!isRuleActive()) {
			LOGGER.debug("Amount threshold rule '{}' is inactive; transaction '{}' will not be evaluated", effectiveRuleName, transaction.transactionId());
			return EvaluationResult.notTriggered(
					ruleId(),
					transaction.id(),
					effectiveRuleName,
					effectiveSeverity,
					effectiveThreshold,
					"Rule is inactive"
			);
		}

		// Missing amount is treated as non-trigger to prevent false positives from incomplete payloads.
		final Double amount = transaction.amount();
		if (amount == null) {
			LOGGER.warn("Amount threshold evaluation skipped for transaction '{}' because amount is null", transaction.transactionId());
			return EvaluationResult.notTriggered(
					ruleId(),
					transaction.id(),
					effectiveRuleName,
					effectiveSeverity,
					effectiveThreshold,
					"Transaction amount is null"
			);
		}

		// BigDecimal is used for financial comparisons to avoid floating-point precision issues.
		final BigDecimal transactionAmount = BigDecimal.valueOf(amount);
		final boolean triggered = transactionAmount.compareTo(effectiveThreshold) > 0;
		if (triggered) {
			final String reason = String.format(
					"Transaction amount %s exceeds threshold %s",
					transactionAmount,
					effectiveThreshold
			);
			LOGGER.info("Amount threshold rule triggered for transaction '{}' with amount {}", transaction.transactionId(), transactionAmount);
			return EvaluationResult.triggered(
					ruleId(),
					transaction.id(),
					effectiveRuleName,
					effectiveSeverity,
					transactionAmount,
					effectiveThreshold,
					reason,
					buildAlertContext(transaction.id(), reason)
			);
		}

		LOGGER.debug("Amount threshold rule not triggered for transaction '{}' (amount={}, threshold={})", transaction.transactionId(), transactionAmount, effectiveThreshold);
		return EvaluationResult.notTriggered(
				ruleId(),
				transaction.id(),
				effectiveRuleName,
				effectiveSeverity,
				effectiveThreshold,
				"Transaction amount does not exceed threshold"
		);
	}

	/**
	 * Convenience method when only the trigger flag is needed.
	 *
	 * @param transaction transaction candidate for fraud checks
	 * @return {@code true} when the transaction exceeds threshold and rule is active
	 */
	public boolean isTriggeredBy(final Transaction transaction) {
		return evaluate(transaction).triggered();
	}

	/**
	 * @return human-readable rule name from configuration or default fallback
	 */
	public String getRuleName() {
		return effectiveRuleName;
	}

	/**
	 * @return severity used for generated alert context
	 */
	public String getSeverity() {
		return effectiveSeverity;
	}

	private AlertContext buildAlertContext(final Long transactionId, final String reason) {
		return new AlertContext(
				transactionId,
				ruleId(),
				effectiveRuleName,
				effectiveSeverity,
				reason,
				LocalDateTime.now()
		);
	}

	private Long ruleId() {
		return ruleConfiguration == null ? null : ruleConfiguration.id();
	}

	private boolean isRuleActive() {
		// Null is treated as active so partially populated configurations still execute instead of silently bypassing fraud checks.
		return ruleConfiguration == null || ruleConfiguration.active() == null || ruleConfiguration.active();
	}

	private static String resolveRuleName(final com.neueda.entity.Rule ruleConfiguration) {
		if (ruleConfiguration != null && hasText(ruleConfiguration.ruleName())) {
			return ruleConfiguration.ruleName().trim();
		}
		LOGGER.debug("Using default rule name because configuration ruleName is missing");
		return DEFAULT_RULE_NAME;
	}

	private static String resolveSeverity(final com.neueda.entity.Rule ruleConfiguration) {
		if (ruleConfiguration != null && hasText(ruleConfiguration.severity())) {
			return ruleConfiguration.severity().trim();
		}
		LOGGER.debug("Using default severity because configuration severity is missing");
		return DEFAULT_SEVERITY;
	}

	private static BigDecimal resolveThreshold(final com.neueda.entity.Rule ruleConfiguration) {
		if (ruleConfiguration != null && ruleConfiguration.threshold() != null && ruleConfiguration.threshold() > 0d) {
			return BigDecimal.valueOf(ruleConfiguration.threshold());
		}
		LOGGER.warn("Using temporary default threshold {} because configuration threshold is missing or invalid", TEMPORARY_DEFAULT_THRESHOLD);
		return TEMPORARY_DEFAULT_THRESHOLD;
	}

	private static boolean hasText(final String value) {
		return value != null && !value.trim().isEmpty();
	}

	/**
	 * Structured result of threshold evaluation to support RuleEngine orchestration and alert generation.
	 *
	 * @param triggered whether the rule fired for the transaction
	 * @param ruleId configured rule identifier, if available
	 * @param transactionId evaluated transaction identifier, if available
	 * @param ruleName effective rule name used in evaluation
	 * @param severity effective severity used in evaluation
	 * @param transactionAmount evaluated amount when available
	 * @param threshold threshold used for the comparison
	 * @param reason human-readable explanation of the outcome
	 * @param alertContext payload that downstream components can use to create an alert; null when not triggered
	 */
	public record EvaluationResult(
			boolean triggered,
			Long ruleId,
			Long transactionId,
			String ruleName,
			String severity,
			BigDecimal transactionAmount,
			BigDecimal threshold,
			String reason,
			AlertContext alertContext
	) {
		private static EvaluationResult triggered(
				final Long ruleId,
				final Long transactionId,
				final String ruleName,
				final String severity,
				final BigDecimal transactionAmount,
				final BigDecimal threshold,
				final String reason,
				final AlertContext alertContext
		) {
			return new EvaluationResult(true, ruleId, transactionId, ruleName, severity, transactionAmount, threshold, reason, alertContext);
		}

		private static EvaluationResult notTriggered(
				final Long ruleId,
				final Long transactionId,
				final String ruleName,
				final String severity,
				final BigDecimal threshold,
				final String reason
		) {
			return new EvaluationResult(false, ruleId, transactionId, ruleName, severity, null, threshold, reason, null);
		}
	}

	/**
	 * Minimal alert payload produced by this rule when fraud is detected.
	 *
	 * @param transactionId related transaction identifier
	 * @param ruleId triggering rule identifier
	 * @param ruleName triggering rule name
	 * @param severity severity for alert prioritization
	 * @param reason explanation for analysts and audit
	 * @param evaluatedAt UTC-local evaluation timestamp
	 */
	public record AlertContext(
			Long transactionId,
			Long ruleId,
			String ruleName,
			String severity,
			String reason,
			LocalDateTime evaluatedAt
	) {
	}
}
