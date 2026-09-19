package com.restaurant.backend.Service;

import com.restaurant.backend.dto.LoginRequest;
import com.restaurant.backend.dto.LoginResponse;
import com.restaurant.backend.entity.User;
import com.restaurant.backend.Repository.UserRepository;
import com.restaurant.backend.Security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid employee ID or password"
                        )
                );

        if (!user.isActive()) {
            throw new RuntimeException(
                    "This employee account is disabled"
            );
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            throw new RuntimeException(
                    "Invalid employee ID or password"
            );
        }

       String token = jwtService.generateToken(
                user.getEmployeeId(),
                user.getRole().name(),
                user.getCredentialsVersion()
        );

        return new LoginResponse(
                "Login successful",
                token,
                user.getEmployeeId(),
                user.getFullName(),
                user.getRole().name()
        );
    }
}