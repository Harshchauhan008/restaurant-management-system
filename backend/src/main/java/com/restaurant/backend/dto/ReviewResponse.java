package com.restaurant.backend.dto;

import com.restaurant.backend.entity.ReviewStatus;

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

    private ReviewStatus status;


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public ReviewResponse(
            Long id,
            Long orderId,
            String orderNumber,
            String customerName,
            Integer rating,
            String reviewText,
            String photoUrl,
            LocalDateTime createdAt,
            ReviewStatus status
    ) {

        this.id = id;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.customerName = customerName;
        this.rating = rating;
        this.reviewText = reviewText;
        this.photoUrl = photoUrl;
        this.createdAt = createdAt;
        this.status = status;
    }


    // =====================================================
    // GETTERS
    // =====================================================

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

    public ReviewStatus getStatus() {
        return status;
    }
}