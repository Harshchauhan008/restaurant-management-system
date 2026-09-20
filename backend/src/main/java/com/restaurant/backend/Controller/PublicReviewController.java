package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.ReviewService;
import com.restaurant.backend.dto.ReviewRequest;
import com.restaurant.backend.dto.ReviewResponse;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class PublicReviewController {

    private final ReviewService reviewService;

    public PublicReviewController(
            ReviewService reviewService
    ) {
        this.reviewService = reviewService;
    }


    // =====================================================
    // CUSTOMER SUBMITS REVIEW
    // =====================================================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse createReview(
            @RequestBody ReviewRequest request
    ) {

        return reviewService.createReview(request);
    }


    // =====================================================
    // PUBLIC WEBSITE SHOWS APPROVED REVIEWS
    // =====================================================

    @GetMapping
    public List<ReviewResponse> getAllReviews() {

        return reviewService.getAllPublicReviews();
    }
}