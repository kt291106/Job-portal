package com.jobportal.jobportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The applicant is taken from the login, never from the request body. */
public class ApplicationRequest {

    @NotNull(message = "Job is required")
    private Long jobId;

    @NotNull(message = "Please select a resume")
    private Long resumeId;

    @NotBlank(message = "Cover letter is required")
    @Size(min = 50, max = 3000,
            message = "Cover letter must be 50 to 3000 characters")
    private String coverLetter;

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public Long getResumeId() {
        return resumeId;
    }

    public void setResumeId(Long resumeId) {
        this.resumeId = resumeId;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }
}
