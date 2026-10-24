package com.jobportal.jobportal.repository;

import com.jobportal.jobportal.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    List<Resume> findByUserIdOrderByUploadedAtDesc(Long userId);

    long countByUserId(Long userId);
}
