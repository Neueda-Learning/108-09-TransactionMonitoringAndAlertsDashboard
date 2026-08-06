package com.neueda.repository;

import com.neueda.entity.Alert;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
@ActiveProfiles("test")
class AlertRepositoryTest {

    @Autowired
    private AlertRepository alertRepository;

    @Test
    void findByStatusReturnsMatchingAlertsOnly() {
        Alert openAlert = alertRepository.save(buildAlert("ALERT-OPEN", 101L, 201L, "HIGH", "OPEN"));
        alertRepository.save(buildAlert("ALERT-CLOSED", 102L, 202L, "LOW", "CLOSED"));

        List<Alert> alerts = alertRepository.findByStatus("OPEN");

        assertEquals(1, alerts.size());
        assertEquals(openAlert.getAlertId(), alerts.get(0).getAlertId());
    }

    @Test
    void findBySeverityReturnsMatchingAlertsOnly() {
        Alert highAlert = alertRepository.save(buildAlert("ALERT-HIGH", 103L, 203L, "HIGH", "OPEN"));
        alertRepository.save(buildAlert("ALERT-MED", 104L, 204L, "MEDIUM", "OPEN"));

        List<Alert> alerts = alertRepository.findBySeverity("HIGH");

        assertEquals(1, alerts.size());
        assertEquals(highAlert.getAlertId(), alerts.get(0).getAlertId());
    }

    @Test
    void findByTransactionIdReturnsAllAlertsForTransaction() {
        Alert first = alertRepository.save(buildAlert("ALERT-TX-1", 500L, 210L, "LOW", "OPEN"));
        Alert second = alertRepository.save(buildAlert("ALERT-TX-2", 500L, 211L, "HIGH", "ACKNOWLEDGED"));
        alertRepository.save(buildAlert("ALERT-TX-OTHER", 501L, 212L, "HIGH", "OPEN"));

        List<Alert> alerts = alertRepository.findByTransactionId(500L);

        assertEquals(2, alerts.size());
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertId().equals(first.getAlertId())));
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertId().equals(second.getAlertId())));
    }

    @Test
    void findByRuleIdReturnsAllAlertsForRule() {
        Alert first = alertRepository.save(buildAlert("ALERT-RULE-1", 601L, 700L, "LOW", "OPEN"));
        Alert second = alertRepository.save(buildAlert("ALERT-RULE-2", 602L, 700L, "HIGH", "OPEN"));
        alertRepository.save(buildAlert("ALERT-RULE-OTHER", 603L, 701L, "HIGH", "OPEN"));

        List<Alert> alerts = alertRepository.findByRuleId(700L);

        assertEquals(2, alerts.size());
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertId().equals(first.getAlertId())));
        assertTrue(alerts.stream().anyMatch(a -> a.getAlertId().equals(second.getAlertId())));
    }

    private Alert buildAlert(String alertId, Long transactionId, Long ruleId, String severity, String status) {
        Alert alert = new Alert();
        alert.setAlertId(alertId);
        alert.setTransactionId(transactionId);
        alert.setRuleId(ruleId);
        alert.setSeverity(severity);
        alert.setStatus(status);
        return alert;
    }
}
