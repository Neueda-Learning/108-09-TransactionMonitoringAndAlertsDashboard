package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NewPayeeRule implements Rule {

	private static final BigDecimal DEFAULT_MIN_ALERT_AMOUNT = BigDecimal.valueOf(5_000d);
	private static final String DEFAULT_RULE_NAME = "New Payee Rule";
	private static final String DEFAULT_SEVERITY = "MEDIUM";

	private final com.neueda.entity.Rule configuration;
	private final BigDecimal effectiveMinimumAmount;
	private final String effectiveRuleName;
	private final String effectiveSeverity;

	public NewPayeeRule(final com.neueda.entity.Rule configuration) {
		this.configuration = configuration;
		this.effectiveMinimumAmount = resolveMinimumAmount(configuration);
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
					Map.of("minimumAlertAmount", effectiveMinimumAmount)
			);
		}

		if (!isActive()) {
			return EvaluationResult.notTriggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Rule is inactive",
					Map.of("minimumAlertAmount", effectiveMinimumAmount)
			);
		}

		if (transaction.getAmount() == null || !hasText(transaction.getPayeeId())) {
			return EvaluationResult.notTriggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Transaction amount/payee is missing",
					Map.of("minimumAlertAmount", effectiveMinimumAmount)
			);
		}

		final BigDecimal amount = BigDecimal.valueOf(transaction.getAmount());
		if (amount.compareTo(effectiveMinimumAmount) < 0) {
			return EvaluationResult.notTriggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"Transaction amount is below minimum alert amount",
					Map.of("minimumAlertAmount", effectiveMinimumAmount, "currentAmount", amount)
			);
		}

		final boolean existingPayee = hasPayeeInHistory(transaction, accountHistory);
		final Map<String, Object> metadata = new HashMap<>();
		metadata.put("minimumAlertAmount", effectiveMinimumAmount);
		metadata.put("currentAmount", amount);
		metadata.put("payeeId", transaction.getPayeeId());
		metadata.put("isFirstPayeePayment", !existingPayee);

		if (!existingPayee) {
			return EvaluationResult.triggered(
					getRuleId(),
					transaction.getId(),
					effectiveRuleName,
					effectiveSeverity,
					"First payment to this payee meets alert amount threshold",
					metadata
			);
		}

		return EvaluationResult.notTriggered(
				getRuleId(),
				transaction.getId(),
				effectiveRuleName,
				effectiveSeverity,
				"Payee already exists in account history",
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

	private static boolean hasPayeeInHistory(final Transaction transaction, final List<Transaction> accountHistory) {
		if (accountHistory == null || accountHistory.isEmpty()) {
			return false;
		}
		for (final Transaction historical : accountHistory) {
			if (historical == null || !hasText(historical.getPayeeId())) {
				continue;
			}
			if (transaction.getId() != null && transaction.getId().equals(historical.getId())) {
				continue;
			}
			if (hasText(transaction.getAccountId()) && !transaction.getAccountId().equals(historical.getAccountId())) {
				continue;
			}
			if (transaction.getPayeeId().equals(historical.getPayeeId())) {
				return true;
			}
		}
		return false;
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

	private static BigDecimal resolveMinimumAmount(final com.neueda.entity.Rule configuration) {
		return configuration != null && configuration.getThreshold() != null && configuration.getThreshold() >= 0d
				? BigDecimal.valueOf(configuration.getThreshold())
				: DEFAULT_MIN_ALERT_AMOUNT;
	}

	private static boolean hasText(final String value) {
		return value != null && !value.trim().isEmpty();
	}
}
