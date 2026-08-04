package com.neueda.service;

import com.neueda.dto.RuleRequest;
import com.neueda.dto.RuleResponse;
import com.neueda.entity.Rule;
import com.neueda.repository.RuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RuleService {

    @Autowired
    private RuleRepository ruleRepository;

    // Create Rule
    public RuleResponse createRule(RuleRequest request) {

        if (ruleRepository.existsByRuleName(request.getRuleName())) {
            throw new RuntimeException("Rule already exists.");
        }

        Rule rule = new Rule();

        rule.setRuleName(request.getRuleName());
        rule.setRuleType(request.getRuleType());
        rule.setThreshold(request.getThreshold());
        rule.setTimeWindowMinutes(request.getTimeWindowMinutes());
        rule.setSeverity(request.getSeverity());
        rule.setActive(request.getActive());

        Rule savedRule = ruleRepository.save(rule);

        return convertToResponse(savedRule);
    }

    // Get All Rules
    public List<RuleResponse> getAllRules() {

        List<Rule> rules = ruleRepository.findAll();
        List<RuleResponse> responses = new ArrayList<>();

        for (Rule rule : rules) {
            responses.add(convertToResponse(rule));
        }

        return responses;
    }

    // Get Rule By Id
    public RuleResponse getRuleById(Long id) {

        Rule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rule not found"));

        return convertToResponse(rule);
    }

    // Update Rule
    public RuleResponse updateRule(Long id, RuleRequest request) {

        Rule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rule not found"));

        rule.setRuleName(request.getRuleName());
        rule.setRuleType(request.getRuleType());
        rule.setThreshold(request.getThreshold());
        rule.setTimeWindowMinutes(request.getTimeWindowMinutes());
        rule.setSeverity(request.getSeverity());
        rule.setActive(request.getActive());

        Rule updatedRule = ruleRepository.save(rule);

        return convertToResponse(updatedRule);
    }

    // Delete Rule
    public String deleteRule(Long id) {

        Rule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rule not found"));

        ruleRepository.delete(rule);

        return "Rule deleted successfully.";
    }

    // Convert Entity to Response DTO
    private RuleResponse convertToResponse(Rule rule) {

        RuleResponse response = new RuleResponse();

        response.setId(rule.getId());
        response.setRuleName(rule.getRuleName());
        response.setRuleType(rule.getRuleType());
        response.setThreshold(rule.getThreshold());
        response.setTimeWindowMinutes(rule.getTimeWindowMinutes());
        response.setSeverity(rule.getSeverity());
        response.setActive(rule.getActive());

        return response;
    }
}