package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.AdminProfileService;
import com.restaurant.backend.dto.ChangeAdminPasswordRequest;
import com.restaurant.backend.dto.EmployeeResponse;
import com.restaurant.backend.dto.UpdateAdminProfileRequest;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/profile")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProfileController {

    private final AdminProfileService adminProfileService;

    public AdminProfileController(
            AdminProfileService adminProfileService
    ) {
        this.adminProfileService = adminProfileService;
    }


    // =====================================================
    // GET PROFILE
    // =====================================================

    @GetMapping
    public EmployeeResponse getProfile(
            Authentication authentication
    ) {

        return adminProfileService.getProfile(
                authentication.getName()
        );
    }


    // =====================================================
    // UPDATE PROFILE
    // =====================================================

    @PutMapping
    public EmployeeResponse updateProfile(
            Authentication authentication,
            @RequestBody UpdateAdminProfileRequest request
    ) {

        return adminProfileService.updateProfile(
                authentication.getName(),
                request
        );
    }


    // =====================================================
    // CHANGE PASSWORD
    // =====================================================

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            Authentication authentication,
            @RequestBody ChangeAdminPasswordRequest request
    ) {

        adminProfileService.changePassword(
                authentication.getName(),
                request
        );
    }
}