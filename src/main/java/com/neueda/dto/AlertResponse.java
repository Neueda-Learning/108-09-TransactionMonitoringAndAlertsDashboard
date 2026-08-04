package com.neueda.dto;

import java.time.LocalDateTime;

public class AlertResponse {

	private Long id;
	private String alertId;
	private Long transactionId;
	private Long ruleId;
	private String severity;
	private String status;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	public AlertResponse() {
	}

	public AlertResponse(Long id, String alertId, Long transactionId, Long ruleId,
						 String severity, String status, LocalDateTime createdAt,
						 LocalDateTime updatedAt) {
		this.id = id;
		this.alertId = alertId;
		this.transactionId = transactionId;
		this.ruleId = ruleId;
		this.severity = severity;
		this.status = status;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
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

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}
}
