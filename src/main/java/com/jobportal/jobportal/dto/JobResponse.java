package com.jobportal.jobportal.dto;

import com.jobportal.jobportal.entity.Job;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record JobResponse(
        Long id,
        Long companyId,
        String companyName,
        String title,
        String description,
        String requirements,
        String skillsRequired,
        String location,
        String employmentType,
        String workMode,
        BigDecimal experienceMin,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        Integer openings,
        LocalDate applicationDeadline,
        String status,
        LocalDateTime createdAt,
        Long applicantCount) {

    public static JobResponse from(Job job, String companyName,
                                   Long applicantCount) {
        return new JobResponse(
                job.getId(),
                job.getCompanyId(),
                companyName,
                job.getTitle(),
                job.getDescription(),
                job.getRequirements(),
                job.getSkillsRequired(),
                job.getLocation(),
                job.getEmploymentType() == null ? null : job.getEmploymentType().name(),
                job.getWorkMode() == null ? null : job.getWorkMode().name(),
                job.getExperienceMin(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getOpenings(),
                job.getApplicationDeadline(),
                job.getStatus() == null ? null : job.getStatus().name(),
                job.getCreatedAt(),
                applicantCount);
    }

    /** True when the deadline has not passed (no deadline = always open). */
    public static boolean isAcceptingApplications(Job job) {
        return job.getStatus() == Job.JobStatus.PUBLISHED
                && (job.getApplicationDeadline() == null
                || !job.getApplicationDeadline().isBefore(LocalDate.now()));
    }
}
