package com.jobportal.jobportal.controller;

import com.jobportal.jobportal.dto.CompanyRequest;
import com.jobportal.jobportal.dto.JobResponse;
import com.jobportal.jobportal.dto.StatusRequest;
import com.jobportal.jobportal.entity.Application;
import com.jobportal.jobportal.entity.Company;
import com.jobportal.jobportal.entity.Job;
import com.jobportal.jobportal.entity.Resume;
import com.jobportal.jobportal.entity.StudentProfile;
import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.ApplicationRepository;
import com.jobportal.jobportal.repository.CompanyRepository;
import com.jobportal.jobportal.repository.JobRepository;
import com.jobportal.jobportal.repository.ResumeRepository;
import com.jobportal.jobportal.repository.StudentProfileRepository;
import com.jobportal.jobportal.repository.UserRepository;
import com.jobportal.jobportal.security.AuthService;
import com.jobportal.jobportal.service.JobViewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Endpoints for a logged-in company (RECRUITER account). */
@RestController
@RequestMapping("/api/company")
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final ResumeRepository resumeRepository;
    private final AuthService authService;
    private final JobViewService jobViewService;

    public CompanyController(CompanyRepository companyRepository,
                             JobRepository jobRepository,
                             ApplicationRepository applicationRepository,
                             UserRepository userRepository,
                             StudentProfileRepository profileRepository,
                             ResumeRepository resumeRepository,
                             AuthService authService,
                             JobViewService jobViewService) {
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.resumeRepository = resumeRepository;
        this.authService = authService;
        this.jobViewService = jobViewService;
    }

    @GetMapping("/me")
    public Map<String, Object> getCompany(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {
        return toResponse(requireCompany(authorization));
    }

    @PutMapping("/me")
    public Map<String, Object> updateCompany(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @Valid @RequestBody CompanyRequest request) {

        Company company = requireCompany(authorization);
        AuthController.applyCompanyDetails(company, request);
        Map<String, Object> response =
                toResponse(companyRepository.save(company));
        response.put("message", "Company details saved.");
        return response;
    }

    @GetMapping("/jobs")
    public List<JobResponse> myJobs(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        Company company = requireCompany(authorization);
        return jobViewService.toResponses(
                jobRepository.findByCompanyIdOrderByCreatedAtDesc(company.getId()),
                true);
    }

    @PatchMapping("/jobs/{jobId}/status")
    public JobResponse updateJobStatus(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long jobId,
            @Valid @RequestBody StatusRequest request) {

        Company company = requireCompany(authorization);
        Job job = requireOwnJob(company, jobId);
        job.setStatus(parseEnum(Job.JobStatus.class, request.getStatus()));
        return jobViewService.toResponse(jobRepository.save(job), true);
    }

    // Applicants of one of this company's jobs, read fresh from the database
    @GetMapping("/jobs/{jobId}/applications")
    public Map<String, Object> applicants(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long jobId) {

        Company company = requireCompany(authorization);
        Job job = requireOwnJob(company, jobId);

        List<Map<String, Object>> rows = applicantRows(
                applicationRepository.findByJobIdOrderByAppliedAtDesc(jobId),
                Map.of(job.getId(), job.getTitle()));

        Map<String, Object> response = new HashMap<>();
        response.put("job", jobViewService.toResponse(job, true));
        response.put("applications", rows);
        return response;
    }

    // Every applicant across all of this company's jobs, newest first
    @GetMapping("/applications")
    public List<Map<String, Object>> allApplicants(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        Company company = requireCompany(authorization);
        List<Job> jobs = jobRepository
                .findByCompanyIdOrderByCreatedAtDesc(company.getId());
        if (jobs.isEmpty()) {
            return List.of();
        }

        Map<Long, String> jobTitles = jobs.stream()
                .collect(Collectors.toMap(Job::getId, Job::getTitle));
        return applicantRows(
                applicationRepository.findByJobIdInOrderByAppliedAtDesc(
                        jobTitles.keySet()),
                jobTitles);
    }

    // Joins applications with user, profile and resume rows
    private List<Map<String, Object>> applicantRows(
            List<Application> applications, Map<Long, String> jobTitles) {

        Set<Long> userIds = applications.stream()
                .map(Application::getApplicantId).collect(Collectors.toSet());
        Map<Long, User> users = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, StudentProfile> profiles = profileRepository
                .findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(StudentProfile::getUserId,
                        Function.identity()));

        Set<Long> resumeIds = applications.stream()
                .map(Application::getResumeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, Resume> resumes = resumeRepository.findAllById(resumeIds)
                .stream()
                .collect(Collectors.toMap(Resume::getId, Function.identity()));

        return applications.stream().map(a -> {
            User applicant = users.get(a.getApplicantId());
            Map<String, Object> row = ProfileController.profileFields(
                    profiles.get(a.getApplicantId()));
            row.put("applicationId", a.getId());
            row.put("applicantId", a.getApplicantId());
            row.put("jobId", a.getJobId());
            row.put("jobTitle", jobTitles.get(a.getJobId()));
            row.put("fullName", applicant == null ? null : applicant.getFullName());
            row.put("email", applicant == null ? null : applicant.getEmail());
            row.put("coverLetter", a.getCoverLetter());
            row.put("status", a.getStatus().name());
            row.put("appliedAt", a.getAppliedAt());

            Resume resume = a.getResumeId() == null
                    ? null : resumes.get(a.getResumeId());
            row.put("resumeId", resume == null ? null : resume.getId());
            row.put("resumeName", resume == null
                    ? null : resume.getOriginalFilename());
            return row;
        }).toList();
    }

    @PatchMapping("/applications/{applicationId}/status")
    public Map<String, Object> updateApplicationStatus(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long applicationId,
            @Valid @RequestBody StatusRequest request) {

        Company company = requireCompany(authorization);
        Application application = applicationRepository
                .findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Application not found."));
        requireOwnJob(company, application.getJobId());

        Application.ApplicationStatus status = parseEnum(
                Application.ApplicationStatus.class, request.getStatus());
        if (status == Application.ApplicationStatus.WITHDRAWN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only the applicant can withdraw an application.");
        }

        application.setStatus(status);
        applicationRepository.save(application);
        return Map.of(
                "message", "Application status updated.",
                "applicationId", application.getId(),
                "status", status.name());
    }

    private Company requireCompany(String authorization) {
        User recruiter = authService.requireRole(
                authorization, User.Role.RECRUITER);
        return companyRepository.findByRecruiterId(recruiter.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "No company is registered for this account."));
    }

    private Job requireOwnJob(Company company, Long jobId) {
        return jobRepository.findById(jobId)
                .filter(job -> job.getCompanyId().equals(company.getId()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Job not found."));
    }

    static <E extends Enum<E>> E parseEnum(Class<E> type, String value) {
        try {
            return Enum.valueOf(type, value.trim());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status: " + value);
        }
    }

    private static Map<String, Object> toResponse(Company company) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", company.getId());
        response.put("name", company.getName());
        response.put("website", company.getWebsite());
        response.put("industry", company.getIndustry());
        response.put("companySize", company.getCompanySize());
        response.put("description", company.getDescription());
        response.put("headquarters", company.getHeadquarters());
        return response;
    }
}
