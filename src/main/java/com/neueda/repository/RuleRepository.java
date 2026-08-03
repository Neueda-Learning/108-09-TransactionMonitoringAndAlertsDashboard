package com.neueda.repository;

import com.neueda.entity.Rule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleRepository extends JpaRepository<Rule, Long> {

    // Find all active rules
    List<Rule> findByActiveTrue();

    // Find rules by type
    List<Rule> findByRuleType(String ruleType);

    // Find rules by severity
    List<Rule> findBySeverity(String severity);

    // Find active rules of a specific type
    List<Rule> findByRuleTypeAndActiveTrue(String ruleType);

    // Check if a rule with the given name already exists
    boolean existsByRuleName(String ruleName);
}