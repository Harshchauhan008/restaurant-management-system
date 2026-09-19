package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.ReviewService;
import com.restaurant.backend.dto.ReviewResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize(
        "hasRole('ADMIN') or " +
        "hasAuthority('MODERATE_REVIEWS')"
)
public class AdminReviewController {

    private final ReviewService reviewService;


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public AdminReviewController(
            ReviewService reviewService
    ) {
        this.reviewService = reviewService;
    }


    // =====================================================
    // GET ALL REVIEWS
    // =====================================================

    @GetMapping
    public List<ReviewResponse> getAllReviews() {

        return reviewService.getAllReviews();
    }


    // =====================================================
    // DELETE REVIEW
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long id
    ) {

        reviewService.deleteReview(id);

        return ResponseEntity.noContent().build();
    }
}