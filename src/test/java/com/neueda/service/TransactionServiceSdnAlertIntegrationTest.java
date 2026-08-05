package com.neueda.service;

import com.neueda.entity.Alert;
import com.neueda.entity.Rule;
import com.neueda.entity.Transaction;
import com.neueda.repository.AlertRepository;
import com.neueda.repository.RuleRepository;
import com.neueda.repository.TransactionRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class TransactionServiceSdnAlertIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private RuleRepository ruleRepository;

    @Autowired
    private AlertRepository alertRepository;

    @BeforeEach
    void setUp() {
        alertRepository.deleteAll();
        ruleRepository.deleteAll();
        transactionRepository.deleteAll();
    }

    @Test
    void createsSdnAlertForInternalListPayeeEvenWithoutDatabaseSdnRule() {
        Rule newPayeeRule = new Rule();
        newPayeeRule.setRuleName("New Payee Rule");
        newPayeeRule.setRuleType("NEW_PAYEE");
        newPayeeRule.setThreshold(5000d);
        newPayeeRule.setSeverity("MEDIUM");
        newPayeeRule.setActive(true);
        ruleRepository.save(newPayeeRule);

        Transaction transaction = buildTransaction("TX-SDN-BANK-MELLI-1", "PAY-001", "Bank Melli Iran", 20000d);
        Transaction saved = transactionService.addTransaction(transaction);

        List<Alert> alerts = alertRepository.findByTransactionId(saved.getId());

        Assertions.assertEquals(2, alerts.size(), "Expected NEW_PAYEE and built-in SDN alerts");
        Assertions.assertTrue(alerts.stream().anyMatch(alert -> alert.getRuleId().equals(-1L) && "HIGH".equals(alert.getSeverity())));
        Assertions.assertTrue(alerts.stream().anyMatch(alert -> "MEDIUM".equals(alert.getSeverity())));
    }

    @Test
    void doesNotCreateSdnAlertForNonListedPayeeWithoutDatabaseSdnRule() {
        Transaction transaction = buildTransaction("TX-SDN-SAFE-1", "PAY-002", "Totally Safe Vendor Pvt Ltd", 3000d);
        Transaction saved = transactionService.addTransaction(transaction);

        List<Alert> alerts = alertRepository.findByTransactionId(saved.getId());

        Assertions.assertTrue(alerts.isEmpty(), "Expected no alerts for safe vendor without matching rules");
    }

    private static Transaction buildTransaction(
            final String transactionId,
            final String payeeId,
            final String payeeName,
            final double amount
    ) {
        Transaction transaction = new Transaction();
        transaction.setTransactionId(transactionId);
        transaction.setAccountId("ACC-TEST-1");
        transaction.setPayeeId(payeeId);
        transaction.setPayeeName(payeeName);
        transaction.setAmount(amount);
        transaction.setCurrency("USD");
        transaction.setTransactionType("DEBIT");
        transaction.setTransactionTime(LocalDateTime.now());
        transaction.setDescription("Integration test transaction");
        transaction.setStatus("COMPLETED");
        return transaction;
    }
}

