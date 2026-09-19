package com.restaurant.backend.dto;

import java.time.LocalDateTime;

public class RestaurantSettingsResponse {

    private Long id;

    private String restaurantName;
    private String logoUrl;
    private String address;
    private String phone;
    private String email;
    private String locationUrl;
    private String openingHours;

    private Double taxPercentage;

    private String receiptHeader;
    private String receiptFooter;

    private LocalDateTime updatedAt;

    public RestaurantSettingsResponse(
            Long id,
            String restaurantName,
            String logoUrl,
            String address,
            String phone,
            String email,
            String locationUrl,
            String openingHours,
            Double taxPercentage,
            String receiptHeader,
            String receiptFooter,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.restaurantName = restaurantName;
        this.logoUrl = logoUrl;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.locationUrl = locationUrl;
        this.openingHours = openingHours;
        this.taxPercentage = taxPercentage;
        this.receiptHeader = receiptHeader;
        this.receiptFooter = receiptFooter;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getRestaurantName() {
        return restaurantName;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public String getAddress() {
        return address;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getLocationUrl() {
        return locationUrl;
    }

    public String getOpeningHours() {
        return openingHours;
    }

    public Double getTaxPercentage() {
        return taxPercentage;
    }

    public String getReceiptHeader() {
        return receiptHeader;
    }

    public String getReceiptFooter() {
        return receiptFooter;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}