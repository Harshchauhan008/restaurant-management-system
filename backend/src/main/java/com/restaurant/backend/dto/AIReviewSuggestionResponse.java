package com.restaurant.backend.dto;

public class AIReviewSuggestionResponse {

    private String suggestedReview;

    public AIReviewSuggestionResponse(
            String suggestedReview
    ) {
        this.suggestedReview = suggestedReview;
    }

    public String getSuggestedReview() {
        return suggestedReview;
    }
}