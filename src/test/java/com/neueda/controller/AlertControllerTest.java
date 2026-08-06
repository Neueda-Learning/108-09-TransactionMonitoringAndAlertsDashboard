package com.neueda.controller;

import com.neueda.dto.AlertRequest;
import com.neueda.dto.AlertResponse;
import com.neueda.dto.AlertStatusRequest;
import com.neueda.service.AlertService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlertControllerTest {

    @Mock
    private AlertService alertService;

    @InjectMocks
    private AlertController controller;

    @Test
    void createAlertReturnsCreatedStatusAndBody() {
        AlertRequest request = buildAlertRequest();
        AlertResponse expected = buildAlertResponse(1L, "OPEN");
        when(alertService.createAlert(request)).thenReturn(expected);

        ResponseEntity<AlertResponse> response = controller.createAlert(request);

        assertNotNull(response);
        assertEquals(201, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(alertService).createAlert(request);
    }

    @Test
    void getAllAlertsReturnsOkWithBody() {
        List<AlertResponse> expected = List.of(
                buildAlertResponse(1L, "OPEN"),
                buildAlertResponse(2L, "ACKNOWLEDGED")
        );
        when(alertService.getAllAlerts()).thenReturn(expected);

        ResponseEntity<List<AlertResponse>> response = controller.getAllAlerts();

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(alertService).getAllAlerts();
    }

    @Test
    void getAlertByIdReturnsOkWithBody() {
        AlertResponse expected = buildAlertResponse(9L, "OPEN");
        when(alertService.getAlertById(9L)).thenReturn(expected);

        ResponseEntity<AlertResponse> response = controller.getAlertById(9L);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(alertService).getAlertById(9L);
    }

    @Test
    void updateAlertStatusReturnsOkWithBody() {
        AlertStatusRequest request = new AlertStatusRequest("INVESTIGATING");
        AlertResponse expected = buildAlertResponse(4L, "INVESTIGATING");

        when(alertService.updateAlertStatus(4L, request)).thenReturn(expected);

        ResponseEntity<AlertResponse> response = controller.updateAlertStatus(4L, request);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(alertService).updateAlertStatus(4L, request);
    }

    @Test
    void deleteAlertReturnsNoContentAndCallsService() {
        ResponseEntity<Void> response = controller.deleteAlert(12L);

        assertNotNull(response);
        assertEquals(204, response.getStatusCode().value());
        verify(alertService).deleteAlert(12L);
    }

    private AlertRequest buildAlertRequest() {
        AlertRequest request = new AlertRequest();
        request.setAlertId("ALERT-12345678");
        request.setTransactionId(1001L);
        request.setRuleId(5001L);
        request.setSeverity("HIGH");
        request.setStatus("OPEN");
        return request;
    }

    private AlertResponse buildAlertResponse(Long id, String status) {
        LocalDateTime now = LocalDateTime.of(2026, 1, 1, 10, 30);

        AlertResponse response = new AlertResponse();
        response.setId(id);
        response.setAlertId("ALERT-12345678");
        response.setTransactionId(1001L);
        response.setRuleId(5001L);
        response.setSeverity("HIGH");
        response.setStatus(status);
        response.setCreatedAt(now);
        response.setUpdatedAt(now);
        return response;
    }
}

