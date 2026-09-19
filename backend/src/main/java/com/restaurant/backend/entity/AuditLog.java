package com.restaurant.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "audit_logs",
        indexes = {
                @Index(
                        name = "idx_audit_employee",
                        columnList = "employee_id"
                ),
                @Index(
                        name = "idx_audit_action",
                        columnList = "action"
                ),
                @Index(
                        name = "idx_audit_created_at",
                        columnList = "created_at"
                )
        }
)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================================
    // EMPLOYEE
    // =========================================

    @Column(name = "employee_id")
    private String employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    // =========================================
    // ACTION
    // =========================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    // =========================================
    // RESOURCE INFORMATION
    // =========================================

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    // =========================================
    // DESCRIPTION
    // =========================================

    @Column(columnDefinition = "TEXT")
    private String description;

    // =========================================
    // IP ADDRESS
    // =========================================

    @Column(name = "ip_address")
    private String ipAddress;

    // =========================================
    // TIMESTAMP
    // =========================================

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    public AuditLog() {
    }

    @PrePersist
    public void onCreate() {

        if (createdAt == null) {

            createdAt =
                    LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(
            String employeeId
    ) {
        this.employeeId = employeeId;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(
            String employeeName
    ) {
        this.employeeName = employeeName;
    }

    public AuditAction getAction() {
        return action;
    }

    public void setAction(
            AuditAction action
    ) {
        this.action = action;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(
            String entityType
    ) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(
            Long entityId
    ) {
        this.entityId = entityId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description
    ) {
        this.description = description;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(
            String ipAddress
    ) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}