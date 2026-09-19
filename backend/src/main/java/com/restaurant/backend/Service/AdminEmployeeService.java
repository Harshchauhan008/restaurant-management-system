package com.restaurant.backend.Service;

import com.restaurant.backend.dto.CreateEmployeeRequest;
import com.restaurant.backend.dto.EmployeeResponse;
import com.restaurant.backend.dto.UpdateEmployeeRequest;
import com.restaurant.backend.dto.ResetEmployeePasswordRequest;
import com.restaurant.backend.entity.User;
import com.restaurant.backend.Repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminEmployeeService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminEmployeeService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =====================================================
    // CREATE EMPLOYEE
    // =====================================================

    public EmployeeResponse createEmployee(
            CreateEmployeeRequest request
    ) {

        if (userRepository.existsByEmployeeId(
                request.getEmployeeId()
        )) {
            throw new RuntimeException(
                    "Employee ID already exists"
            );
        }

        if (userRepository.existsByEmail(
                request.getEmail()
        )) {
            throw new RuntimeException(
                    "Email already exists"
            );
        }

        User user = new User();

        user.setEmployeeId(request.getEmployeeId());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        // Password is stored as a one-way encoded value
        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setRole(request.getRole());
        user.setActive(true);

        // New employee starts with version 0
        user.setCredentialsVersion(0L);

        User savedUser = userRepository.save(user);

        return toResponse(savedUser);
    }


    // =====================================================
    // GET ALL EMPLOYEES
    // =====================================================

    public List<EmployeeResponse> getAllEmployees() {

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =====================================================
    // UPDATE EMPLOYEE
    // =====================================================

    public EmployeeResponse updateEmployee(
            Long id,
            UpdateEmployeeRequest request
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found"
                        )
                );

        boolean credentialsChanged = false;


        // -------------------------------------------------
        // UPDATE EMPLOYEE ID
        // -------------------------------------------------

        if (request.getEmployeeId() != null
                && !request.getEmployeeId()
                        .equals(user.getEmployeeId())) {

            if (userRepository.existsByEmployeeId(
                    request.getEmployeeId()
            )) {

                throw new RuntimeException(
                        "Employee ID already exists"
                );
            }

            user.setEmployeeId(
                    request.getEmployeeId()
            );

            credentialsChanged = true;
        }


        // -------------------------------------------------
        // UPDATE FULL NAME
        // -------------------------------------------------

        if (request.getFullName() != null) {

            user.setFullName(
                    request.getFullName()
            );
        }


        // -------------------------------------------------
        // UPDATE EMAIL
        // -------------------------------------------------

        if (request.getEmail() != null
                && !request.getEmail()
                        .equals(user.getEmail())) {

            if (userRepository.existsByEmail(
                    request.getEmail()
            )) {

                throw new RuntimeException(
                        "Email already exists"
                );
            }

            user.setEmail(
                    request.getEmail()
            );
        }


        // -------------------------------------------------
        // UPDATE ROLE
        // -------------------------------------------------

        if (request.getRole() != null) {

            user.setRole(
                    request.getRole()
            );
        }


        // -------------------------------------------------
        // UPDATE ACTIVE STATUS
        // -------------------------------------------------

        if (request.getActive() != null) {

            boolean newActiveStatus =
                    request.getActive();

            if (user.isActive() != newActiveStatus) {

                user.setActive(
                        newActiveStatus
                );

                credentialsChanged = true;
            }
        }


        // -------------------------------------------------
        // INVALIDATE OLD JWT TOKENS
        // -------------------------------------------------

        if (credentialsChanged) {

            user.incrementCredentialsVersion();
        }


        User updatedUser =
                userRepository.save(user);

        return toResponse(updatedUser);
    }


    // =====================================================
    // RESET EMPLOYEE PASSWORD
    // =====================================================

    public void resetEmployeePassword(
            Long id,
            ResetEmployeePasswordRequest request
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found"
                        )
                );

        if (request.getNewPassword() == null
                || request.getNewPassword().isBlank()) {

            throw new RuntimeException(
                    "New password cannot be empty"
            );
        }


        // -------------------------------------------------
        // ENCODE NEW PASSWORD
        // -------------------------------------------------

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );


        // -------------------------------------------------
        // INVALIDATE OLD JWT TOKENS
        // -------------------------------------------------

        user.incrementCredentialsVersion();


        userRepository.save(user);
    }


    // =====================================================
    // DISABLE EMPLOYEE
    // =====================================================

    public void disableEmployee(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found"
                        )
                );

        if (user.isActive()) {

            user.setActive(false);

            // Invalidate old JWT tokens
            user.incrementCredentialsVersion();

            userRepository.save(user);
        }
    }


    // =====================================================
    // RESPONSE MAPPER
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