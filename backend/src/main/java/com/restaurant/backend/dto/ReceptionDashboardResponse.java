package com.restaurant.backend.dto;

public class ReceptionDashboardResponse {

    private long totalTables;
    private long availableTables;
    private long occupiedTables;
    private long reservedTables;

    private long activeOrders;
    private long placedOrders;
    private long preparingOrders;
    private long readyOrders;
    private long servedOrders;

    public ReceptionDashboardResponse(
            long totalTables,
            long availableTables,
            long occupiedTables,
            long reservedTables,
            long activeOrders,
            long placedOrders,
            long preparingOrders,
            long readyOrders,
            long servedOrders
    ) {
        this.totalTables = totalTables;
        this.availableTables = availableTables;
        this.occupiedTables = occupiedTables;
        this.reservedTables = reservedTables;
        this.activeOrders = activeOrders;
        this.placedOrders = placedOrders;
        this.preparingOrders = preparingOrders;
        this.readyOrders = readyOrders;
        this.servedOrders = servedOrders;
    }

    public long getTotalTables() {
        return totalTables;
    }

    public long getAvailableTables() {
        return availableTables;
    }

    public long getOccupiedTables() {
        return occupiedTables;
    }

    public long getReservedTables() {
        return reservedTables;
    }

    public long getActiveOrders() {
        return activeOrders;
    }

    public long getPlacedOrders() {
        return placedOrders;
    }

    public long getPreparingOrders() {
        return preparingOrders;
    }

    public long getReadyOrders() {
        return readyOrders;
    }

    public long getServedOrders() {
        return servedOrders;
    }
}