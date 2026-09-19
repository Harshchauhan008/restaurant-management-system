package com.restaurant.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    // Separate token used only for customer review
    @Column(name = "review_token", nullable = false, unique = true)
    private String reviewToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    // Customer session
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private CustomerSession customerSession;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PLACED;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax", nullable = false, precision = 10, scale = 2)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(name = "discount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Assigned waiter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_waiter_id")
    private User assignedWaiter;

    public Order() {
        // Generate a unique token for this order's review
        this.reviewToken = UUID.randomUUID().toString();
    }

    public Long getId() {
        return id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getReviewToken() {
        return reviewToken;
    }

    public void setReviewToken(String reviewToken) {
        this.reviewToken = reviewToken;
    }

    public RestaurantTable getTable() {
        return table;
    }

    public void setTable(RestaurantTable table) {
        this.table = table;
    }

    public CustomerSession getCustomerSession() {
        return customerSession;
    }

    public void setCustomerSession(CustomerSession customerSession) {
        this.customerSession = customerSession;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public void setTax(BigDecimal tax) {
        this.tax = tax;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public User getAssignedWaiter() {
        return assignedWaiter;
    }

    public void setAssignedWaiter(User assignedWaiter) {
        this.assignedWaiter = assignedWaiter;
    }

    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}