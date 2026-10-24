
package com.jobportal.jobportal.controller;

import com.jobportal.jobportal.dto.ApplicationRequest;
import com.jobportal.jobportal.dto.JobResponse;
import com.jobportal.jobportal.entity.Application;
import com.jobportal.jobportal.entity.Company;
import com.jobportal.jobportal.entity.Job;
import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.ApplicationRepository;
import com.jobportal.jobportal.repository.CompanyRepository;
import com.jobportal.jobportal.repository.JobRepository;
import com.jobportal.jobportal.repository.ResumeRepository;
import com.jobportal.jobportal.repository.StudentProfileRepository;
import com.jobportal.jobportal.security.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final ResumeRepository resumeRepository;
    private final StudentProfileRepository profileRepository;
    private final AuthService authService;

    public ApplicationController(
            ApplicationRepository applicationRepository,
            JobRepository jobRepository,
            CompanyRepository companyRepository,
            ResumeRepository resumeRepository,
            StudentProfileRepository profileRepository,
            AuthService authService) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
        this.resumeRepository = resumeRepository;
        this.profileRepository = profileRepository;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<?> submitApplication(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @Valid @RequestBody ApplicationRequest request) {

        User applicant = authService.requireRole(
                authorization, User.Role.STUDENT);

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Job not found."));

        if (!JobResponse.isAcceptingApplications(job)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This job is no longer accepting applications.");
        }

        boolean profileComplete = profileRepository
                .findByUserId(applicant.getId())
                .map(p -> p.isComplete())
                .orElse(false);
        if (!profileComplete) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please complete your profile before applying.");
        }

        boolean ownsResume = resumeRepository.findById(request.getResumeId())
                .map(r -> r.getUserId().equals(applicant.getId()))
                .orElse(false);
        if (!ownsResume) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please select one of your uploaded resumes.");
        }

        if (applicationRepository.existsByJobIdAndApplicantId(
                job.getId(), applicant.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message",
                            "You have already applied for this job."));
        }

        Application application = new Application();
        application.setJobId(job.getId());
        application.setApplicantId(applicant.getId());
        application.setResumeId(request.getResumeId());
        application.setCoverLetter(request.getCoverLetter().trim());
        application.setStatus(Application.ApplicationStatus.APPLIED);

        Application saved = applicationRepository.save(application);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Application submitted successfully!",
                        "applicationId", saved.getId(),
                        "status", saved.getStatus().name()));
    }

    // Applications of the logged-in student, with job and company names
    @GetMapping("/mine")
    public List<Map<String, Object>> myApplications(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        User applicant = authService.requireRole(
                authorization, User.Role.STUDENT);

        List<Application> applications = applicationRepository
                .findByApplicantIdOrderByAppliedAtDesc(applicant.getId());

        Set<Long> jobIds = applications.stream()
                .map(Application::getJobId).collect(Collectors.toSet());
        Map<Long, Job> jobs = jobRepository.findAllById(jobIds).stream()
                .collect(Collectors.toMap(Job::getId, Function.identity()));

        Set<Long> companyIds = jobs.values().stream()
                .map(Job::getCompanyId).collect(Collectors.toSet());
        Map<Long, String> companyNames = companyRepository
                .findAllById(companyIds).stream()
                .collect(Collectors.toMap(Company::getId, Company::getName));

        return applications.stream().map(application -> {
            Job job = jobs.get(application.getJobId());
            Map<String, Object> row = new HashMap<>();
            row.put("id", application.getId());
            row.put("jobId", application.getJobId());
            row.put("jobTitle", job == null ? null : job.getTitle());
            row.put("companyName", job == null
                    ? null : companyNames.get(job.getCompanyId()));
            row.put("status", application.getStatus().name());
            row.put("appliedAt", application.getAppliedAt());
            return row;
        }).toList();
    }
}
