package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DailyLimitRule implements Rule {

	private static final BigDecimal DEFAULT_DAILY_LIMIT = BigDecimal.valueOf(50_000d);
	private static final String DEFAULT_RULE_NAME = "Daily Limit Rule";
	private static final String DEFAULT_SEVERITY = "HIGH";

	private final com.neueda.entity.Rule configuration;
	private final BigDecimal effectiveLimit;
	private final String effectiveRuleName;
	private final String effectiveSeverity;

	public DailyLimitRule(final com.neueda.entity.Rule configuration) {
		this.configuration = configuration;
		this.effectiveLimit = resolveLimit(configuration);
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
					Map.of("dailyLimit", effectiveLimit)
			);
		}

		if (!isActive()) {
			return EvaluationResult.notTriggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Rule is inactive",
					Map.of("dailyLimit", effectiveLimit)
			);
		}

		if (transaction.getAmount() == null || transaction.getTransactionTime() == null) {
			return EvaluationResult.notTriggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Transaction amount/time is missing",
					Map.of("dailyLimit", effectiveLimit)
			);
		}

		final LocalDate txDate = transaction.getTransactionTime().toLocalDate();
		final BigDecimal todayHistoricalAmount = sumHistoricalAmountForDate(accountHistory, transaction, txDate);
		final BigDecimal currentAmount = BigDecimal.valueOf(transaction.getAmount());
		final BigDecimal projectedDailyTotal = todayHistoricalAmount.add(currentAmount);

		final Map<String, Object> metadata = new HashMap<>();
		metadata.put("dailyLimit", effectiveLimit);
		metadata.put("historicalDailyAmount", todayHistoricalAmount);
		metadata.put("currentAmount", currentAmount);
		metadata.put("projectedDailyTotal", projectedDailyTotal);

		if (projectedDailyTotal.compareTo(effectiveLimit) > 0) {
			return EvaluationResult.triggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					String.format("Projected daily total %s exceeds daily limit %s", projectedDailyTotal, effectiveLimit),
					metadata
			);
		}

		return EvaluationResult.notTriggered(
				getRuleId(),
				transaction.getId(),
				effectiveRuleName,
				effectiveSeverity,
				"Projected daily total does not exceed daily limit",
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

	private static BigDecimal sumHistoricalAmountForDate(
			final List<Transaction> accountHistory,
			final Transaction currentTransaction,
			final LocalDate txDate
	) {
		if (accountHistory == null || accountHistory.isEmpty()) {
			return BigDecimal.ZERO;
		}

		final String accountId = currentTransaction.getAccountId();
		BigDecimal total = BigDecimal.ZERO;
		for (final Transaction historical : accountHistory) {
			if (historical == null || historical.getAmount() == null || historical.getTransactionTime() == null) {
				continue;
			}
			if (currentTransaction.getId() != null && currentTransaction.getId().equals(historical.getId())) {
				continue;
			}
			if (accountId != null && !accountId.equals(historical.getAccountId())) {
				continue;
			}
			if (!txDate.equals(historical.getTransactionTime().toLocalDate())) {
				continue;
			}
			total = total.add(BigDecimal.valueOf(historical.getAmount()));
		}
		return total;
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

	private static BigDecimal resolveLimit(final com.neueda.entity.Rule configuration) {
		return configuration != null && configuration.getThreshold() != null && configuration.getThreshold() > 0d
				? BigDecimal.valueOf(configuration.getThreshold())
				: DEFAULT_DAILY_LIMIT;
	}

	private static boolean hasText(final String value) {
		return value != null && !value.trim().isEmpty();
	}
}
