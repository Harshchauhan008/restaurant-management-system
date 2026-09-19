package com.restaurant.backend.Exception;

public class ConflictException
        extends RuntimeException {

    public ConflictException(
            String message
    ) {
        super(message);
    }
}