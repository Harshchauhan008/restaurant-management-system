package com.restaurant.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderResponse {

    private Long id;
    private String orderNumber;
    private String tableNumber;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private List<OrderItemResponse> items;

    private Long waiterId;
    private String waiterName;

    // 4-digit customer session code
    private String sessionCode;

    // Unique token used for customer review QR
    private String reviewToken;

    // =====================================================
    // CONSTRUCTOR - BASIC
    // =====================================================

    public OrderResponse(
            Long id,
            String orderNumber,
            String tableNumber,
            String status,
            BigDecimal subtotal,
            BigDecimal tax,
            BigDecimal discount,
            BigDecimal totalAmount,
            List<OrderItemResponse> items
    ) {
        this(
                id,
                orderNumber,
                tableNumber,
                status,
                subtotal,
                tax,
                discount,
                totalAmount,
                items,
                null,
                null,
                null,
                null
        );
    }

    // =====================================================
    // CONSTRUCTOR - WITH WAITER
    // =====================================================

    public OrderResponse(
            Long id,
            String orderNumber,
            String tableNumber,
            String status,
            BigDecimal subtotal,
            BigDecimal tax,
            BigDecimal discount,
            BigDecimal totalAmount,
            List<OrderItemResponse> items,
            Long waiterId,
            String waiterName
    ) {
        this(
                id,
                orderNumber,
                tableNumber,
                status,
                subtotal,
                tax,
                discount,
                totalAmount,
                items,
                waiterId,
                waiterName,
                null,
                null
        );
    }

    // =====================================================
    // CONSTRUCTOR - WITH SESSION CODE
    // =====================================================

    public OrderResponse(
            Long id,
            String orderNumber,
            String tableNumber,
            String status,
            BigDecimal subtotal,
            BigDecimal tax,
            BigDecimal discount,
            BigDecimal totalAmount,
            List<OrderItemResponse> items,
            Long waiterId,
            String waiterName,
            String sessionCode
    ) {
        this(
                id,
                orderNumber,
                tableNumber,
                status,
                subtotal,
                tax,
                discount,
                totalAmount,
                items,
                waiterId,
                waiterName,
                sessionCode,
                null
        );
    }

    // =====================================================
    // CONSTRUCTOR - COMPLETE
    // =====================================================

    public OrderResponse(
            Long id,
            String orderNumber,
            String tableNumber,
            String status,
            BigDecimal subtotal,
            BigDecimal tax,
            BigDecimal discount,
            BigDecimal totalAmount,
            List<OrderItemResponse> items,
            Long waiterId,
            String waiterName,
            String sessionCode,
            String reviewToken
    ) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.tableNumber = tableNumber;
        this.status = status;
        this.subtotal = subtotal;
        this.tax = tax;
        this.discount = discount;
        this.totalAmount = totalAmount;
        this.items = items;
        this.waiterId = waiterId;
        this.waiterName = waiterName;
        this.sessionCode = sessionCode;
        this.reviewToken = reviewToken;
    }

    // =====================================================
    // GETTERS
    // =====================================================

    public Long getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public Long getWaiterId() {
        return waiterId;
    }

    public String getWaiterName() {
        return waiterName;
    }

    public String getSessionCode() {
        return sessionCode;
    }

    public String getReviewToken() {
        return reviewToken;
    }
}