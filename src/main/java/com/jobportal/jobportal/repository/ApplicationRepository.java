
package com.jobportal.jobportal.repository;

import com.jobportal.jobportal.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository
        extends JpaRepository<Application, Long> {

    boolean existsByJobIdAndApplicantId(Long jobId, Long applicantId);
}
