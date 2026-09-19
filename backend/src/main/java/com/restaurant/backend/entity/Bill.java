package com.restaurant.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bill_number", nullable = false, unique = true)
    private String billNumber;

    /*
     * Existing order reference.
     *
     * Kept temporarily so existing bills/data remain compatible
     * while the billing system is migrated to session-based billing.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", unique = true)
    private Order order;

    /*
     * One final bill belongs to one customer session.
     *
     * A customer session can contain multiple orders.
     *
     * This is temporarily nullable because existing bills
     * in the database were created before session-based billing.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "session_id",
            unique = true
    )
    private CustomerSession customerSession;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillStatus status = BillStatus.GENERATED;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "printed_at")
    private LocalDateTime printedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Bill() {
    }

    public Long getId() {
        return id;
    }

    public String getBillNumber() {
        return billNumber;
    }

    public void setBillNumber(String billNumber) {
        this.billNumber = billNumber;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public CustomerSession getCustomerSession() {
        return customerSession;
    }

    public void setCustomerSession(CustomerSession customerSession) {
        this.customerSession = customerSession;
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

    public BillStatus getStatus() {
        return status;
    }

    public void setStatus(BillStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getPrintedAt() {
        return printedAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void markPrinted() {
        this.status = BillStatus.PRINTED;
        this.printedAt = LocalDateTime.now();
    }

    public void markPaid() {
        this.status = BillStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }
}