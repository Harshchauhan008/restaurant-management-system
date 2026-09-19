package com.restaurant.backend.dto;

public class AvailableTableResponse {

    private Long tableId;
    private String tableNumber;
    private Integer capacity;
    private String location;
    private boolean available;

    public AvailableTableResponse(
            Long tableId,
            String tableNumber,
            Integer capacity,
            String location,
            boolean available
    ) {
        this.tableId = tableId;
        this.tableNumber = tableNumber;
        this.capacity = capacity;
        this.location = location;
        this.available = available;
    }

    public Long getTableId() {
        return tableId;
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

    public boolean isAvailable() {
        return available;
    }
}