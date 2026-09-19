package com.restaurant.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class WaiterOrderResponse {

    private Long orderId;
    private String orderNumber;
    private String tableNumber;
    private String status;
    private BigDecimal totalAmount;
    private List<OrderItemResponse> items;

    public WaiterOrderResponse(
            Long orderId,
            String orderNumber,
            String tableNumber,
            String status,
            BigDecimal totalAmount,
            List<OrderItemResponse> items
    ) {
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.tableNumber = tableNumber;
        this.status = status;
        this.totalAmount = totalAmount;
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

    public String getStatus() {
        return status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

}