package com.jobportal.jobportal.dto;

import jakarta.validation.constraints.NotBlank;

/** Used for changing a job's or an application's status. */
public class StatusRequest {

    @NotBlank(message = "Status is required")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
