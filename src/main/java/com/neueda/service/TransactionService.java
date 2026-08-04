package com.neueda.service;

import com.neueda.dto.AlertRequest;
import com.neueda.entity.Rule;
import com.neueda.entity.Transaction;
import com.neueda.repository.RuleRepository;
import com.neueda.repository.TransactionRepository;
import com.neueda.ruleengine.RuleEngine;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository repository;
    private final RuleRepository ruleRepository;
    private final AlertService alertService;

    public TransactionService(TransactionRepository repository,
                              RuleRepository ruleRepository,
                              AlertService alertService) {
        this.repository = repository;
        this.ruleRepository = ruleRepository;
        this.alertService = alertService;
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

        List<Rule> activeRules = ruleRepository.findByActiveTrue();
        if (activeRules.isEmpty()) {
            return savedTransaction;
        }

        RuleEngine ruleEngine = new RuleEngine(activeRules);
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

    // Update transaction
    public Transaction updateTransaction(String transactionId, Transaction updatedTransaction) {

        Transaction existingTransaction = repository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        existingTransaction.setAccountId(updatedTransaction.getAccountId());
        existingTransaction.setPayeeId(updatedTransaction.getPayeeId());
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

        repository.delete(transaction);
    }

}