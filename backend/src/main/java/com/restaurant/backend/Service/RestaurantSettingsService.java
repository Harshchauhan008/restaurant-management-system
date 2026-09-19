package com.restaurant.backend.Service;

import com.restaurant.backend.Exception.ResourceNotFoundException;
import com.restaurant.backend.Repository.RestaurantSettingsRepository;
import com.restaurant.backend.dto.RestaurantSettingsRequest;
import com.restaurant.backend.dto.RestaurantSettingsResponse;
import com.restaurant.backend.entity.AuditAction;
import com.restaurant.backend.entity.RestaurantSettings;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RestaurantSettingsService {

    private final RestaurantSettingsRepository settingsRepository;
    private final AuditLogService auditLogService;

    public RestaurantSettingsService(
            RestaurantSettingsRepository settingsRepository,
            AuditLogService auditLogService
    ) {
        this.settingsRepository =
                settingsRepository;

        this.auditLogService =
                auditLogService;
    }

    // =====================================================
    // GET SETTINGS
    // =====================================================

    @Transactional(readOnly = true)
    public RestaurantSettingsResponse getSettings() {

        RestaurantSettings settings =
                settingsRepository
                        .findAll()
                        .stream()
                        .findFirst()
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Restaurant settings not found"
                                )
                        );

        return toResponse(settings);
    }

    // =====================================================
    // UPDATE SETTINGS
    // =====================================================

    @Transactional
    public RestaurantSettingsResponse updateSettings(
            RestaurantSettingsRequest request
    ) {

        // -------------------------------------------------
        // VALIDATE REQUEST
        // -------------------------------------------------

        if (request == null) {

            throw new IllegalArgumentException(
                    "Settings request is required"
            );
        }

        if (request.getRestaurantName() == null ||
                request.getRestaurantName().isBlank()) {

            throw new IllegalArgumentException(
                    "Restaurant name is required"
            );
        }

        if (request.getTaxPercentage() == null) {

            throw new IllegalArgumentException(
                    "Tax percentage is required"
            );
        }

        if (request.getTaxPercentage() < 0 ||
                request.getTaxPercentage() > 100) {

            throw new IllegalArgumentException(
                    "Tax percentage must be between 0 and 100"
            );
        }

        // -------------------------------------------------
        // GET EXISTING SETTINGS
        // -------------------------------------------------

        RestaurantSettings settings =
                settingsRepository
                        .findAll()
                        .stream()
                        .findFirst()
                        .orElseGet(
                                RestaurantSettings::new
                        );

        // -------------------------------------------------
        // UPDATE FIELDS
        // -------------------------------------------------

        settings.setRestaurantName(
                request.getRestaurantName().trim()
        );

        settings.setLogoUrl(
                request.getLogoUrl()
        );

        settings.setAddress(
                request.getAddress()
        );

        settings.setPhone(
                request.getPhone()
        );

        // NEW: EMAIL
        settings.setEmail(
                request.getEmail()
        );

        // NEW: GOOGLE MAPS / LOCATION URL
        settings.setLocationUrl(
                request.getLocationUrl()
        );

        settings.setOpeningHours(
                request.getOpeningHours()
        );

        settings.setTaxPercentage(
                request.getTaxPercentage()
        );

        settings.setReceiptHeader(
                request.getReceiptHeader()
        );

        settings.setReceiptFooter(
                request.getReceiptFooter()
        );

        // -------------------------------------------------
        // SAVE
        // -------------------------------------------------

        RestaurantSettings saved =
                settingsRepository.save(
                        settings
                );

        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.UPDATE_SETTINGS,
                "SETTINGS",
                saved.getId(),
                "Updated restaurant settings"
        );

        return toResponse(saved);
    }

    // =====================================================
    // RESPONSE MAPPER
    // =====================================================

    private RestaurantSettingsResponse toResponse(
            RestaurantSettings settings
    ) {

        return new RestaurantSettingsResponse(
                settings.getId(),
                settings.getRestaurantName(),
                settings.getLogoUrl(),
                settings.getAddress(),
                settings.getPhone(),
                settings.getEmail(),
                settings.getLocationUrl(),
                settings.getOpeningHours(),
                settings.getTaxPercentage(),
                settings.getReceiptHeader(),
                settings.getReceiptFooter(),
                settings.getUpdatedAt()
        );
    }
}