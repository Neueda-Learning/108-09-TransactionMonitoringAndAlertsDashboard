package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class VelocityRule implements Rule {

	private static final int DEFAULT_WINDOW_MINUTES = 10;
	private static final int DEFAULT_MAX_COUNT = 5;
	private static final String DEFAULT_RULE_NAME = "Velocity Rule";
	private static final String DEFAULT_SEVERITY = "HIGH";

	private final com.neueda.entity.Rule configuration;
	private final int effectiveWindowMinutes;
	private final int effectiveMaxCount;
	private final String effectiveRuleName;
	private final String effectiveSeverity;

	public VelocityRule(final com.neueda.entity.Rule configuration) {
		this.configuration = configuration;
		this.effectiveWindowMinutes = resolveWindowMinutes(configuration);
		this.effectiveMaxCount = resolveMaxCount(configuration);
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
					Map.of("windowMinutes", effectiveWindowMinutes, "maxCount", effectiveMaxCount)
			);
		}

		if (!isActive()) {
			return EvaluationResult.notTriggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Rule is inactive",
					Map.of("windowMinutes", effectiveWindowMinutes, "maxCount", effectiveMaxCount)
			);
		}

		if (transaction.getTransactionTime() == null) {
			return EvaluationResult.notTriggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Transaction time is missing",
					Map.of("windowMinutes", effectiveWindowMinutes, "maxCount", effectiveMaxCount)
			);
		}

		final LocalDateTime lowerBound = transaction.getTransactionTime().minusMinutes(effectiveWindowMinutes);
		int countInWindow = 1;
		if (accountHistory != null) {
			for (final Transaction historical : accountHistory) {
				if (historical == null || historical.getTransactionTime() == null) {
					continue;
				}
				if (transaction.getId() != null && transaction.getId().equals(historical.getId())) {
					continue;
				}
				if (hasText(transaction.getAccountId()) && !transaction.getAccountId().equals(historical.getAccountId())) {
					continue;
				}

				final LocalDateTime historicalTime = historical.getTransactionTime();
				final boolean insideWindow = !historicalTime.isBefore(lowerBound)
						&& !historicalTime.isAfter(transaction.getTransactionTime());
				if (insideWindow) {
					countInWindow++;
				}
			}
		}

		final Map<String, Object> metadata = new HashMap<>();
		metadata.put("windowMinutes", effectiveWindowMinutes);
		metadata.put("maxCount", effectiveMaxCount);
		metadata.put("countInWindow", countInWindow);
		metadata.put("windowStart", lowerBound);
		metadata.put("windowEnd", transaction.getTransactionTime());

		if (countInWindow > effectiveMaxCount) {
			return EvaluationResult.triggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					String.format("Transaction velocity %d exceeds max count %d", countInWindow, effectiveMaxCount),
					metadata
			);
		}

		return EvaluationResult.notTriggered(
				getRuleId(),
				transaction.getId(),
				effectiveRuleName,
				effectiveSeverity,
				"Transaction velocity is within allowed window",
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

	private static int resolveWindowMinutes(final com.neueda.entity.Rule configuration) {
		return configuration != null
				&& configuration.getTimeWindowMinutes() != null
				&& configuration.getTimeWindowMinutes() > 0
				? configuration.getTimeWindowMinutes()
				: DEFAULT_WINDOW_MINUTES;
	}

	private static int resolveMaxCount(final com.neueda.entity.Rule configuration) {
		if (configuration != null && configuration.getThreshold() != null && configuration.getThreshold() >= 1d) {
			return (int) Math.floor(configuration.getThreshold());
		}
		return DEFAULT_MAX_COUNT;
	}

	private static boolean hasText(final String value) {
		return value != null && !value.trim().isEmpty();
	}
}
