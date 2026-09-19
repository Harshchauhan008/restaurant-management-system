package com.restaurant.backend.Controller;

import com.restaurant.backend.Repository.AuditLogRepository;
import com.restaurant.backend.entity.AuditAction;
import com.restaurant.backend.entity.AuditLog;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditController {

    private final AuditLogRepository auditLogRepository;

    public AdminAuditController(
            AuditLogRepository auditLogRepository
    ) {
        this.auditLogRepository =
                auditLogRepository;
    }

    // =========================================
    // ALL AUDIT LOGS
    // =========================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLog> getAllLogs() {

        return auditLogRepository
                .findAllByOrderByCreatedAtDesc();
    }


    // =========================================
    // BY EMPLOYEE
    // =========================================

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLog> getByEmployee(
            @PathVariable String employeeId
    ) {

        return auditLogRepository
                .findByEmployeeIdOrderByCreatedAtDesc(
                        employeeId
                );
    }


    // =========================================
    // BY ACTION
    // =========================================

    @GetMapping("/action/{action}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLog> getByAction(
            @PathVariable AuditAction action
    ) {

        return auditLogRepository
                .findByActionOrderByCreatedAtDesc(
                        action
                );
    }


    // =========================================
    // BY ENTITY
    // =========================================

    @GetMapping(
            "/entity/{entityType}/{entityId}"
    )
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLog> getByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId
    ) {

        return auditLogRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                        entityType,
                        entityId
                );
    }
}