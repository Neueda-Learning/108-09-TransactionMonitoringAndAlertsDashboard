package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

public class RuleEngine {

	private final List<Rule> rules;

	public RuleEngine(final List<com.neueda.entity.Rule> configurations) {
		this.rules = buildRules(configurations);
	}

	public List<Rule.EvaluationResult> evaluateAll(
			final Transaction transaction,
			final List<Transaction> accountHistory
	) {
		final List<Rule.EvaluationResult> results = new ArrayList<>();
		for (final Rule rule : rules) {
			results.add(rule.evaluate(transaction, accountHistory));
		}
		return results;
	}

	public List<Rule.EvaluationResult> evaluateTriggered(
			final Transaction transaction,
			final List<Transaction> accountHistory
	) {
		final List<Rule.EvaluationResult> allResults = evaluateAll(transaction, accountHistory);
		final List<Rule.EvaluationResult> triggeredResults = new ArrayList<>();
		for (final Rule.EvaluationResult result : allResults) {
			if (result.triggered()) {
				triggeredResults.add(result);
			}
		}
		return triggeredResults;
	}

	public List<Rule> getRules() {
		return Collections.unmodifiableList(rules);
	}

	private static List<Rule> buildRules(final List<com.neueda.entity.Rule> configurations) {
		final List<Rule> resolvedRules = new ArrayList<>();
		if (configurations == null || configurations.isEmpty()) {
			return resolvedRules;
		}

		for (final com.neueda.entity.Rule configuration : configurations) {
			final Rule rule = createRule(configuration);
			if (rule != null) {
				resolvedRules.add(rule);
			}
		}

		return resolvedRules;
	}

	private static Rule createRule(final com.neueda.entity.Rule configuration) {
		if (configuration == null || configuration.getRuleType() == null) {
			return null;
		}

		final String normalizedRuleType = configuration.getRuleType().trim().toUpperCase(Locale.ROOT);
		return switch (normalizedRuleType) {
			case "AMOUNT_THRESHOLD", "AMOUNT_THRESHOLD_RULE", "AMOUNT" -> new AmountThresholdRule(configuration);
			case "DAILY_LIMIT", "DAILY_LIMIT_RULE", "DAILY" -> new DailyLimitRule(configuration);
			case "VELOCITY", "VELOCITY_RULE" -> new VelocityRule(configuration);
			case "NEW_PAYEE", "NEW_PAYEE_RULE" -> new NewPayeeRule(configuration);
			default -> null;
		};
	}
}
