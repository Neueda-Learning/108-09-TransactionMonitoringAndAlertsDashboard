package com.neueda.controller;

import com.neueda.entity.Transaction;
import com.neueda.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionService service;

    // Get all transactions
    @GetMapping
    public List<Transaction> getAllTransactions() {
        return service.getAllTransactions();
    }

    // Get transaction by transactionId
    @GetMapping("/{transactionId}")
    public Transaction getTransaction(@PathVariable String transactionId) {
        return service.getTransactionById(transactionId);
    }

    // Add transaction
    @PostMapping("/add")
    public Transaction addTransaction(@RequestBody Transaction transaction) {
        System.out.println("Adding transaction: ");
        return service.addTransaction(transaction);
    }

    // Update transaction
    @PutMapping("/{transactionId}")
    public Transaction updateTransaction(
            @PathVariable String transactionId,
            @RequestBody Transaction transaction) {

        return service.updateTransaction(transactionId, transaction);
    }

    // Delete transaction
    @DeleteMapping("/{transactionId}")
    public String deleteTransaction(@PathVariable String transactionId) {

        service.deleteTransaction(transactionId);

        return "Transaction deleted successfully";
    }
}