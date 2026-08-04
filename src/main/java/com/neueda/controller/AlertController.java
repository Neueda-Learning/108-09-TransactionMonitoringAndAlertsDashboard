package com.neueda.controller;

import com.neueda.dto.AlertRequest;
import com.neueda.dto.AlertResponse;
import com.neueda.dto.AlertStatusRequest;
import com.neueda.service.AlertService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

	private final AlertService alertService;

	public AlertController(AlertService alertService) {
		this.alertService = alertService;
	}

	@PostMapping
	public ResponseEntity<AlertResponse> createAlert(@Valid @RequestBody AlertRequest request) {
		AlertResponse response = alertService.createAlert(request);
		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}

	@GetMapping
	public ResponseEntity<List<AlertResponse>> getAllAlerts() {
		return ResponseEntity.ok(alertService.getAllAlerts());
	}

	@GetMapping("/{id}")
	public ResponseEntity<AlertResponse> getAlertById(@PathVariable Long id) {
		return ResponseEntity.ok(alertService.getAlertById(id));
	}

	@PutMapping("/{id}/status")
	public ResponseEntity<AlertResponse> updateAlertStatus(@PathVariable Long id,
														   @Valid @RequestBody AlertStatusRequest request) {
		return ResponseEntity.ok(alertService.updateAlertStatus(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteAlert(@PathVariable Long id) {
		alertService.deleteAlert(id);
		return ResponseEntity.noContent().build();
	}
}
