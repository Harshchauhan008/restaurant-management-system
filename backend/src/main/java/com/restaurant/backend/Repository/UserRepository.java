package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.Role;
import com.restaurant.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmployeeId(
            String employeeId
    );

    Optional<User> findByEmail(
            String email
    );

    boolean existsByEmployeeId(
            String employeeId
    );

    boolean existsByEmail(
            String email
    );

    List<User> findByRoleAndActiveTrue(
            Role role
    );
}