package com.restaurant.backend.dto;

import java.util.List;

public class CreateOrderRequest {

    private String qrToken;

    // 4-digit customer session code
    // Null for the first order of a table session
    private String sessionCode;

    private List<OrderItemRequest> items;

    public CreateOrderRequest() {
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public String getSessionCode() {
        return sessionCode;
    }

    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }
}