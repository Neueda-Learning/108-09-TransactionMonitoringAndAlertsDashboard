package com.neueda.service;

import com.neueda.dto.AlertRequest;
import com.neueda.dto.AlertResponse;
import com.neueda.dto.AlertStatusRequest;
import com.neueda.entity.Alert;
import com.neueda.repository.AlertRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class AlertService {

	private static final String STATUS_OPEN = "OPEN";
	private static final String STATUS_ACKNOWLEDGED = "ACKNOWLEDGED";
	private static final String STATUS_INVESTIGATING = "INVESTIGATING";
	private static final String STATUS_CLOSED = "CLOSED";
	private static final String STATUS_DISMISSED = "DISMISSED";

	private static final Set<String> VALID_STATUSES = Set.of(
			STATUS_OPEN,
			STATUS_ACKNOWLEDGED,
			STATUS_INVESTIGATING,
			STATUS_CLOSED,
			STATUS_DISMISSED
	);

	private static final Map<String, Set<String>> VALID_TRANSITIONS = Map.of(
			STATUS_OPEN, Set.of(STATUS_ACKNOWLEDGED, STATUS_DISMISSED),
			STATUS_ACKNOWLEDGED, Set.of(STATUS_INVESTIGATING),
			STATUS_INVESTIGATING, Set.of(STATUS_CLOSED),
			STATUS_CLOSED, Set.of(),
			STATUS_DISMISSED, Set.of()
	);

	private static final Set<String> VALID_SEVERITIES = Set.of("LOW", "MEDIUM", "HIGH");

	private final AlertRepository alertRepository;

	public AlertService(AlertRepository alertRepository) {
		this.alertRepository = alertRepository;
	}

	public AlertResponse createAlert(AlertRequest request) {
		Alert alert = new Alert();
		alert.setAlertId(resolveAlertId(request.getAlertId()));
		alert.setTransactionId(request.getTransactionId());
		alert.setRuleId(request.getRuleId());
		alert.setSeverity(normalizeSeverity(request.getSeverity()));
		alert.setStatus(resolveInitialStatus(request.getStatus()));

		Alert savedAlert = alertRepository.save(alert);
		return convertToResponse(savedAlert);
	}

	public List<AlertResponse> getAllAlerts() {
		List<Alert> alerts = alertRepository.findAll();
		List<AlertResponse> responses = new ArrayList<>();

		for (Alert alert : alerts) {
			responses.add(convertToResponse(alert));
		}

		return responses;
	}

	public AlertResponse getAlertById(Long id) {
		Alert alert = findAlertById(id);
		return convertToResponse(alert);
	}

	public AlertResponse updateAlertStatus(Long id, AlertStatusRequest request) {
		Alert alert = findAlertById(id);
		String currentStatus = normalizeStatus(alert.getStatus());
		String targetStatus = normalizeStatus(request.getStatus());

		validateStatusTransition(currentStatus, targetStatus);

		alert.setStatus(targetStatus);

		Alert updatedAlert = alertRepository.save(alert);
		return convertToResponse(updatedAlert);
	}

	public void deleteAlert(Long id) {
		Alert alert = findAlertById(id);
		alertRepository.delete(alert);
	}

	private Alert findAlertById(Long id) {
		return alertRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found with id: " + id));
	}

	private String resolveAlertId(String alertId) {
		if (alertId == null || alertId.isBlank()) {
			return "ALERT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
		}

		return alertId.trim();
	}

	private String resolveInitialStatus(String status) {
		if (status == null || status.isBlank()) {
			return STATUS_OPEN;
		}

		String normalizedStatus = normalizeStatus(status);
		if (!STATUS_OPEN.equals(normalizedStatus)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"New alerts must start with status OPEN");
		}

		return normalizedStatus;
	}

	private String normalizeSeverity(String severity) {
		if (severity == null || severity.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Severity is required");
		}

		String normalizedSeverity = severity.trim().toUpperCase(Locale.ROOT);
		if (!VALID_SEVERITIES.contains(normalizedSeverity)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Invalid severity. Allowed values: LOW, MEDIUM, HIGH");
		}

		return normalizedSeverity;
	}

	private String normalizeStatus(String status) {
		if (status == null || status.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
		}

		String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
		if (!VALID_STATUSES.contains(normalizedStatus)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Invalid status. Allowed values: OPEN, ACKNOWLEDGED, INVESTIGATING, CLOSED, DISMISSED");
		}

		return normalizedStatus;
	}

	private void validateStatusTransition(String currentStatus, String targetStatus) {
		if (currentStatus.equals(targetStatus)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Alert is already in status " + currentStatus);
		}

		Set<String> allowedTransitions = VALID_TRANSITIONS.getOrDefault(currentStatus, Set.of());
		if (!allowedTransitions.contains(targetStatus)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Invalid status transition from " + currentStatus + " to " + targetStatus);
		}
	}

	private AlertResponse convertToResponse(Alert alert) {
		AlertResponse response = new AlertResponse();
		response.setId(alert.getId());
		response.setAlertId(alert.getAlertId());
		response.setTransactionId(alert.getTransactionId());
		response.setRuleId(alert.getRuleId());
		response.setSeverity(alert.getSeverity());
		response.setStatus(alert.getStatus());
		response.setCreatedAt(alert.getCreatedAt());
		response.setUpdatedAt(alert.getUpdatedAt());
		return response;
	}
}
