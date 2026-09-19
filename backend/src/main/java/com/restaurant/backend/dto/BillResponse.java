package com.restaurant.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class BillResponse {

    private Long id;
    private String billNumber;

    /*
     * A single bill can contain multiple orders
     * from the same customer session.
     */
    private List<String> orderNumbers;

    private String tableNumber;
    private String sessionCode;

    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal totalAmount;

    private String status;

    private List<BillItemResponse> items;

    public BillResponse(
            Long id,
            String billNumber,
            List<String> orderNumbers,
            String tableNumber,
            String sessionCode,
            BigDecimal subtotal,
            BigDecimal tax,
            BigDecimal discount,
            BigDecimal totalAmount,
            String status,
            List<BillItemResponse> items
    ) {
        this.id = id;
        this.billNumber = billNumber;
        this.orderNumbers = orderNumbers;
        this.tableNumber = tableNumber;
        this.sessionCode = sessionCode;
        this.subtotal = subtotal;
        this.tax = tax;
        this.discount = discount;
        this.totalAmount = totalAmount;
        this.status = status;
        this.items = items;
    }

    public Long getId() {
        return id;
    }

    public String getBillNumber() {
        return billNumber;
    }

    public List<String> getOrderNumbers() {
        return orderNumbers;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public String getSessionCode() {
        return sessionCode;
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

    public String getStatus() {
        return status;
    }

    public List<BillItemResponse> getItems() {
        return items;
    }
}