package com.jobportal.jobportal.security;

import com.jobportal.jobportal.entity.User;
import com.jobportal.jobportal.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Issues random login tokens and resolves the user behind a request.
 * Tokens live in memory, so users must log in again after a server restart.
 */
@Service
public class AuthService {

    private static final Duration TOKEN_LIFETIME = Duration.ofHours(8);

    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    private record Session(Long userId, Instant expiresAt) {
    }

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String createToken(Long userId) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(bytes);
        sessions.put(token, new Session(userId,
                Instant.now().plus(TOKEN_LIFETIME)));
        return token;
    }

    public void revoke(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        if (token != null) {
            sessions.remove(token);
        }
    }

    /** Returns the logged-in, active user or throws 401. */
    public User requireUser(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        Session session = token == null ? null : sessions.get(token);

        if (session == null || session.expiresAt().isBefore(Instant.now())) {
            if (token != null) {
                sessions.remove(token);
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Please log in to continue.");
        }

        User user = userRepository.findById(session.userId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Please log in to continue."));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            sessions.remove(token);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Your account has been deactivated.");
        }

        return user;
    }

    /** Returns the logged-in user if they have the given role, else 401/403. */
    public User requireRole(String authorizationHeader, User.Role role) {
        User user = requireUser(authorizationHeader);

        if (user.getRole() != role) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This action is not allowed for your account type.");
        }

        return user;
    }

    private static String extractToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        String token = header.substring(7).trim();
        return token.isEmpty() ? null : token;
    }
}
