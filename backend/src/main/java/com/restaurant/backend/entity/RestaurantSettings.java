package com.restaurant.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_settings")
public class RestaurantSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =====================================================
    // CUSTOMER-FACING RESTAURANT INFORMATION
    // =====================================================

    @Column(name = "restaurant_name", nullable = false)
    private String restaurantName;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column
    private String phone;

    @Column
    private String email;

    @Column(name = "location_url", columnDefinition = "TEXT")
    private String locationUrl;

    @Column(name = "opening_hours")
    private String openingHours;

    // =====================================================
    // BILLING / RESTAURANT SETTINGS
    // =====================================================

    @Column(
            name = "tax_percentage",
            nullable = false
    )
    private Double taxPercentage = 0.0;

    @Column(
            name = "receipt_header",
            columnDefinition = "TEXT"
    )
    private String receiptHeader;

    @Column(
            name = "receipt_footer",
            columnDefinition = "TEXT"
    )
    private String receiptFooter;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public RestaurantSettings() {
    }

    // =====================================================
    // TIMESTAMP
    // =====================================================

    @PrePersist
    public void onCreate() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // =====================================================
    // GETTERS
    // =====================================================

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

    // =====================================================
    // SETTERS
    // =====================================================

    public void setRestaurantName(
            String restaurantName
    ) {
        this.restaurantName = restaurantName;
    }

    public void setLogoUrl(
            String logoUrl
    ) {
        this.logoUrl = logoUrl;
    }

    public void setAddress(
            String address
    ) {
        this.address = address;
    }

    public void setPhone(
            String phone
    ) {
        this.phone = phone;
    }

    public void setEmail(
            String email
    ) {
        this.email = email;
    }

    public void setLocationUrl(
            String locationUrl
    ) {
        this.locationUrl = locationUrl;
    }

    public void setOpeningHours(
            String openingHours
    ) {
        this.openingHours = openingHours;
    }

    public void setTaxPercentage(
            Double taxPercentage
    ) {
        this.taxPercentage = taxPercentage;
    }

    public void setReceiptHeader(
            String receiptHeader
    ) {
        this.receiptHeader = receiptHeader;
    }

    public void setReceiptFooter(
            String receiptFooter
    ) {
        this.receiptFooter = receiptFooter;
    }
}