package com.neueda.dto;

public class RuleRequest {

    private String ruleName;
    private String ruleType;
    private Double threshold;
    private Integer timeWindowMinutes;
    private String severity;
    private Boolean active;

    public RuleRequest() {
    }

    public RuleRequest(String ruleName, String ruleType, Double threshold,
                       Integer timeWindowMinutes, String severity, Boolean active) {
        this.ruleName = ruleName;
        this.ruleType = ruleType;
        this.threshold = threshold;
        this.timeWindowMinutes = timeWindowMinutes;
        this.severity = severity;
        this.active = active;
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
}