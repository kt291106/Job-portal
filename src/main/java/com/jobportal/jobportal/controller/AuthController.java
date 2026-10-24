
package com.jobportal.jobportal.controller;

import com.jobportal.jobportal.dto.CompanyRequest;
import com.jobportal.jobportal.dto.LoginRequest;
import com.jobportal.jobportal.dto.SignupRequest;
import com.jobportal.jobportal.dto.Text;
import com.jobportal.jobportal.entity.Company;
import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.CompanyRepository;
import com.jobportal.jobportal.repository.UserRepository;
import com.jobportal.jobportal.security.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public AuthController(
            UserRepository userRepository,
            CompanyRepository companyRepository,
            PasswordEncoder passwordEncoder,
            AuthService authService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @PostMapping("/signup")
    @Transactional
    public Map<String, String> signup(
            @Valid @RequestBody SignupRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        boolean isCompany = "COMPANY".equals(request.getAccountType());

        if (isCompany && request.getCompany() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Company details are required for a company account");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword()));
        user.setRole(isCompany ? User.Role.RECRUITER : User.Role.STUDENT);
        user.setIsActive(true);

        user = userRepository.save(user);

        if (isCompany) {
            Company company = new Company();
            company.setRecruiterId(user.getId());
            applyCompanyDetails(company, request.getCompany());
            companyRepository.save(company);
        }

        return Map.of(
                "message", "Account created successfully",
                "email", email);
    }

    @PostMapping("/login")
    public Map<String, Object> login(
            @Valid @RequestBody LoginRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"));

        if (!Boolean.TRUE.equals(user.getIsActive())
                || !passwordMatches(request.getPassword(),
                        user.getPasswordHash())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password");
        }

        Map<String, Object> response = userDetails(user);
        response.put("message", "Login successful");
        response.put("token", authService.createToken(user.getId()));
        return response;
    }

    @GetMapping("/me")
    public Map<String, Object> me(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {
        return userDetails(authService.requireUser(authorization));
    }

    @PostMapping("/logout")
    public Map<String, String> logout(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {
        authService.revoke(authorization);
        return Map.of("message", "Logged out");
    }

    private Map<String, Object> userDetails(User user) {
        Map<String, Object> details = new HashMap<>();
        details.put("id", user.getId());
        details.put("fullName", user.getFullName());
        details.put("email", user.getEmail());
        details.put("role", user.getRole().name());

        if (user.getRole() == User.Role.RECRUITER) {
            Optional<Company> company =
                    companyRepository.findByRecruiterId(user.getId());
            company.ifPresent(c -> {
                details.put("companyId", c.getId());
                details.put("companyName", c.getName());
            });
        }

        return details;
    }

    // Seed rows may hold placeholder hashes that are not BCrypt
    private boolean passwordMatches(String raw, String hash) {
        try {
            return passwordEncoder.matches(raw, hash);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    static void applyCompanyDetails(Company company, CompanyRequest details) {
        company.setName(details.getName().trim());
        company.setWebsite(Text.clean(details.getWebsite()));
        company.setIndustry(Text.clean(details.getIndustry()));
        company.setCompanySize(Text.clean(details.getCompanySize()));
        company.setDescription(Text.clean(details.getDescription()));
        company.setHeadquarters(Text.clean(details.getHeadquarters()));
    }
}
