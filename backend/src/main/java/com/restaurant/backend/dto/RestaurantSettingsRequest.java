package com.restaurant.backend.dto;

public class RestaurantSettingsRequest {

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

    public RestaurantSettingsRequest() {
    }

    public String getRestaurantName() {
        return restaurantName;
    }

    public void setRestaurantName(
            String restaurantName
    ) {
        this.restaurantName = restaurantName;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(
            String logoUrl
    ) {
        this.logoUrl = logoUrl;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(
            String address
    ) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(
            String phone
    ) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(
            String email
    ) {
        this.email = email;
    }

    public String getLocationUrl() {
        return locationUrl;
    }

    public void setLocationUrl(
            String locationUrl
    ) {
        this.locationUrl = locationUrl;
    }

    public String getOpeningHours() {
        return openingHours;
    }

    public void setOpeningHours(
            String openingHours
    ) {
        this.openingHours = openingHours;
    }

    public Double getTaxPercentage() {
        return taxPercentage;
    }

    public void setTaxPercentage(
            Double taxPercentage
    ) {
        this.taxPercentage = taxPercentage;
    }

    public String getReceiptHeader() {
        return receiptHeader;
    }

    public void setReceiptHeader(
            String receiptHeader
    ) {
        this.receiptHeader = receiptHeader;
    }

    public String getReceiptFooter() {
        return receiptFooter;
    }

    public void setReceiptFooter(
            String receiptFooter
    ) {
        this.receiptFooter = receiptFooter;
    }
}