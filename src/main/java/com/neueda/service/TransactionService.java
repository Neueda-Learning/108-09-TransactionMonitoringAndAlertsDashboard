package com.neueda.service;

import com.neueda.dto.AlertRequest;
import com.neueda.entity.Rule;
import com.neueda.entity.Transaction;
import com.neueda.repository.AlertRepository;
import com.neueda.repository.RuleRepository;
import com.neueda.repository.TransactionRepository;
import com.neueda.ruleengine.RuleEngine;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class TransactionService {

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
        if (!hasText(transactionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction ID is required");
        }

        return repository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));
    }

    // Add new transaction
    public Transaction addTransaction(Transaction transaction) {
        validateTransactionForCreate(transaction);

        final String transactionId = transaction.getTransactionId().trim();
        if (repository.findByTransactionId(transactionId).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Transaction ID already exists: " + transactionId
            );
        }

        transaction.setTransactionId(transactionId);

        final Transaction savedTransaction;
        try {
            savedTransaction = repository.save(transaction);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid transaction data. Ensure required fields are provided and transactionId is unique.",
                    exception
            );
        }

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
            Rule builtInSdnRule = findPersistedSdnRule();
            if (builtInSdnRule == null) {
                builtInSdnRule = new Rule();
            }

            builtInSdnRule.setRuleName(DEFAULT_SDN_RULE_NAME);
            builtInSdnRule.setRuleType(DEFAULT_SDN_RULE_TYPE);
            builtInSdnRule.setSeverity(DEFAULT_SDN_SEVERITY);
            builtInSdnRule.setThreshold(1.0d);
            builtInSdnRule.setActive(true);

            Rule persistedRule = ruleRepository.save(builtInSdnRule);
            resolvedRules.add(persistedRule);
        }

        return resolvedRules;
    }

    private Rule findPersistedSdnRule() {
        List<Rule> allRules = ruleRepository.findAll();
        for (Rule rule : allRules) {
            if (rule != null && rule.getId() != null && isSdnRuleType(rule.getRuleType())) {
                return rule;
            }
        }
        return null;
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
        if (!hasText(transactionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction ID is required");
        }

        Transaction existingTransaction = repository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

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
        if (!hasText(transactionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction ID is required");
        }

        Transaction transaction = repository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        // Delete all alerts linked to this transaction first to avoid FK constraint violation
        alertRepository.deleteAll(alertRepository.findByTransactionId(transaction.getId()));

        repository.delete(transaction);
    }

    private void validateTransactionForCreate(final Transaction transaction) {
        if (transaction == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction payload is required");
        }

        if (!hasText(transaction.getTransactionId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction ID is required");
        }

        if (!hasText(transaction.getAccountId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account ID is required");
        }

        if (!hasText(transaction.getPayeeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payee ID is required");
        }

        if (!hasText(transaction.getCurrency())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Currency is required");
        }

        if (!hasText(transaction.getTransactionType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction type is required");
        }

        if (!hasText(transaction.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }

        if (transaction.getAmount() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount is required");
        }

        if (transaction.getTransactionTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction time is required");
        }
    }

    private boolean hasText(final String value) {
        return value != null && !value.trim().isEmpty();
    }

}