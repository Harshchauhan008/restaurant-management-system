package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.AuditAction;
import com.restaurant.backend.entity.AuditLog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    List<AuditLog>
    findAllByOrderByCreatedAtDesc();

    List<AuditLog>
    findByEmployeeIdOrderByCreatedAtDesc(
            String employeeId
    );

    List<AuditLog>
    findByActionOrderByCreatedAtDesc(
            AuditAction action
    );

    List<AuditLog>
    findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
            String entityType,
            Long entityId
    );
}