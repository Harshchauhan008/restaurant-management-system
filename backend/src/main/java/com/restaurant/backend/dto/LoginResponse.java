package com.restaurant.backend.dto;

public class LoginResponse {

    private String message;
    private String token;
    private String employeeId;
    private String fullName;
    private String role;

    public LoginResponse(
            String message,
            String token,
            String employeeId,
            String fullName,
            String role
    ) {
        this.message = message;
        this.token = token;
        this.employeeId = employeeId;
        this.fullName = fullName;
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public String getToken() {
        return token;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getRole() {
        return role;
    }
}