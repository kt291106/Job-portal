package com.jobportal.jobportal.service;

import com.jobportal.jobportal.dto.JobResponse;
import com.jobportal.jobportal.entity.Company;
import com.jobportal.jobportal.entity.Job;
import com.jobportal.jobportal.repository.ApplicationRepository;
import com.jobportal.jobportal.repository.CompanyRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Builds job responses with company names and applicant counts. */
@Service
public class JobViewService {

    private final CompanyRepository companyRepository;
    private final ApplicationRepository applicationRepository;

    public JobViewService(CompanyRepository companyRepository,
                          ApplicationRepository applicationRepository) {
        this.companyRepository = companyRepository;
        this.applicationRepository = applicationRepository;
    }

    public List<JobResponse> toResponses(List<Job> jobs,
                                         boolean includeApplicantCount) {
        if (jobs.isEmpty()) {
            return List.of();
        }

        Set<Long> companyIds = jobs.stream()
                .map(Job::getCompanyId)
                .collect(Collectors.toSet());

        Map<Long, String> companyNames = companyRepository
                .findAllById(companyIds).stream()
                .collect(Collectors.toMap(Company::getId, Company::getName));

        Map<Long, Long> counts = new HashMap<>();
        if (includeApplicantCount) {
            List<Long> jobIds = jobs.stream().map(Job::getId).toList();
            for (Object[] row : applicationRepository.countByJobIds(jobIds)) {
                counts.put((Long) row[0], (Long) row[1]);
            }
        }

        return jobs.stream()
                .map(job -> JobResponse.from(
                        job,
                        companyNames.get(job.getCompanyId()),
                        includeApplicantCount
                                ? counts.getOrDefault(job.getId(), 0L)
                                : null))
                .toList();
    }

    public JobResponse toResponse(Job job, boolean includeApplicantCount) {
        return toResponses(List.of(job), includeApplicantCount).get(0);
    }
}
