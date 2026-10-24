package com.jobportal.jobportal.controller;

import com.jobportal.jobportal.dto.ProfileRequest;
import com.jobportal.jobportal.dto.Text;
import com.jobportal.jobportal.entity.StudentProfile;
import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.StudentProfileRepository;
import com.jobportal.jobportal.security.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final StudentProfileRepository profileRepository;
    private final AuthService authService;

    public ProfileController(StudentProfileRepository profileRepository,
                             AuthService authService) {
        this.profileRepository = profileRepository;
        this.authService = authService;
    }

    @GetMapping
    public Map<String, Object> getProfile(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        User user = authService.requireRole(authorization, User.Role.STUDENT);
        StudentProfile profile = profileRepository
                .findByUserId(user.getId())
                .orElse(null);

        return toResponse(user, profile);
    }

    @PutMapping
    public Map<String, Object> saveProfile(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @Valid @RequestBody ProfileRequest request) {

        User user = authService.requireRole(authorization, User.Role.STUDENT);
        StudentProfile profile = profileRepository
                .findByUserId(user.getId())
                .orElseGet(() -> {
                    StudentProfile created = new StudentProfile();
                    created.setUserId(user.getId());
                    return created;
                });

        profile.setPhone(request.getPhone().trim());
        profile.setCollegeName(request.getCollegeName().trim());
        profile.setDegree(request.getDegree().trim());
        profile.setBranch(request.getBranch().trim());
        profile.setGraduationYear(request.getGraduationYear().shortValue());
        profile.setCgpa(request.getCgpa());
        profile.setSkills(request.getSkills().trim());
        profile.setLinkedinUrl(Text.clean(request.getLinkedinUrl()));
        profile.setGithubUrl(Text.clean(request.getGithubUrl()));

        Map<String, Object> response =
                toResponse(user, profileRepository.save(profile));
        response.put("message", "Profile saved successfully.");
        return response;
    }

    static Map<String, Object> profileFields(StudentProfile profile) {
        Map<String, Object> fields = new HashMap<>();
        fields.put("phone", profile == null ? null : profile.getPhone());
        fields.put("collegeName", profile == null ? null : profile.getCollegeName());
        fields.put("degree", profile == null ? null : profile.getDegree());
        fields.put("branch", profile == null ? null : profile.getBranch());
        fields.put("graduationYear", profile == null ? null : profile.getGraduationYear());
        fields.put("cgpa", profile == null ? null : profile.getCgpa());
        fields.put("skills", profile == null ? null : profile.getSkills());
        fields.put("linkedinUrl", profile == null ? null : profile.getLinkedinUrl());
        fields.put("githubUrl", profile == null ? null : profile.getGithubUrl());
        return fields;
    }

    private static Map<String, Object> toResponse(User user,
                                                  StudentProfile profile) {
        Map<String, Object> response = profileFields(profile);
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("complete", profile != null && profile.isComplete());
        return response;
    }
}
