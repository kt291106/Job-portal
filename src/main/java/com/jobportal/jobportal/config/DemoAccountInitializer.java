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

/**
 * The seed SQL stores placeholder hashes ("DEMO_ONLY_...") that can never
 * match a password. This gives those demo accounts the password from
 * app.demo.password so they can log in. Real accounts are never touched.
 */
@Component
public class DemoAccountInitializer implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(DemoAccountInitializer.class);
    private static final String PLACEHOLDER_PREFIX = "DEMO_ONLY";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String demoPassword;

    public DemoAccountInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.demo.password:}") String demoPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.demoPassword = demoPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (demoPassword.isEmpty()) {
            return;
        }

        for (User user : userRepository.findAll()) {
            if (user.getPasswordHash() != null
                    && user.getPasswordHash().startsWith(PLACEHOLDER_PREFIX)) {
                user.setPasswordHash(passwordEncoder.encode(demoPassword));
                userRepository.save(user);
                log.info("Set demo password for {}", user.getEmail());
            }
        }
    }
}
