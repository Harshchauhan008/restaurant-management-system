package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.RestaurantSettingsService;

import com.restaurant.backend.dto.RestaurantSettingsRequest;
import com.restaurant.backend.dto.RestaurantSettingsResponse;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
public class AdminSettingsController {

    private final RestaurantSettingsService settingsService;

    public AdminSettingsController(
            RestaurantSettingsService settingsService
    ) {
        this.settingsService =
                settingsService;
    }

    // =========================================
    // GET SETTINGS
    // =========================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public RestaurantSettingsResponse getSettings() {

        return settingsService.getSettings();
    }

    // =========================================
    // UPDATE SETTINGS
    // =========================================

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public RestaurantSettingsResponse updateSettings(
            @RequestBody RestaurantSettingsRequest request
    ) {

        return settingsService.updateSettings(
                request
        );
    }
}