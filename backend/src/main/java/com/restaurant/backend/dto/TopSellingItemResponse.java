package com.restaurant.backend.dto;

import java.math.BigDecimal;

public class TopSellingItemResponse {

    private Long menuItemId;
    private String menuItemName;
    private long quantitySold;
    private BigDecimal totalSales;

    public TopSellingItemResponse() {
    }

    public TopSellingItemResponse(
            Long menuItemId,
            String menuItemName,
            long quantitySold,
            BigDecimal totalSales
    ) {
        this.menuItemId = menuItemId;
        this.menuItemName = menuItemName;
        this.quantitySold = quantitySold;
        this.totalSales = totalSales;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public String getMenuItemName() {
        return menuItemName;
    }

    public void setMenuItemName(String menuItemName) {
        this.menuItemName = menuItemName;
    }

    public long getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(long quantitySold) {
        this.quantitySold = quantitySold;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public void setTotalSales(BigDecimal totalSales) {
        this.totalSales = totalSales;
    }
}