package com.restaurant.backend.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // =========================================
    // 404 - NOT FOUND
    // =========================================

    @ExceptionHandler(
            ResourceNotFoundException.class
    )
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex
    ) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
    }


    // =========================================
    // 409 - CONFLICT
    // =========================================

    @ExceptionHandler(
            ConflictException.class
    )
    public ResponseEntity<ErrorResponse> handleConflict(
            ConflictException ex
    ) {

        return buildResponse(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
    }


    // =========================================
// 403 - ACCESS DENIED
// =========================================

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDenied(
                AccessDeniedException ex
        ) {
        return buildResponse(
                HttpStatus.FORBIDDEN,
                "You do not have permission to perform this action."
        );
        }

    // =========================================
    // 400 - BAD REQUEST
    // =========================================

    @ExceptionHandler(
            IllegalArgumentException.class
    )
    public ResponseEntity<ErrorResponse> handleBadRequest(
            IllegalArgumentException ex
    ) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }


    // =========================================
    // OTHER RUNTIME ERRORS
    // =========================================

    @ExceptionHandler(
            RuntimeException.class
    )
    public ResponseEntity<ErrorResponse> handleRuntimeException(
            RuntimeException ex
    ) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
    }


    // =========================================
    // RESPONSE BUILDER
    // =========================================

    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status,
            String message
    ) {

        ErrorResponse response =
                new ErrorResponse(
                        status.value(),
                        message,
                        LocalDateTime.now()
                );

        return ResponseEntity
                .status(status)
                .body(response);
    }
}