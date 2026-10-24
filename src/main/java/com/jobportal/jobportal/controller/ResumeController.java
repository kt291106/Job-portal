package com.jobportal.jobportal.controller;

import com.jobportal.jobportal.entity.Company;
import com.jobportal.jobportal.entity.Job;
import com.jobportal.jobportal.entity.Resume;
import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.ApplicationRepository;
import com.jobportal.jobportal.repository.CompanyRepository;
import com.jobportal.jobportal.repository.JobRepository;
import com.jobportal.jobportal.repository.ResumeRepository;
import com.jobportal.jobportal.security.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final int MAX_RESUMES_PER_USER = 5;

    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "pdf", "application/pdf",
            "doc", "application/msword",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final AuthService authService;
    private final Path uploadDir;

    public ResumeController(ResumeRepository resumeRepository,
                            ApplicationRepository applicationRepository,
                            CompanyRepository companyRepository,
                            JobRepository jobRepository,
                            AuthService authService,
                            @Value("${app.upload.dir:uploads/resumes}")
                            String uploadDir) {
        this.resumeRepository = resumeRepository;
        this.applicationRepository = applicationRepository;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.authService = authService;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @GetMapping
    public List<Map<String, Object>> myResumes(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        User user = authService.requireRole(authorization, User.Role.STUDENT);
        return resumeRepository.findByUserIdOrderByUploadedAtDesc(user.getId())
                .stream()
                .map(ResumeController::toResponse)
                .toList();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> upload(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @RequestParam("file") MultipartFile file) throws IOException {

        User user = authService.requireRole(authorization, User.Role.STUDENT);

        if (file.isEmpty()) {
            throw badRequest("Please choose a resume file.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw badRequest("File is too large. Maximum size is 5 MB.");
        }

        String originalName = Paths.get(
                file.getOriginalFilename() == null ? "" : file.getOriginalFilename())
                .getFileName().toString().trim();
        String extension = extensionOf(originalName);

        if (originalName.isEmpty() || originalName.length() > 255
                || !ALLOWED_TYPES.containsKey(extension)) {
            throw badRequest("Only PDF, DOC or DOCX files are allowed.");
        }
        if (!hasExpectedSignature(file, extension)) {
            throw badRequest("The file content does not match its type. "
                    + "Please upload a real PDF, DOC or DOCX file.");
        }

        long existing = resumeRepository.countByUserId(user.getId());
        if (existing >= MAX_RESUMES_PER_USER) {
            throw badRequest("You can keep at most " + MAX_RESUMES_PER_USER
                    + " resumes. Delete one before uploading another.");
        }

        Files.createDirectories(uploadDir);
        String storageKey = UUID.randomUUID() + "." + extension;
        Path target = uploadDir.resolve(storageKey);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        Resume resume = new Resume();
        resume.setUserId(user.getId());
        resume.setOriginalFilename(originalName);
        resume.setStorageKey(storageKey);
        resume.setFileType(ALLOWED_TYPES.get(extension));
        resume.setFileSizeBytes(file.getSize());
        resume.setIsDefault(existing == 0);

        try {
            return toResponse(resumeRepository.save(resume));
        } catch (RuntimeException ex) {
            Files.deleteIfExists(target);
            throw ex;
        }
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long id) throws IOException {

        User user = authService.requireRole(authorization, User.Role.STUDENT);
        Resume resume = resumeRepository.findById(id)
                .filter(r -> r.getUserId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Resume not found."));

        if (applicationRepository.existsByResumeId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This resume is attached to an application and cannot be deleted.");
        }

        resumeRepository.delete(resume);
        Path file = storedFile(resume);
        if (file != null) {
            Files.deleteIfExists(file);
        }
        return Map.of("message", "Resume deleted.");
    }

    // Owner, admin, or a company that received an application with it
    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> download(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long id) {

        User user = authService.requireUser(authorization);
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Resume not found."));

        if (!canView(user, resume)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have access to this resume.");
        }

        Path file = storedFile(resume);
        if (file == null || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "The resume file is not available on the server.");
        }

        MediaType type = resume.getFileType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(resume.getFileType());

        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(resume.getOriginalFilename(),
                                        StandardCharsets.UTF_8)
                                .build().toString())
                .body(new PathResource(file));
    }

    private boolean canView(User user, Resume resume) {
        if (user.getRole() == User.Role.ADMIN
                || resume.getUserId().equals(user.getId())) {
            return true;
        }
        if (user.getRole() != User.Role.RECRUITER) {
            return false;
        }

        Company company = companyRepository.findByRecruiterId(user.getId())
                .orElse(null);
        if (company == null) {
            return false;
        }

        List<Long> jobIds = jobRepository
                .findByCompanyIdOrderByCreatedAtDesc(company.getId())
                .stream().map(Job::getId).toList();

        return !jobIds.isEmpty() && applicationRepository
                .existsByResumeIdAndJobIdIn(resume.getId(), jobIds);
    }

    // Resolves the stored file, refusing keys that escape the upload folder
    private Path storedFile(Resume resume) {
        Path file = uploadDir.resolve(resume.getStorageKey()).normalize();
        return file.startsWith(uploadDir) ? file : null;
    }

    private static boolean hasExpectedSignature(MultipartFile file,
                                                String extension)
            throws IOException {
        byte[] header = new byte[4];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(header, 0, 4);
        }
        if (read < 4) {
            return false;
        }
        return switch (extension) {
            case "pdf" -> header[0] == '%' && header[1] == 'P'
                    && header[2] == 'D' && header[3] == 'F';
            case "docx" -> header[0] == 'P' && header[1] == 'K';
            case "doc" -> (header[0] & 0xFF) == 0xD0
                    && (header[1] & 0xFF) == 0xCF;
            default -> false;
        };
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "" : filename.substring(dot + 1)
                .toLowerCase(Locale.ROOT);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    static Map<String, Object> toResponse(Resume resume) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", resume.getId());
        response.put("originalFilename", resume.getOriginalFilename());
        response.put("fileType", resume.getFileType());
        response.put("fileSizeBytes", resume.getFileSizeBytes());
        response.put("isDefault", resume.getIsDefault());
        response.put("uploadedAt", resume.getUploadedAt());
        return response;
    }
}
