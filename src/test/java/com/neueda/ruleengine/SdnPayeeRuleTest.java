package com.neueda.ruleengine;

import com.neueda.entity.Transaction;
import com.neueda.service.SdnScreeningService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class SdnPayeeRuleTest {

    @Test
    void triggersAlertWhenSdnMatchIsReturned() {
        com.neueda.entity.Rule config = new com.neueda.entity.Rule();
        config.setId(10L);
        config.setRuleName("SDN Test Rule");
        config.setRuleType("SDN_SCREENING");
        config.setThreshold(0.75d);
        config.setSeverity("HIGH");
        config.setActive(true);

        SdnScreeningService screeningService =
                (payeeName, minConfidence) -> SdnScreeningService.ScreeningResult.match(
                        payeeName,
                        "ACME SANCTIONS LTD",
                        0.92d,
                        "match"
                );

        SdnPayeeRule rule = new SdnPayeeRule(config, screeningService);

        Transaction tx = buildTransaction("P-100", "ACME LTD");

        Rule.EvaluationResult result = rule.evaluate(tx, List.of());

        Assertions.assertTrue(result.triggered());
        Assertions.assertEquals(10L, result.ruleId());
        Assertions.assertEquals("HIGH", result.severity());
    }

    @Test
    void doesNotTriggerWhenNoSdnMatch() {
        com.neueda.entity.Rule config = new com.neueda.entity.Rule();
        config.setRuleType("SDN_SCREENING");
        config.setActive(true);

        SdnScreeningService screeningService =
                (payeeName, minConfidence) -> SdnScreeningService.ScreeningResult.noMatch(
                        payeeName,
                        "No SDN matches"
                );

        SdnPayeeRule rule = new SdnPayeeRule(config, screeningService);

        Transaction tx = buildTransaction("P-200", "Normal Vendor");
        Rule.EvaluationResult result = rule.evaluate(tx, List.of());

        Assertions.assertFalse(result.triggered());
        Assertions.assertEquals("No SDN matches", result.reason());
    }

    private static Transaction buildTransaction(final String payeeId, final String payeeName) {
        Transaction tx = new Transaction();
        tx.setId(1L);
        tx.setTransactionId("TX-100");
        tx.setAccountId("ACC-1");
        tx.setPayeeId(payeeId);
        tx.setPayeeName(payeeName);
        tx.setAmount(3000d);
        tx.setCurrency("USD");
        tx.setTransactionType("DEBIT");
        tx.setStatus("COMPLETED");
        tx.setTransactionTime(LocalDateTime.now());
        return tx;
    }
}

