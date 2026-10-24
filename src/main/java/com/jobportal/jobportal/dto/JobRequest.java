package com.jobportal.jobportal.dto;

import com.jobportal.jobportal.entity.Job;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Job details sent by a company. The company is taken from the login. */
public class JobRequest {

    @NotBlank(message = "Job title is required")
    @Size(max = 180, message = "Job title must be at most 180 characters")
    private String title;

    @NotBlank(message = "Job description is required")
    @Size(max = 10000, message = "Description must be at most 10000 characters")
    private String description;

    @Size(max = 5000, message = "Requirements must be at most 5000 characters")
    private String requirements;

    @Size(max = 2000, message = "Skills must be at most 2000 characters")
    private String skillsRequired;

    @NotBlank(message = "Location is required")
    @Size(max = 150, message = "Location must be at most 150 characters")
    private String location;

    @NotNull(message = "Employment type is required")
    private Job.EmploymentType employmentType;

    @NotNull(message = "Work mode is required")
    private Job.WorkMode workMode;

    @NotNull(message = "Minimum experience is required")
    @DecimalMin(value = "0.0", message = "Experience cannot be negative")
    @DecimalMax(value = "50.0", message = "Experience must be at most 50 years")
    @Digits(integer = 3, fraction = 1, message = "Experience can have one decimal place")
    private BigDecimal experienceMin;

    @DecimalMin(value = "0.0", message = "Minimum salary cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Minimum salary is too large")
    private BigDecimal salaryMin;

    @DecimalMin(value = "0.0", message = "Maximum salary cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Maximum salary is too large")
    private BigDecimal salaryMax;

    @NotNull(message = "Number of openings is required")
    @Min(value = 1, message = "There must be at least 1 opening")
    @Max(value = 10000, message = "Openings must be at most 10000")
    private Integer openings;

    private LocalDate applicationDeadline;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public String getSkillsRequired() {
        return skillsRequired;
    }

    public void setSkillsRequired(String skillsRequired) {
        this.skillsRequired = skillsRequired;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Job.EmploymentType getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(Job.EmploymentType employmentType) {
        this.employmentType = employmentType;
    }

    public Job.WorkMode getWorkMode() {
        return workMode;
    }

    public void setWorkMode(Job.WorkMode workMode) {
        this.workMode = workMode;
    }

    public BigDecimal getExperienceMin() {
        return experienceMin;
    }

    public void setExperienceMin(BigDecimal experienceMin) {
        this.experienceMin = experienceMin;
    }

    public BigDecimal getSalaryMin() {
        return salaryMin;
    }

    public void setSalaryMin(BigDecimal salaryMin) {
        this.salaryMin = salaryMin;
    }

    public BigDecimal getSalaryMax() {
        return salaryMax;
    }

    public void setSalaryMax(BigDecimal salaryMax) {
        this.salaryMax = salaryMax;
    }

    public Integer getOpenings() {
        return openings;
    }

    public void setOpenings(Integer openings) {
        this.openings = openings;
    }

    public LocalDate getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(LocalDate applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }
}
