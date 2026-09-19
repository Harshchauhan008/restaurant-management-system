package com.restaurant.backend.dto;

public class AIReviewSuggestionRequest {

    private Long orderId;
    private Integer rating;
    private String imageUrl;
    private String variation;

    public AIReviewSuggestionRequest() {
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getVariation() {
        return variation;
    }

    public void setVariation(String variation) {
        this.variation = variation;
    }
}