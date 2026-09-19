package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.Review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository
        extends JpaRepository<Review, Long> {

    // Check whether an order already has a review
    Optional<Review> findByOrderId(Long orderId);

    // Get all reviews, newest first
    List<Review> findAllByOrderByCreatedAtDesc();
}