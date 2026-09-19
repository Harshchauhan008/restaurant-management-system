package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.PasswordResetService;
import com.restaurant.backend.dto.ForgotPasswordRequest;
import com.restaurant.backend.dto.ResetPasswordRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService
    ) {
        this.passwordResetService = passwordResetService;
    }

    // =====================================================
    // FORGOT PASSWORD
    // =====================================================

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @RequestBody ForgotPasswordRequest request
    ) {

        passwordResetService.forgotPassword(request);

        /*
         * Always return the same response.
         *
         * We don't tell the user whether the email
         * actually exists in the database.
         */
        return ResponseEntity.ok(
                "If the email is registered, a password reset link has been sent."
        );
    }

    // =====================================================
    // RESET PASSWORD
    // =====================================================

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestBody ResetPasswordRequest request
    ) {

        passwordResetService.resetPassword(request);

        return ResponseEntity.ok(
                "Password reset successfully. Please login with your new password."
        );
    }
}