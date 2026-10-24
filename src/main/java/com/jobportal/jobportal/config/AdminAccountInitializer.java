package com.jobportal.jobportal.config;

import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/** Creates the admin account from application.properties if it is missing. */
@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public AdminAccountInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String adminEmail,
            @Value("${app.admin.password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail.isEmpty() || adminPassword.isEmpty()
                || userRepository.existsByEmail(adminEmail)) {
            return;
        }

        User admin = new User();
        admin.setFullName("Administrator");
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole(User.Role.ADMIN);
        admin.setIsActive(true);
        userRepository.save(admin);

        log.info("Created admin account {}", adminEmail);
    }
}
