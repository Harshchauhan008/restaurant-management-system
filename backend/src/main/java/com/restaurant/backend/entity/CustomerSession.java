package com.restaurant.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "customer_sessions",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"table_id", "session_code"}
                )
        }
)
public class CustomerSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The restaurant table for this customer session
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    // 4-digit code given to the customer
    @Column(
            name = "session_code",
            nullable = false,
            length = 4
    )
    private String sessionCode;

    // Whether this table session is currently active
    @Column(
            name = "active",
            nullable = false
    )
    private boolean active = true;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public CustomerSession() {
    }

    public Long getId() {
        return id;
    }

    public RestaurantTable getTable() {
        return table;
    }

    public void setTable(RestaurantTable table) {
        this.table = table;
    }

    public String getSessionCode() {
        return sessionCode;
    }

    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }
}