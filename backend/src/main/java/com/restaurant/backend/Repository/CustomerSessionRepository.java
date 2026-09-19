package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.CustomerSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerSessionRepository
        extends JpaRepository<CustomerSession, Long> {

    // Find the currently active session for a table
    Optional<CustomerSession> findByTableIdAndActiveTrue(Long tableId);

    // Find an active session using table + 4-digit customer code
    Optional<CustomerSession> findByTableIdAndSessionCodeAndActiveTrue(
            Long tableId,
            String sessionCode
    );

    // Check whether this session code has EVER been used
    // for this table, including closed/inactive sessions.
    boolean existsByTableIdAndSessionCode(
            Long tableId,
            String sessionCode
    );
}