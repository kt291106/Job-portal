package com.jobportal.jobportal.repository;

import com.jobportal.jobportal.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ApplicationRepository
        extends JpaRepository<Application, Long> {

    boolean existsByJobIdAndApplicantId(Long jobId, Long applicantId);

    List<Application> findByJobIdOrderByAppliedAtDesc(Long jobId);

    List<Application> findByJobIdInOrderByAppliedAtDesc(Collection<Long> jobIds);

    List<Application> findByApplicantIdOrderByAppliedAtDesc(Long applicantId);

    boolean existsByResumeId(Long resumeId);

    boolean existsByResumeIdAndJobIdIn(Long resumeId, Collection<Long> jobIds);

    // Each row is [jobId, applicationCount]
    @Query("select a.jobId, count(a) from Application a "
            + "where a.jobId in :jobIds group by a.jobId")
    List<Object[]> countByJobIds(@Param("jobIds") Collection<Long> jobIds);
}
