package com.restaurant.backend.dto;

public class QRResponse {

    private Long tableId;
    private String tableNumber;
    private String qrToken;
    private String orderUrl;

    public QRResponse(
            Long tableId,
            String tableNumber,
            String qrToken,
            String orderUrl
    ) {
        this.tableId = tableId;
        this.tableNumber = tableNumber;
        this.qrToken = qrToken;
        this.orderUrl = orderUrl;
    }

    public Long getTableId() {
        return tableId;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public String getQrToken() {
        return qrToken;
    }

    public String getOrderUrl() {
        return orderUrl;
    }
}