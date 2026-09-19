package com.restaurant.backend.dto;

public class TableResponse {

    private Long id;
    private String tableNumber;
    private Integer capacity;
    private String location;
    private String status;
    private boolean active;
    private String qrToken;

    public TableResponse(
            Long id,
            String tableNumber,
            Integer capacity,
            String location,
            String status,
            boolean active,
            String qrToken
    ) {
        this.id = id;
        this.tableNumber = tableNumber;
        this.capacity = capacity;
        this.location = location;
        this.status = status;
        this.active = active;
        this.qrToken = qrToken;
    }

    public Long getId() {
        return id;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public String getLocation() {
        return location;
    }

    public String getStatus() {
        return status;
    }

    public boolean isActive() {
        return active;
    }

    public String getQrToken() {
        return qrToken;
    }
}