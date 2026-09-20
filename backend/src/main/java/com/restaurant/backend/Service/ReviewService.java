package com.restaurant.backend.Service;

import com.restaurant.backend.Repository.ReviewRepository;
import com.restaurant.backend.dto.ReviewRequest;
import com.restaurant.backend.dto.ReviewResponse;
import com.restaurant.backend.entity.Review;
import com.restaurant.backend.entity.ReviewStatus;

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

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
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


        // ---------------------------------------------
        // NO ORDER REQUIRED
        // ---------------------------------------------
        //
        // Customer can submit a review directly
        // from the public QR code.
        //
        // Therefore order is optional.
        // ---------------------------------------------

        review.setOrder(null);


        // ---------------------------------------------
        // NEW REVIEWS ARE IMMEDIATELY VISIBLE
        // ---------------------------------------------
        //
        // No admin approval is required.
        // Admin can delete the review if necessary.
        // ---------------------------------------------

        review.setStatus(
                ReviewStatus.APPROVED
        );


        // ---------------------------------------------
        // SAVE REVIEW
        // ---------------------------------------------

        Review saved =
                reviewRepository.save(review);

        return toResponse(saved);
    }


    // =====================================================
    // GET APPROVED REVIEWS - PUBLIC
    // =====================================================

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllPublicReviews() {

        return reviewRepository
                .findAll()
                .stream()
                .filter(review ->
                        review.getStatus() ==
                                ReviewStatus.APPROVED
                )
                .sorted(
                        (a, b) ->
                                b.getCreatedAt()
                                        .compareTo(
                                                a.getCreatedAt()
                                        )
                )
                .map(this::toResponse)
                .toList();
    }


    // =====================================================
    // GET ALL REVIEWS - ADMIN
    // =====================================================

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllReviews() {

        return reviewRepository
                .findAll()
                .stream()
                .sorted(
                        (a, b) ->
                                b.getCreatedAt()
                                        .compareTo(
                                                a.getCreatedAt()
                                        )
                )
                .map(this::toResponse)
                .toList();
    }


    // =====================================================
    // GET REVIEWS BY STATUS - ADMIN
    // =====================================================

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByStatus(
            ReviewStatus status
    ) {

        if (status == null) {
            throw new RuntimeException(
                    "Review status is required"
            );
        }

        return reviewRepository
                .findAll()
                .stream()
                .filter(review ->
                        review.getStatus() == status
                )
                .sorted(
                        (a, b) ->
                                b.getCreatedAt()
                                        .compareTo(
                                                a.getCreatedAt()
                                        )
                )
                .map(this::toResponse)
                .toList();
    }


    // =====================================================
    // APPROVE REVIEW - ADMIN
    // =====================================================
    //
    // Kept for compatibility with the existing backend.
    // New reviews no longer need approval because they
    // are automatically APPROVED.
    // =====================================================

    @Transactional
    public ReviewResponse approveReview(Long reviewId) {

        Review review =
                getReviewEntity(reviewId);

        review.setStatus(
                ReviewStatus.APPROVED
        );

        Review saved =
                reviewRepository.save(review);

        return toResponse(saved);
    }


    // =====================================================
    // DELETE REVIEW - ADMIN
    // =====================================================

    @Transactional
    public void deleteReview(Long reviewId) {

        Review review =
                getReviewEntity(reviewId);


        // ---------------------------------------------
        // SAVE IMAGE URL BEFORE DELETE
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

        // ---------------------------------------------
        // NO IMAGE
        // ---------------------------------------------

        if (photoUrl == null ||
                photoUrl.isBlank()) {

            return;
        }


        // ---------------------------------------------
        // ONLY HANDLE OUR REVIEW UPLOADS
        // ---------------------------------------------

        String prefix =
                "/uploads/reviews/";


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
             * Do not fail the API just because
             * image deletion failed.
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


        // ---------------------------------------------
        // ORDER IS OPTIONAL
        // ---------------------------------------------

        Long orderId = null;
        String orderNumber = null;


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

                review.getCreatedAt(),

                review.getStatus()
        );
    }
}