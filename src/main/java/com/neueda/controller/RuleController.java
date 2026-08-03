package com.neueda.controller;

import com.neueda.dto.RuleRequest;
import com.neueda.dto.RuleResponse;
import com.neueda.service.RuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rules")
@CrossOrigin(origins = "*")
public class RuleController {

    @Autowired
    private RuleService ruleService;

    // Create Rule
    @PostMapping
    public ResponseEntity<RuleResponse> createRule(@RequestBody RuleRequest request) {
        RuleResponse response = ruleService.createRule(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Get All Rules
    @GetMapping
    public ResponseEntity<List<RuleResponse>> getAllRules() {
        return ResponseEntity.ok(ruleService.getAllRules());
    }

    // Get Rule By Id
    @GetMapping("/{id}")
    public ResponseEntity<RuleResponse> getRuleById(@PathVariable Long id) {
        return ResponseEntity.ok(ruleService.getRuleById(id));
    }

    // Update Rule
    @PutMapping("/{id}")
    public ResponseEntity<RuleResponse> updateRule(@PathVariable Long id,
                                                   @RequestBody RuleRequest request) {
        return ResponseEntity.ok(ruleService.updateRule(id, request));
    }

    // Delete Rule
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRule(@PathVariable Long id) {
        return ResponseEntity.ok(ruleService.deleteRule(id));
    }
}