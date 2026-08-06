package com.neueda.repository;

import com.neueda.entity.Transaction;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
@ActiveProfiles("test")
class TransactionRepositoryTest {

    @Autowired
    private TransactionRepository transactionRepository;

    @Test
    void findByTransactionIdReturnsMatchingTransaction() {
        Transaction stored = transactionRepository.save(buildTransaction("TXN-100", "ACC-1"));
        transactionRepository.save(buildTransaction("TXN-101", "ACC-1"));

        Transaction found = transactionRepository.findByTransactionId("TXN-100").orElseThrow();

        assertEquals(stored.getId(), found.getId());
        assertEquals("TXN-100", found.getTransactionId());
    }

    @Test
    void findByTransactionIdReturnsEmptyWhenNotFound() {
        transactionRepository.save(buildTransaction("TXN-200", "ACC-2"));

        boolean exists = transactionRepository.findByTransactionId("TXN-999").isPresent();

        assertFalse(exists);
    }

    @Test
    void findByAccountIdReturnsAllTransactionsForAccount() {
        Transaction first = transactionRepository.save(buildTransaction("TXN-300", "ACC-3"));
        Transaction second = transactionRepository.save(buildTransaction("TXN-301", "ACC-3"));
        transactionRepository.save(buildTransaction("TXN-302", "ACC-4"));

        List<Transaction> transactions = transactionRepository.findByAccountId("ACC-3");

        assertEquals(2, transactions.size());
        assertTrue(transactions.stream().anyMatch(t -> t.getId().equals(first.getId())));
        assertTrue(transactions.stream().anyMatch(t -> t.getId().equals(second.getId())));
    }

    @Test
    void findByAccountIdReturnsEmptyWhenNoMatch() {
        transactionRepository.save(buildTransaction("TXN-400", "ACC-5"));

        List<Transaction> transactions = transactionRepository.findByAccountId("ACC-NOT-FOUND");

        assertTrue(transactions.isEmpty());
    }

    private Transaction buildTransaction(String transactionId, String accountId) {
        Transaction transaction = new Transaction();
        transaction.setTransactionId(transactionId);
        transaction.setAccountId(accountId);
        transaction.setPayeeId("PAYEE-01");
        transaction.setPayeeName("Test Payee");
        transaction.setAmount(123.45);
        transaction.setCurrency("USD");
        transaction.setTransactionType("TRANSFER");
        transaction.setTransactionTime(LocalDateTime.of(2026, 1, 10, 9, 30));
        transaction.setDescription("Repository test transaction");
        transaction.setStatus("SUCCESS");
        return transaction;
    }
}
