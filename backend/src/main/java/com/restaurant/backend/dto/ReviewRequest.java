package com.restaurant.backend.dto;

public class ReviewRequest {

    private String reviewToken;

    private String customerName;

    private Integer rating;

    private String reviewText;

    private String photoUrl;


    public ReviewRequest() {
    }


    public String getReviewToken() {
        return reviewToken;
    }

    public void setReviewToken(String reviewToken) {
        this.reviewToken = reviewToken;
    }


    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }


    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }


    public String getReviewText() {
        return reviewText;
    }

    public void setReviewText(String reviewText) {
        this.reviewText = reviewText;
    }


    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }
}