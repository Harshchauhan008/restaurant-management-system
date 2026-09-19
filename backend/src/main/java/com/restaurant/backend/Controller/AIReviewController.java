package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.AIReviewService;

import com.restaurant.backend.dto.AIReviewSuggestionRequest;
import com.restaurant.backend.dto.AIReviewSuggestionResponse;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class AIReviewController {

    private final AIReviewService aiReviewService;

    public AIReviewController(
            AIReviewService aiReviewService
    ) {
        this.aiReviewService = aiReviewService;
    }

    @PostMapping("/ai-suggestion")
    public AIReviewSuggestionResponse generateSuggestion(
            @RequestBody AIReviewSuggestionRequest request
    ) {

        return aiReviewService.generateSuggestion(
                request
        );
    }
}