package com.neueda.entity;

import java.util.Objects;

public class Rule {

    private Long id;
    private String ruleName;
    private String ruleType;
    private Double threshold;
    private Integer timeWindowMinutes;
    private String severity;
    private Boolean active;

    public Rule() {
    }

    public Rule(Long id, String ruleName, String ruleType, Double threshold, Integer timeWindowMinutes,
                String severity, Boolean active) {
        this.id = id;
        this.ruleName = ruleName;
        this.ruleType = ruleType;
        this.threshold = threshold;
        this.timeWindowMinutes = timeWindowMinutes;
        this.severity = severity;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    public String getRuleType() {
        return ruleType;
    }

    public void setRuleType(String ruleType) {
        this.ruleType = ruleType;
    }

    public Double getThreshold() {
        return threshold;
    }

    public void setThreshold(Double threshold) {
        this.threshold = threshold;
    }

    public Integer getTimeWindowMinutes() {
        return timeWindowMinutes;
    }

    public void setTimeWindowMinutes(Integer timeWindowMinutes) {
        this.timeWindowMinutes = timeWindowMinutes;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Rule rule)) {
            return false;
        }
        return Objects.equals(id, rule.id)
                && Objects.equals(ruleName, rule.ruleName)
                && Objects.equals(ruleType, rule.ruleType)
                && Objects.equals(threshold, rule.threshold)
                && Objects.equals(timeWindowMinutes, rule.timeWindowMinutes)
                && Objects.equals(severity, rule.severity)
                && Objects.equals(active, rule.active);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, ruleName, ruleType, threshold, timeWindowMinutes, severity, active);
    }

    @Override
    public String toString() {
        return "Rule{" +
                "id=" + id +
                ", ruleName='" + ruleName + '\'' +
                ", ruleType='" + ruleType + '\'' +
                ", threshold=" + threshold +
                ", timeWindowMinutes=" + timeWindowMinutes +
                ", severity='" + severity + '\'' +
                ", active=" + active +
                '}';
    }
}
