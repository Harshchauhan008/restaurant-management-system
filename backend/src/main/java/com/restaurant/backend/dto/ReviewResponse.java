package com.restaurant.backend.dto;

import java.time.LocalDateTime;

public class ReviewResponse {

    private Long id;

    private Long orderId;
    private String orderNumber;

    private String customerName;
    private Integer rating;
    private String reviewText;
    private String photoUrl;

    private LocalDateTime createdAt;


    public ReviewResponse(
            Long id,
            Long orderId,
            String orderNumber,
            String customerName,
            Integer rating,
            String reviewText,
            String photoUrl,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.customerName = customerName;
        this.rating = rating;
        this.reviewText = reviewText;
        this.photoUrl = photoUrl;
        this.createdAt = createdAt;
    }


    public Long getId() {
        return id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public Integer getRating() {
        return rating;
    }

    public String getReviewText() {
        return reviewText;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}