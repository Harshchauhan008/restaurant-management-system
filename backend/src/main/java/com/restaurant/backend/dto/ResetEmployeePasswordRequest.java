package com.restaurant.backend.dto;

public class ResetEmployeePasswordRequest {

    private String newPassword;

    public ResetEmployeePasswordRequest() {
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}