package com.restaurant.backend.Service;

import com.restaurant.backend.Repository.UserRepository;
import com.restaurant.backend.dto.ChangeAdminPasswordRequest;
import com.restaurant.backend.dto.EmployeeResponse;
import com.restaurant.backend.dto.UpdateAdminProfileRequest;
import com.restaurant.backend.entity.Role;
import com.restaurant.backend.entity.User;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminProfileService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =====================================================
    // GET CURRENT ADMIN PROFILE
    // =====================================================

    public EmployeeResponse getProfile(String employeeId) {

        User admin = getCurrentAdmin(employeeId);

        return toResponse(admin);
    }


    // =====================================================
    // UPDATE ADMIN PROFILE
    // =====================================================

    public EmployeeResponse updateProfile(
            String currentEmployeeId,
            UpdateAdminProfileRequest request
    ) {

        User admin = getCurrentAdmin(currentEmployeeId);

        boolean credentialsChanged = false;


        // -------------------------------------------------
        // EMPLOYEE ID
        // -------------------------------------------------

        if (request.getEmployeeId() != null
                && !request.getEmployeeId().isBlank()
                && !request.getEmployeeId()
                        .equals(admin.getEmployeeId())) {

            if (userRepository.existsByEmployeeId(
                    request.getEmployeeId()
            )) {

                throw new RuntimeException(
                        "Employee ID already exists"
                );
            }

            admin.setEmployeeId(
                    request.getEmployeeId()
            );

            credentialsChanged = true;
        }


        // -------------------------------------------------
        // FULL NAME
        // -------------------------------------------------

        if (request.getFullName() != null
                && !request.getFullName().isBlank()) {

            admin.setFullName(
                    request.getFullName()
            );
        }


        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        if (request.getEmail() != null
                && !request.getEmail().isBlank()
                && !request.getEmail()
                        .equals(admin.getEmail())) {

            if (userRepository.existsByEmail(
                    request.getEmail()
            )) {

                throw new RuntimeException(
                        "Email already exists"
                );
            }

            admin.setEmail(
                    request.getEmail()
            );
        }


        // -------------------------------------------------
        // INVALIDATE OLD JWT
        // -------------------------------------------------

        if (credentialsChanged) {

            admin.incrementCredentialsVersion();
        }


        User updatedAdmin =
                userRepository.save(admin);

        return toResponse(updatedAdmin);
    }


    // =====================================================
    // CHANGE ADMIN PASSWORD
    // =====================================================

    public void changePassword(
            String employeeId,
            ChangeAdminPasswordRequest request
    ) {

        User admin = getCurrentAdmin(employeeId);


        // -------------------------------------------------
        // VALIDATE CURRENT PASSWORD
        // -------------------------------------------------

        if (request.getCurrentPassword() == null
                || request.getCurrentPassword().isBlank()) {

            throw new RuntimeException(
                    "Current password is required"
            );
        }


        // -------------------------------------------------
        // VALIDATE NEW PASSWORD
        // -------------------------------------------------

        if (request.getNewPassword() == null
                || request.getNewPassword().isBlank()) {

            throw new RuntimeException(
                    "New password cannot be empty"
            );
        }


        // -------------------------------------------------
        // CHECK CURRENT PASSWORD
        // -------------------------------------------------

        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                admin.getPassword()
        )) {

            throw new RuntimeException(
                    "Current password is incorrect"
            );
        }


        // -------------------------------------------------
        // ENCODE NEW PASSWORD
        // -------------------------------------------------

        admin.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );


        // -------------------------------------------------
        // INVALIDATE OLD JWT
        // -------------------------------------------------

        admin.incrementCredentialsVersion();

        userRepository.save(admin);
    }


    // =====================================================
    // GET CURRENT ADMIN
    // =====================================================

    private User getCurrentAdmin(
            String employeeId
    ) {

        User admin = userRepository
                .findByEmployeeId(employeeId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Admin account not found"
                        )
                );

        if (admin.getRole() != Role.ADMIN) {

            throw new RuntimeException(
                    "Access denied"
            );
        }

        if (!admin.isActive()) {

            throw new RuntimeException(
                    "Admin account is disabled"
            );
        }

        return admin;
    }


    // =====================================================
    // RESPONSE
    // =====================================================

    private EmployeeResponse toResponse(User user) {

        return new EmployeeResponse(
                user.getId(),
                user.getEmployeeId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                user.isActive()
        );
    }
}