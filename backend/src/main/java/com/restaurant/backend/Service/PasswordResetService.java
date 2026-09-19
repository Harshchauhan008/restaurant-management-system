package com.restaurant.backend.Service;

import com.restaurant.backend.Repository.PasswordResetTokenRepository;
import com.restaurant.backend.Repository.UserRepository;
import com.restaurant.backend.dto.ForgotPasswordRequest;
import com.restaurant.backend.dto.ResetPasswordRequest;
import com.restaurant.backend.entity.PasswordResetToken;
import com.restaurant.backend.entity.Role;
import com.restaurant.backend.entity.User;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /*
     * =====================================================
     * FORGOT PASSWORD
     * =====================================================
     */

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {

        /*
         * Always return the same result to the caller,
         * whether the email exists or not.
         *
         * This prevents account/email enumeration.
         */
        if (request == null ||
                request.getEmail() == null ||
                request.getEmail().isBlank()) {
            return;
        }

        String email = request.getEmail().trim();

        User user = userRepository.findByEmail(email)
                .orElse(null);

        /*
         * We currently support forgot-password
         * for ADMIN accounts.
         */
        if (user == null || user.getRole() != Role.ADMIN) {
            return;
        }

        /*
         * Remove any previous reset tokens.
         */
        tokenRepository.deleteByUserId(user.getId());

        /*
         * Generate a cryptographically secure random token.
         */
        String rawToken = generateSecureToken();

        /*
         * Store only the SHA-256 hash in the database.
         */
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken =
                new PasswordResetToken();

        resetToken.setTokenHash(tokenHash);
        resetToken.setUser(user);

        /*
         * Token is valid for 15 minutes.
         */
        resetToken.setExpiresAt(
                LocalDateTime.now().plusMinutes(15)
        );

        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        /*
         * Send the actual token only through email.
         */
        String resetLink =
                frontendUrl +
                "/reset-password?token=" +
                rawToken;

        emailService.sendAdminPasswordResetEmail(
                user,
                resetLink
        );
    }

    /*
     * =====================================================
     * RESET PASSWORD
     * =====================================================
     */

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        if (request == null ||
                request.getToken() == null ||
                request.getToken().isBlank()) {

            throw new RuntimeException(
                    "Invalid or expired password reset link"
            );
        }

        if (request.getNewPassword() == null ||
                request.getNewPassword().isBlank()) {

            throw new RuntimeException(
                    "New password cannot be empty"
            );
        }

        /*
         * Hash the token received from the frontend.
         */
        String tokenHash =
                hashToken(request.getToken());

        PasswordResetToken resetToken =
                tokenRepository.findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Invalid or expired password reset link"
                                )
                        );

        /*
         * Token can only be used once.
         */
        if (resetToken.isUsed()) {
            throw new RuntimeException(
                    "This password reset link has already been used"
            );
        }

        /*
         * Check expiration.
         */
        if (resetToken.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            throw new RuntimeException(
                    "This password reset link has expired"
            );
        }

        User user = resetToken.getUser();

        /*
         * Only ADMIN accounts are allowed in this flow.
         */
        if (user == null ||
                user.getRole() != Role.ADMIN) {

            throw new RuntimeException(
                    "Invalid password reset request"
            );
        }

        /*
         * Account must still be active.
         */
        if (!user.isActive()) {
            throw new RuntimeException(
                    "Admin account is disabled"
            );
        }

        /*
         * Encode the new password.
         */
        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        /*
         * This invalidates all previously issued JWTs.
         */
        user.incrementCredentialsVersion();

        userRepository.save(user);

        /*
         * Mark the token as used.
         */
        resetToken.setUsed(true);

        tokenRepository.save(resetToken);
    }

    /*
     * =====================================================
     * SECURE TOKEN GENERATION
     * =====================================================
     */

    private String generateSecureToken() {

        byte[] bytes = new byte[32];

        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    /*
     * =====================================================
     * TOKEN HASHING
     * =====================================================
     */

    private String hashToken(String token) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash =
                    digest.digest(
                            token.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            return Base64.getEncoder()
                    .encodeToString(hash);

        } catch (NoSuchAlgorithmException e) {

            throw new IllegalStateException(
                    "SHA-256 algorithm is not available",
                    e
            );
        }
    }
}