package com.restaurant.backend.Service;

import com.restaurant.backend.Repository.OrderRepository;
import com.restaurant.backend.Repository.ReviewRepository;
import com.restaurant.backend.dto.ReviewRequest;
import com.restaurant.backend.dto.ReviewResponse;
import com.restaurant.backend.entity.Order;
import com.restaurant.backend.entity.OrderStatus;
import com.restaurant.backend.entity.Review;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    // =====================================================
    // REVIEW IMAGE UPLOAD DIRECTORY
    // =====================================================

    private final Path uploadDirectory =
            Paths.get("uploads/reviews")
                    .toAbsolutePath()
                    .normalize();


    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public ReviewService(
            ReviewRepository reviewRepository,
            OrderRepository orderRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
    }


    // =====================================================
    // CREATE REVIEW
    // =====================================================

    @Transactional
    public ReviewResponse createReview(ReviewRequest request) {

        // ---------------------------------------------
        // VALIDATE REQUEST
        // ---------------------------------------------

        if (request == null) {
            throw new RuntimeException(
                    "Review request is required"
            );
        }


        // ---------------------------------------------
        // VALIDATE REVIEW TOKEN
        // ---------------------------------------------

        if (request.getReviewToken() == null ||
                request.getReviewToken().isBlank()) {

            throw new RuntimeException(
                    "Review token is required"
            );
        }


        // ---------------------------------------------
        // VALIDATE CUSTOMER NAME
        // ---------------------------------------------

        if (request.getCustomerName() == null ||
                request.getCustomerName().isBlank()) {

            throw new RuntimeException(
                    "Customer name is required"
            );
        }


        // ---------------------------------------------
        // VALIDATE RATING
        // ---------------------------------------------

        if (request.getRating() == null ||
                request.getRating() < 1 ||
                request.getRating() > 5) {

            throw new RuntimeException(
                    "Rating must be between 1 and 5"
            );
        }


        // ---------------------------------------------
        // VALIDATE REVIEW TEXT
        // ---------------------------------------------

        if (request.getReviewText() == null ||
                request.getReviewText().isBlank()) {

            throw new RuntimeException(
                    "Review text is required"
            );
        }


        // ---------------------------------------------
        // FIND ORDER USING REVIEW TOKEN
        // ---------------------------------------------

        Order order =
                orderRepository
                        .findByReviewToken(
                                request.getReviewToken().trim()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Invalid review token"
                                )
                        );


        // ---------------------------------------------
        // ONLY COMPLETED ORDERS CAN BE REVIEWED
        // ---------------------------------------------

        if (order.getStatus() != OrderStatus.COMPLETED) {

            throw new RuntimeException(
                    "Only completed orders can be reviewed"
            );
        }


        // ---------------------------------------------
        // ONE REVIEW PER ORDER
        // ---------------------------------------------

        if (reviewRepository
                .findByOrderId(order.getId())
                .isPresent()) {

            throw new RuntimeException(
                    "A review already exists for this order"
            );
        }


        // ---------------------------------------------
        // CREATE REVIEW
        // ---------------------------------------------

        Review review = new Review();

        review.setCustomerName(
                request.getCustomerName().trim()
        );

        review.setRating(
                request.getRating()
        );

        review.setReviewText(
                request.getReviewText().trim()
        );

        review.setPhotoUrl(
                request.getPhotoUrl()
        );

        review.setOrder(
                order
        );


        // ---------------------------------------------
        // SAVE REVIEW
        // ---------------------------------------------

        Review saved =
                reviewRepository.save(review);


        return toResponse(saved);
    }


    // =====================================================
    // GET ALL PUBLIC REVIEWS
    // =====================================================

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllPublicReviews() {

        List<Review> reviews =
                reviewRepository
                        .findAllByOrderByCreatedAtDesc();

        return reviews
                .stream()
                .map(review -> toResponse(review))
                .toList();
    }


    // =====================================================
    // GET ALL REVIEWS - ADMIN
    // =====================================================

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllReviews() {

        List<Review> reviews =
                reviewRepository
                        .findAllByOrderByCreatedAtDesc();

        return reviews
                .stream()
                .map(review -> toResponse(review))
                .toList();
    }


    // =====================================================
    // DELETE REVIEW - ADMIN
    // =====================================================

    @Transactional
    public void deleteReview(Long reviewId) {

        Review review =
                getReviewEntity(reviewId);


        // ---------------------------------------------
        // SAVE IMAGE URL BEFORE DELETING REVIEW
        // ---------------------------------------------

        String photoUrl =
                review.getPhotoUrl();


        // ---------------------------------------------
        // DELETE REVIEW FROM DATABASE
        // ---------------------------------------------

        reviewRepository.delete(review);


        // ---------------------------------------------
        // DELETE ASSOCIATED IMAGE
        // ---------------------------------------------

        deleteReviewPhoto(photoUrl);
    }


    // =====================================================
    // DELETE REVIEW PHOTO
    // =====================================================

    private void deleteReviewPhoto(String photoUrl) {

        // No image attached
        if (photoUrl == null ||
                photoUrl.isBlank()) {

            return;
        }


        // Our review images use this URL
        String prefix =
                "/uploads/reviews/";


        // Don't delete files outside our upload folder
        if (!photoUrl.startsWith(prefix)) {

            return;
        }


        // ---------------------------------------------
        // EXTRACT FILE NAME
        // ---------------------------------------------

        String fileName =
                photoUrl.substring(
                        prefix.length()
                );


        if (fileName.isBlank()) {
            return;
        }


        // ---------------------------------------------
        // RESOLVE FILE
        // ---------------------------------------------

        Path filePath =
                uploadDirectory
                        .resolve(fileName)
                        .normalize();


        // ---------------------------------------------
        // PATH TRAVERSAL PROTECTION
        // ---------------------------------------------

        if (!filePath.startsWith(uploadDirectory)) {
            return;
        }


        // ---------------------------------------------
        // DELETE FILE
        // ---------------------------------------------

        try {

            Files.deleteIfExists(filePath);

        } catch (IOException e) {

            /*
             * Review is already deleted from database.
             *
             * Do not fail the API only because
             * the image file could not be deleted.
             */

            System.err.println(
                    "Failed to delete review image: "
                            + filePath
            );

            System.err.println(
                    "Reason: "
                            + e.getMessage()
            );
        }
    }


    // =====================================================
    // FIND REVIEW ENTITY
    // =====================================================

    private Review getReviewEntity(Long reviewId) {

        if (reviewId == null) {

            throw new RuntimeException(
                    "Review ID is required"
            );
        }


        return reviewRepository
                .findById(reviewId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Review not found"
                        )
                );
    }


    // =====================================================
    // CONVERT REVIEW ENTITY TO RESPONSE
    // =====================================================

    private ReviewResponse toResponse(Review review) {

        if (review == null) {
            return null;
        }


        Long orderId = null;
        String orderNumber = null;


        // ---------------------------------------------
        // GET ORDER INFORMATION
        // ---------------------------------------------

        if (review.getOrder() != null) {

            orderId =
                    review.getOrder()
                            .getId();

            orderNumber =
                    review.getOrder()
                            .getOrderNumber();
        }


        // ---------------------------------------------
        // CREATE RESPONSE
        // ---------------------------------------------

        return new ReviewResponse(

                review.getId(),

                orderId,

                orderNumber,

                review.getCustomerName(),

                review.getRating(),

                review.getReviewText(),

                review.getPhotoUrl(),

                review.getCreatedAt()
        );
    }
}