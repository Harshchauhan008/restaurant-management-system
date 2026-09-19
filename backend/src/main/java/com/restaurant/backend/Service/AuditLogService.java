package com.restaurant.backend.Service;

import com.restaurant.backend.Repository.AuditLogRepository;
import com.restaurant.backend.Repository.UserRepository;

import com.restaurant.backend.entity.AuditAction;
import com.restaurant.backend.entity.AuditLog;
import com.restaurant.backend.entity.User;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            UserRepository userRepository
    ) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    // =====================================================
    // LOG ACTION
    // =====================================================

    @Transactional
    public void log(
            AuditAction action,
            String entityType,
            Long entityId,
            String description
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String employeeId = null;
        String employeeName = null;

        if (authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getName() != null) {

            employeeId =
                    authentication.getName();

            User user =
                    userRepository
                            .findByEmployeeId(employeeId)
                            .orElse(null);

            if (user != null) {

                employeeName =
                        user.getFullName();
            }
        }

        AuditLog auditLog =
                new AuditLog();

        auditLog.setEmployeeId(
                employeeId
        );

        auditLog.setEmployeeName(
                employeeName
        );

        auditLog.setAction(
                action
        );

        auditLog.setEntityType(
                entityType
        );

        auditLog.setEntityId(
                entityId
        );

        auditLog.setDescription(
                description
        );

        auditLogRepository.save(
                auditLog
        );
    }


    // =====================================================
    // LOG ACTION WITH IP ADDRESS
    // =====================================================

    @Transactional
    public void log(
            AuditAction action,
            String entityType,
            Long entityId,
            String description,
            HttpServletRequest request
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String employeeId = null;
        String employeeName = null;

        if (authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getName() != null) {

            employeeId =
                    authentication.getName();

            User user =
                    userRepository
                            .findByEmployeeId(employeeId)
                            .orElse(null);

            if (user != null) {

                employeeName =
                        user.getFullName();
            }
        }

        AuditLog auditLog =
                new AuditLog();

        auditLog.setEmployeeId(
                employeeId
        );

        auditLog.setEmployeeName(
                employeeName
        );

        auditLog.setAction(
                action
        );

        auditLog.setEntityType(
                entityType
        );

        auditLog.setEntityId(
                entityId
        );

        auditLog.setDescription(
                description
        );

        if (request != null) {

            auditLog.setIpAddress(
                    getClientIp(request)
            );
        }

        auditLogRepository.save(
                auditLog
        );
    }


    // =====================================================
    // CLIENT IP
    // =====================================================

    private String getClientIp(
            HttpServletRequest request
    ) {

        String forwarded =
                request.getHeader(
                        "X-Forwarded-For"
                );

        if (forwarded != null &&
                !forwarded.isBlank()) {

            return forwarded
                    .split(",")[0]
                    .trim();
        }

        String realIp =
                request.getHeader(
                        "X-Real-IP"
                );

        if (realIp != null &&
                !realIp.isBlank()) {

            return realIp;
        }

        return request.getRemoteAddr();
    }
}