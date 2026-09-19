package com.restaurant.backend.dto;

public class EmployeeResponse {

    private Long id;
    private String employeeId;
    private String fullName;
    private String email;
    private String role;
    private boolean active;

    public EmployeeResponse(
            Long id,
            String employeeId,
            String fullName,
            String email,
            String role,
            boolean active
    ) {
        this.id = id;
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public boolean isActive() {
        return active;
    }
}