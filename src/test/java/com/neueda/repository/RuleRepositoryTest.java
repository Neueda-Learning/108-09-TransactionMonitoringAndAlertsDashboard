package com.neueda.repository;

import com.neueda.entity.Rule;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
@ActiveProfiles("test")
class RuleRepositoryTest {

    @Autowired
    private RuleRepository ruleRepository;

    @Test
    void findByActiveTrueReturnsOnlyActiveRules() {
        Rule active = ruleRepository.save(buildRule("Daily Limit", "DAILY_LIMIT", "HIGH", true));
        ruleRepository.save(buildRule("Dormant Account", "DORMANT", "MEDIUM", false));

        List<Rule> rules = ruleRepository.findByActiveTrue();

        assertEquals(1, rules.size());
        assertEquals(active.getRuleName(), rules.get(0).getRuleName());
    }

    @Test
    void findByRuleTypeReturnsMatchingRulesOnly() {
        Rule target = ruleRepository.save(buildRule("Large Transfer", "AMOUNT_THRESHOLD", "HIGH", true));
        ruleRepository.save(buildRule("Velocity", "DAILY_LIMIT", "MEDIUM", true));

        List<Rule> rules = ruleRepository.findByRuleType("AMOUNT_THRESHOLD");

        assertEquals(1, rules.size());
        assertEquals(target.getRuleName(), rules.get(0).getRuleName());
    }

    @Test
    void findBySeverityReturnsMatchingRulesOnly() {
        Rule high = ruleRepository.save(buildRule("Rule High", "DAILY_LIMIT", "HIGH", true));
        ruleRepository.save(buildRule("Rule Low", "DAILY_LIMIT", "LOW", true));

        List<Rule> rules = ruleRepository.findBySeverity("HIGH");

        assertEquals(1, rules.size());
        assertEquals(high.getRuleName(), rules.get(0).getRuleName());
    }

    @Test
    void findByRuleTypeAndActiveTrueReturnsOnlyActiveForType() {
        Rule match = ruleRepository.save(buildRule("Active Type Match", "DAILY_LIMIT", "HIGH", true));
        ruleRepository.save(buildRule("Inactive Type Match", "DAILY_LIMIT", "HIGH", false));
        ruleRepository.save(buildRule("Active Other Type", "AMOUNT_THRESHOLD", "HIGH", true));

        List<Rule> rules = ruleRepository.findByRuleTypeAndActiveTrue("DAILY_LIMIT");

        assertEquals(1, rules.size());
        assertEquals(match.getRuleName(), rules.get(0).getRuleName());
    }

    @Test
    void existsByRuleNameReflectsPersistedState() {
        ruleRepository.save(buildRule("Built-in SDN Screening Rule", "SDN_SCREENING", "HIGH", true));

        assertTrue(ruleRepository.existsByRuleName("Built-in SDN Screening Rule"));
        assertFalse(ruleRepository.existsByRuleName("Non Existing Rule"));
    }

    private Rule buildRule(String ruleName, String ruleType, String severity, Boolean active) {
        Rule rule = new Rule();
        rule.setRuleName(ruleName);
        rule.setRuleType(ruleType);
        rule.setThreshold(1000.0);
        rule.setTimeWindowMinutes(60);
        rule.setSeverity(severity);
        rule.setActive(active);
        return rule;
    }
}
