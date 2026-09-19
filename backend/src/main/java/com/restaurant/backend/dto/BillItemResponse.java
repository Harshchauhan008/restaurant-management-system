package com.restaurant.backend.dto;

import java.math.BigDecimal;

public class BillItemResponse {

    private String menuItemName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    public BillItemResponse(
            String menuItemName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal totalPrice
    ) {
        this.menuItemName = menuItemName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
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
}