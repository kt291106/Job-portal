
package com.jobportal.jobportal.controller;

import com.jobportal.jobportal.entity.Application;
import com.jobportal.jobportal.repository.ApplicationRepository;
import com.jobportal.jobportal.repository.JobRepository;
import com.jobportal.jobportal.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = {
        "http://localhost:5500",
        "http://127.0.0.1:5500"
})
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public ApplicationController(
            ApplicationRepository applicationRepository,
            JobRepository jobRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> submitApplication(
            @RequestBody Application application) {

        if (application.getJobId() == null ||
                application.getApplicantId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            "Job ID and applicant ID are required."));
        }

        if (!jobRepository.existsById(application.getJobId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Job not found."));
        }

        if (!userRepository.existsById(application.getApplicantId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found."));
        }

        if (applicationRepository.existsByJobIdAndApplicantId(
                application.getJobId(),
                application.getApplicantId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message",
                            "You have already applied for this job."));
        }

        application.setId(null);
        application.setStatus(
                Application.ApplicationStatus.APPLIED);
        application.setResumeId(null);

        Application saved = applicationRepository.save(application);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Application submitted successfully!",
                        "applicationId", saved.getId(),
                        "status", saved.getStatus().name()));
    }
}
