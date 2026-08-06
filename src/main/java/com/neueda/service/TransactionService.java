package com.neueda.service;

import com.neueda.dto.AlertRequest;
import com.neueda.entity.Rule;
import com.neueda.entity.Transaction;
import com.neueda.repository.AlertRepository;
import com.neueda.repository.RuleRepository;
import com.neueda.repository.TransactionRepository;
import com.neueda.ruleengine.RuleEngine;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class TransactionService {

    private static final long DEFAULT_SDN_RULE_ID = -1L;
    private static final String DEFAULT_SDN_RULE_NAME = "Built-in SDN Screening Rule";
    private static final String DEFAULT_SDN_RULE_TYPE = "SDN_SCREENING";
    private static final String DEFAULT_SDN_SEVERITY = "HIGH";

    private final TransactionRepository repository;
    private final RuleRepository ruleRepository;
    private final AlertService alertService;
    private final AlertRepository alertRepository;
    private final SdnScreeningService sdnScreeningService;

    public TransactionService(TransactionRepository repository,
                              RuleRepository ruleRepository,
                              AlertService alertService,
                              AlertRepository alertRepository,
                              SdnScreeningService sdnScreeningService) {
        this.repository = repository;
        this.ruleRepository = ruleRepository;
        this.alertService = alertService;
        this.alertRepository = alertRepository;
        this.sdnScreeningService = sdnScreeningService;
    }

    // Get all transactions
    public List<Transaction> getAllTransactions() {
        return repository.findAll();
    }

    // Get transaction by Transaction ID
    public Transaction getTransactionById(String transactionId) {
        return repository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    // Add new transaction
    public Transaction addTransaction(Transaction transaction) {
        Transaction savedTransaction = repository.save(transaction);

        List<Rule> activeRules = ensureBuiltInSdnRule(ruleRepository.findByActiveTrue());
        if (activeRules.isEmpty()) {
            return savedTransaction;
        }

        RuleEngine ruleEngine = new RuleEngine(activeRules, sdnScreeningService);
        List<Transaction> accountHistory = repository.findByAccountId(savedTransaction.getAccountId());
        List<com.neueda.ruleengine.Rule.EvaluationResult> triggeredResults =
                ruleEngine.evaluateTriggered(savedTransaction, accountHistory);

        for (com.neueda.ruleengine.Rule.EvaluationResult result : triggeredResults) {
            AlertRequest alertRequest = new AlertRequest();
            alertRequest.setTransactionId(savedTransaction.getId());
            alertRequest.setRuleId(result.ruleId());
            alertRequest.setSeverity(result.severity());
            alertService.createAlert(alertRequest);
        }

        return savedTransaction;
    }

    private List<Rule> ensureBuiltInSdnRule(final List<Rule> activeRules) {
        final List<Rule> resolvedRules = new ArrayList<>();
        if (activeRules != null) {
            resolvedRules.addAll(activeRules);
        }

        boolean hasSdnRule = false;
        for (Rule rule : resolvedRules) {
            if (rule != null && isSdnRuleType(rule.getRuleType())) {
                hasSdnRule = true;
                break;
            }
        }

        if (!hasSdnRule) {
            Rule builtInSdnRule = new Rule();
            builtInSdnRule.setId(DEFAULT_SDN_RULE_ID);
            builtInSdnRule.setRuleName(DEFAULT_SDN_RULE_NAME);
            builtInSdnRule.setRuleType(DEFAULT_SDN_RULE_TYPE);
            builtInSdnRule.setSeverity(DEFAULT_SDN_SEVERITY);
            builtInSdnRule.setThreshold(1.0d);
            builtInSdnRule.setActive(true);
            resolvedRules.add(builtInSdnRule);
        }

        return resolvedRules;
    }

    private boolean isSdnRuleType(final String ruleType) {
        if (ruleType == null || ruleType.trim().isEmpty()) {
            return false;
        }
        final String normalized = ruleType.trim().toUpperCase(Locale.ROOT);
        return normalized.equals(DEFAULT_SDN_RULE_TYPE)
                || normalized.equals("SDN")
                || normalized.equals("SDN_RULE")
                || normalized.equals("SANCTIONS");
    }

    // Update transaction
    public Transaction updateTransaction(String transactionId, Transaction updatedTransaction) {

        Transaction existingTransaction = repository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        existingTransaction.setAccountId(updatedTransaction.getAccountId());
        existingTransaction.setPayeeId(updatedTransaction.getPayeeId());
        existingTransaction.setPayeeName(updatedTransaction.getPayeeName());
        existingTransaction.setAmount(updatedTransaction.getAmount());
        existingTransaction.setCurrency(updatedTransaction.getCurrency());
        existingTransaction.setTransactionType(updatedTransaction.getTransactionType());
        existingTransaction.setTransactionTime(updatedTransaction.getTransactionTime());
        existingTransaction.setDescription(updatedTransaction.getDescription());
        existingTransaction.setStatus(updatedTransaction.getStatus());

        return repository.save(existingTransaction);
    }

    // Delete transaction
    public void deleteTransaction(String transactionId) {

        Transaction transaction = repository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // Delete all alerts linked to this transaction first to avoid FK constraint violation
        alertRepository.deleteAll(alertRepository.findByTransactionId(transaction.getId()));

        repository.delete(transaction);
    }

}