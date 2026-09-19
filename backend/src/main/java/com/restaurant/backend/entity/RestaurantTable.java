package com.restaurant.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "restaurant_tables")
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_number", nullable = false, unique = true)
    private String tableNumber;

    @Column(nullable = false)
    private Integer capacity;

    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TableStatus status = TableStatus.AVAILABLE;

    @Column(name = "qr_token", nullable = false, unique = true)
    private String qrToken;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public RestaurantTable() {
    }

    public Long getId() {
        return id;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(String tableNumber) {
        this.tableNumber = tableNumber;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public TableStatus getStatus() {
        return status;
    }

    public void setStatus(TableStatus status) {
        this.status = status;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}