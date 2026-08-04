package com.neueda.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AlertRequest {

	private String alertId;

	@NotNull(message = "Transaction ID is required")
	private Long transactionId;

	@NotNull(message = "Rule ID is required")
	private Long ruleId;

	@NotBlank(message = "Severity is required")
	private String severity;

	private String status;

	public AlertRequest() {
	}

	public AlertRequest(String alertId, Long transactionId, Long ruleId, String severity, String status) {
		this.alertId = alertId;
		this.transactionId = transactionId;
		this.ruleId = ruleId;
		this.severity = severity;
		this.status = status;
	}

	public String getAlertId() {
		return alertId;
	}

	public void setAlertId(String alertId) {
		this.alertId = alertId;
	}

	public Long getTransactionId() {
		return transactionId;
	}

	public void setTransactionId(Long transactionId) {
		this.transactionId = transactionId;
	}

	public Long getRuleId() {
		return ruleId;
	}

	public void setRuleId(Long ruleId) {
		this.ruleId = ruleId;
	}

	public String getSeverity() {
		return severity;
	}

	public void setSeverity(String severity) {
		this.severity = severity;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}
}
