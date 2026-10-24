package com.jobportal.jobportal.controller;

import com.jobportal.jobportal.dto.JobResponse;
import com.jobportal.jobportal.dto.StatusRequest;
import com.jobportal.jobportal.entity.Company;
import com.jobportal.jobportal.entity.Job;
import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.ApplicationRepository;
import com.jobportal.jobportal.repository.CompanyRepository;
import com.jobportal.jobportal.repository.JobRepository;
import com.jobportal.jobportal.repository.UserRepository;
import com.jobportal.jobportal.security.AuthService;
import com.jobportal.jobportal.service.JobViewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final AuthService authService;
    private final JobViewService jobViewService;

    public AdminController(UserRepository userRepository,
                           CompanyRepository companyRepository,
                           JobRepository jobRepository,
                           ApplicationRepository applicationRepository,
                           AuthService authService,
                           JobViewService jobViewService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.authService = authService;
        this.jobViewService = jobViewService;
    }

    @GetMapping("/stats")
    public Map<String, Long> stats(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        requireAdmin(authorization);
        Map<String, Long> stats = new HashMap<>();
        stats.put("students", userRepository.countByRole(User.Role.STUDENT));
        stats.put("recruiters", userRepository.countByRole(User.Role.RECRUITER));
        stats.put("companies", companyRepository.count());
        stats.put("jobs", jobRepository.count());
        stats.put("applications", applicationRepository.count());
        return stats;
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        requireAdmin(authorization);
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream().map(user -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", user.getId());
                    row.put("fullName", user.getFullName());
                    row.put("email", user.getEmail());
                    row.put("role", user.getRole().name());
                    row.put("isActive", user.getIsActive());
                    row.put("createdAt", user.getCreatedAt());
                    return row;
                }).toList();
    }

    @PatchMapping("/users/{id}/active")
    public Map<String, Object> setUserActive(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {

        User admin = requireAdmin(authorization);
        Boolean active = body.get("active");
        if (active == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Field 'active' is required.");
        }
        if (admin.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You cannot change your own account status.");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found."));
        user.setIsActive(active);
        userRepository.save(user);

        return Map.of(
                "message", active ? "User activated." : "User deactivated.",
                "id", id,
                "isActive", active);
    }

    @GetMapping("/companies")
    public List<Map<String, Object>> companies(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        requireAdmin(authorization);
        List<Company> companies = companyRepository.findAll(
                Sort.by(Sort.Direction.DESC, "id"));
        Map<Long, User> recruiters = userRepository.findAllById(
                        companies.stream().map(Company::getRecruiterId).toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Long> jobCounts = jobRepository.findAll().stream()
                .collect(Collectors.groupingBy(Job::getCompanyId,
                        Collectors.counting()));

        return companies.stream().map(company -> {
            User recruiter = recruiters.get(company.getRecruiterId());
            Map<String, Object> row = new HashMap<>();
            row.put("id", company.getId());
            row.put("name", company.getName());
            row.put("industry", company.getIndustry());
            row.put("headquarters", company.getHeadquarters());
            row.put("website", company.getWebsite());
            row.put("recruiterName", recruiter == null ? null : recruiter.getFullName());
            row.put("recruiterEmail", recruiter == null ? null : recruiter.getEmail());
            row.put("jobCount", jobCounts.getOrDefault(company.getId(), 0L));
            return row;
        }).toList();
    }

    @GetMapping("/jobs")
    public List<JobResponse> jobs(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        requireAdmin(authorization);
        return jobViewService.toResponses(
                jobRepository.findAllByOrderByCreatedAtDesc(), true);
    }

    @PatchMapping("/jobs/{id}/status")
    public JobResponse updateJobStatus(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long id,
            @Valid @RequestBody StatusRequest request) {

        requireAdmin(authorization);
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Job not found."));
        job.setStatus(CompanyController.parseEnum(
                Job.JobStatus.class, request.getStatus()));
        return jobViewService.toResponse(jobRepository.save(job), true);
    }

    private User requireAdmin(String authorization) {
        return authService.requireRole(authorization, User.Role.ADMIN);
    }
}
