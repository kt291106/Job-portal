
package com.jobportal.jobportal.controller;

import com.jobportal.jobportal.dto.JobRequest;
import com.jobportal.jobportal.dto.JobResponse;
import com.jobportal.jobportal.dto.Text;
import com.jobportal.jobportal.entity.Company;
import com.jobportal.jobportal.entity.Job;
import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.CompanyRepository;
import com.jobportal.jobportal.repository.JobRepository;
import com.jobportal.jobportal.security.AuthService;
import com.jobportal.jobportal.service.JobViewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final AuthService authService;
    private final JobViewService jobViewService;

    public JobController(JobRepository jobRepository,
                         CompanyRepository companyRepository,
                         AuthService authService,
                         JobViewService jobViewService) {
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
        this.authService = authService;
        this.jobViewService = jobViewService;
    }

    // Public: all published jobs, newest first
    @GetMapping
    public List<JobResponse> getPublishedJobs() {
        return jobViewService.toResponses(
                jobRepository.findByStatusOrderByCreatedAtDesc(
                        Job.JobStatus.PUBLISHED),
                false);
    }

    // Public: one published job
    @GetMapping("/{id}")
    public JobResponse getJob(@PathVariable Long id) {
        Job job = jobRepository.findById(id)
                .filter(j -> j.getStatus() == Job.JobStatus.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Job not found."));
        return jobViewService.toResponse(job, false);
    }

    // Only a logged-in company can publish, and only for its own company
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobResponse createJob(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @Valid @RequestBody JobRequest request) {

        User recruiter = authService.requireRole(
                authorization, User.Role.RECRUITER);

        Company company = companyRepository
                .findByRecruiterId(recruiter.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Register your company before publishing jobs."));

        if (request.getSalaryMin() != null && request.getSalaryMax() != null
                && request.getSalaryMin().compareTo(request.getSalaryMax()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Minimum salary cannot be greater than maximum salary.");
        }

        if (request.getApplicationDeadline() != null
                && request.getApplicationDeadline().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Application deadline cannot be in the past.");
        }

        Job job = new Job();
        job.setCompanyId(company.getId());
        job.setTitle(request.getTitle().trim());
        job.setDescription(request.getDescription().trim());
        job.setRequirements(Text.clean(request.getRequirements()));
        job.setSkillsRequired(Text.clean(request.getSkillsRequired()));
        job.setLocation(request.getLocation().trim());
        job.setEmploymentType(request.getEmploymentType());
        job.setWorkMode(request.getWorkMode());
        job.setExperienceMin(request.getExperienceMin());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setOpenings(request.getOpenings());
        job.setApplicationDeadline(request.getApplicationDeadline());
        job.setStatus(Job.JobStatus.PUBLISHED);

        Job saved = jobRepository.save(job);
        return JobResponse.from(saved, company.getName(), 0L);
    }
}
