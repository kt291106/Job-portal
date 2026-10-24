package com.jobportal.jobportal.repository;

import com.jobportal.jobportal.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByStatusOrderByCreatedAtDesc(Job.JobStatus status);

    List<Job> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    List<Job> findAllByOrderByCreatedAtDesc();
}
