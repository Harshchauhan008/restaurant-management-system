package com.restaurant.backend.dto;

public class ReceptionTableResponse {

    private Long tableId;
    private String tableNumber;
    private Integer capacity;
    private String location;
    private String status;
    private boolean active;

    private Long currentOrderId;
    private String currentOrderNumber;

    private Long assignedWaiterId;
    private String assignedWaiterName;

    public ReceptionTableResponse(
            Long tableId,
            String tableNumber,
            Integer capacity,
            String location,
            String status,
            boolean active,
            Long currentOrderId,
            String currentOrderNumber,
            Long assignedWaiterId,
            String assignedWaiterName
    ) {
        this.tableId = tableId;
        this.tableNumber = tableNumber;
        this.capacity = capacity;
        this.location = location;
        this.status = status;
        this.active = active;
        this.currentOrderId = currentOrderId;
        this.currentOrderNumber = currentOrderNumber;
        this.assignedWaiterId = assignedWaiterId;
        this.assignedWaiterName = assignedWaiterName;
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

    public String getStatus() {
        return status;
    }

    public boolean isActive() {
        return active;
    }

    public Long getCurrentOrderId() {
        return currentOrderId;
    }

    public String getCurrentOrderNumber() {
        return currentOrderNumber;
    }

    public Long getAssignedWaiterId() {
        return assignedWaiterId;
    }

    public String getAssignedWaiterName() {
        return assignedWaiterName;
    }
}