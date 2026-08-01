package com.neueda.service;

import com.neueda.entity.Transaction;
import com.neueda.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository repository;

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
        return repository.save(transaction);
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