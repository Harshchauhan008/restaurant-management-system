package com.restaurant.backend.dto;

public class TablePublicResponse {

    private boolean valid;
    private Long tableId;
    private String tableNumber;
    private Integer capacity;

    public TablePublicResponse(
            boolean valid,
            Long tableId,
            String tableNumber,
            Integer capacity
    ) {
        this.valid = valid;
        this.tableId = tableId;
        this.tableNumber = tableNumber;
        this.capacity = capacity;
    }

    public boolean isValid() {
        return valid;
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
}