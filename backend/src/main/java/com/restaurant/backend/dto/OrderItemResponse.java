package com.restaurant.backend.dto;

import java.math.BigDecimal;

public class OrderItemResponse {

    private Long menuItemId;
    private String menuItemName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String specialInstruction;
    private String status;

    public OrderItemResponse(
            Long menuItemId,
            String menuItemName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal totalPrice,
            String specialInstruction,
            String status
    ) {
        this.menuItemId = menuItemId;
        this.menuItemName = menuItemName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
        this.specialInstruction = specialInstruction;
        this.status = status;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public String getMenuItemName() {
        return menuItemName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public String getSpecialInstruction() {
        return specialInstruction;
    }

    public String getStatus() {
        return status;
    }
}