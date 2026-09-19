package com.restaurant.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class ReceptionOrderResponse {

    private Long orderId;
    private String orderNumber;
    private String tableNumber;
    private String sessionCode;
    private String status;

    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal totalAmount;

    private Long waiterId;
    private String waiterName;

    private List<OrderItemResponse> items;

    public ReceptionOrderResponse(
            Long orderId,
            String orderNumber,
            String tableNumber,
            String sessionCode,
            String status,
            BigDecimal subtotal,
            BigDecimal tax,
            BigDecimal discount,
            BigDecimal totalAmount,
            Long waiterId,
            String waiterName,
            List<OrderItemResponse> items
    ) {
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.tableNumber = tableNumber;
        this.sessionCode = sessionCode;
        this.status = status;
        this.subtotal = subtotal;
        this.tax = tax;
        this.discount = discount;
        this.totalAmount = totalAmount;
        this.waiterId = waiterId;
        this.waiterName = waiterName;
        this.items = items;
    }

    public Long getOrderId() {
        return orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public String getSessionCode() {
        return sessionCode;
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

    public Long getWaiterId() {
        return waiterId;
    }

    public String getWaiterName() {
        return waiterName;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }
}