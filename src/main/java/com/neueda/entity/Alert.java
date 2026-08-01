package com.neueda.entity;

import java.time.LocalDateTime;
import java.util.Objects;

public class Alert {

    private Long id;
    private String alertId;
    private Long transactionId;
    private Long ruleId;
    private String severity;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Alert() {
    }

    public Alert(Long id, String alertId, Long transactionId, Long ruleId, String severity, String status,
                 LocalDateTime createdAt, LocalDateTime updatedAt) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Alert alert)) {
            return false;
        }
        return Objects.equals(id, alert.id)
                && Objects.equals(alertId, alert.alertId)
                && Objects.equals(transactionId, alert.transactionId)
                && Objects.equals(ruleId, alert.ruleId)
                && Objects.equals(severity, alert.severity)
                && Objects.equals(status, alert.status)
                && Objects.equals(createdAt, alert.createdAt)
                && Objects.equals(updatedAt, alert.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, alertId, transactionId, ruleId, severity, status, createdAt, updatedAt);
    }

    @Override
    public String toString() {
        return "Alert{" +
                "id=" + id +
                ", alertId='" + alertId + '\'' +
                ", transactionId=" + transactionId +
                ", ruleId=" + ruleId +
                ", severity='" + severity + '\'' +
                ", status='" + status + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}

