package com.neueda.service;

import com.neueda.entity.Alert;
import com.neueda.entity.Rule;
import com.neueda.repository.AlertRepository;
import com.neueda.repository.RuleRepository;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class RuleServiceDeleteIntegrationTest {

    @Autowired
    private RuleService ruleService;

    @Autowired
    private RuleRepository ruleRepository;

    @Autowired
    private AlertRepository alertRepository;

    @BeforeEach
    void setUp() {
        alertRepository.deleteAll();
        ruleRepository.deleteAll();
    }

    @Test
    void deleteRuleRemovesLinkedAlertsBeforeDeletingRule() {
        Rule rule = new Rule();
        rule.setRuleName("Amount Threshold Rule");
        rule.setRuleType("AMOUNT_THRESHOLD");
        rule.setThreshold(1000d);
        rule.setSeverity("HIGH");
        rule.setActive(true);
        Rule savedRule = ruleRepository.save(rule);

        Alert alert = new Alert();
        alert.setAlertId("ALERT-TEST-1");
        alert.setTransactionId(1L);
        alert.setRuleId(savedRule.getId());
        alert.setSeverity("HIGH");
        alert.setStatus("OPEN");
        alertRepository.save(alert);

        ruleService.deleteRule(savedRule.getId());

        Assertions.assertTrue(ruleRepository.findById(savedRule.getId()).isEmpty());
        List<Alert> remainingAlerts = alertRepository.findByRuleId(savedRule.getId());
        Assertions.assertTrue(remainingAlerts.isEmpty(), "Expected linked alerts to be deleted before the rule");
    }
}

