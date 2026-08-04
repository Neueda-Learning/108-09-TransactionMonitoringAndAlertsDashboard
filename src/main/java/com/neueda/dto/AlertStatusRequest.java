package com.neueda.dto;

import jakarta.validation.constraints.NotBlank;

public class AlertStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;

    public AlertStatusRequest() {
    }

    public AlertStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

