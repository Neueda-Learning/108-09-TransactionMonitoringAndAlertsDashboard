package com.neueda.controller;

import com.neueda.dto.RuleRequest;
import com.neueda.dto.RuleResponse;
import com.neueda.service.RuleService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RuleControllerTest {

    @Mock
    private RuleService ruleService;

    @InjectMocks
    private RuleController controller;

    @Test
    void createRuleReturnsCreatedStatusAndBody() {
        RuleRequest request = buildRuleRequest();
        RuleResponse expected = buildRuleResponse(1L);
        when(ruleService.createRule(request)).thenReturn(expected);

        ResponseEntity<RuleResponse> response = controller.createRule(request);

        assertNotNull(response);
        assertEquals(201, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(ruleService).createRule(request);
    }

    @Test
    void getAllRulesReturnsOkWithBody() {
        List<RuleResponse> expected = List.of(buildRuleResponse(1L), buildRuleResponse(2L));
        when(ruleService.getAllRules()).thenReturn(expected);

        ResponseEntity<List<RuleResponse>> response = controller.getAllRules();

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(ruleService).getAllRules();
    }

    @Test
    void getRuleByIdReturnsOkWithBody() {
        RuleResponse expected = buildRuleResponse(5L);
        when(ruleService.getRuleById(5L)).thenReturn(expected);

        ResponseEntity<RuleResponse> response = controller.getRuleById(5L);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(ruleService).getRuleById(5L);
    }

    @Test
    void updateRuleReturnsOkWithBody() {
        RuleRequest request = buildRuleRequest();
        request.setThreshold(7500.0);

        RuleResponse expected = buildRuleResponse(7L);
        expected.setThreshold(7500.0);

        when(ruleService.updateRule(7L, request)).thenReturn(expected);

        ResponseEntity<RuleResponse> response = controller.updateRule(7L, request);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(ruleService).updateRule(7L, request);
    }

    @Test
    void deleteRuleReturnsNoContentAndCallsService() {
        ResponseEntity<Void> response = controller.deleteRule(3L);

        assertNotNull(response);
        assertEquals(204, response.getStatusCode().value());
        assertNull(response.getBody());
        verify(ruleService).deleteRule(3L);
    }

    @Test
    void createRulePropagatesServiceException() {
        RuleRequest request = buildRuleRequest();
        RuntimeException exception = new RuntimeException("Rule already exists.");
        when(ruleService.createRule(request)).thenThrow(exception);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> controller.createRule(request));

        assertSame(exception, thrown);
        assertTrue(thrown.getMessage().contains("already exists"));
        verify(ruleService).createRule(request);
    }

    @Test
    void getRuleByIdPropagatesServiceException() {
        RuntimeException exception = new RuntimeException("Rule not found");
        when(ruleService.getRuleById(404L)).thenThrow(exception);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> controller.getRuleById(404L));

        assertSame(exception, thrown);
        assertEquals("Rule not found", thrown.getMessage());
        verify(ruleService).getRuleById(404L);
    }

    @Test
    void updateRulePropagatesServiceException() {
        RuleRequest request = buildRuleRequest();
        RuntimeException exception = new RuntimeException("Rule not found");
        when(ruleService.updateRule(99L, request)).thenThrow(exception);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> controller.updateRule(99L, request));

        assertSame(exception, thrown);
        verify(ruleService).updateRule(99L, request);
    }

    @Test
    void deleteRulePropagatesServiceException() {
        RuntimeException exception = new RuntimeException("Rule not found");
        when(ruleService.deleteRule(88L)).thenThrow(exception);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> controller.deleteRule(88L));

        assertSame(exception, thrown);
        verify(ruleService).deleteRule(88L);
    }

    private RuleRequest buildRuleRequest() {
        RuleRequest request = new RuleRequest();
        request.setRuleName("Daily Limit Rule");
        request.setRuleType("DAILY_LIMIT");
        request.setThreshold(5000.0);
        request.setTimeWindowMinutes(1440);
        request.setSeverity("HIGH");
        request.setActive(true);
        return request;
    }

    private RuleResponse buildRuleResponse(Long id) {
        RuleResponse response = new RuleResponse();
        response.setId(id);
        response.setRuleName("Daily Limit Rule");
        response.setRuleType("DAILY_LIMIT");
        response.setThreshold(5000.0);
        response.setTimeWindowMinutes(1440);
        response.setSeverity("HIGH");
        response.setActive(true);
        return response;
    }
}
