package com.restaurant.backend.Config;

import com.restaurant.backend.entity.Role;
import com.restaurant.backend.entity.User;
import com.restaurant.backend.Repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner createAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            /*
             * Check whether an ADMIN account already exists.
             *
             * We do NOT use a hard-coded employee ID here
             * because the ADMIN ID can be changed from the
             * Admin Profile.
             */
            boolean adminExists =
                    userRepository.findAll()
                            .stream()
                            .anyMatch(user ->
                                    user.getRole() == Role.ADMIN
                            );

            if (!adminExists) {

                User admin = new User();

                admin.setEmployeeId("ADMIN");
                admin.setFullName("System Administrator");
                admin.setEmail("admin@restaurant.com");

                admin.setPassword(
                        passwordEncoder.encode("Admin@123")
                );

                admin.setRole(Role.ADMIN);
                admin.setActive(true);
                admin.setCredentialsVersion(0L);

                userRepository.save(admin);

                System.out.println(
                        "Default ADMIN account created"
                );

            } else {

                System.out.println(
                        "ADMIN account already exists. Skipping creation."
                );
            }
        };
    }
}