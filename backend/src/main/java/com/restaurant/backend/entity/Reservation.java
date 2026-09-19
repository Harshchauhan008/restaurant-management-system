package com.restaurant.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "reservation_number",
            nullable = false,
            unique = true
    )
    private String reservationNumber;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_phone", nullable = false)
    private String customerPhone;

    @Column(name = "customer_email")
    private String customerEmail;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    @Column(name = "reservation_date", nullable = false)
    private LocalDate reservationDate;

    @Column(name = "reservation_time", nullable = false)
    private LocalTime reservationTime;

    @Column(name = "party_size", nullable = false)
    private Integer partySize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status =
            ReservationStatus.PENDING;

    @Column
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt =
            LocalDateTime.now();

    public Reservation() {
    }

    public Long getId() {
        return id;
    }

    public String getReservationNumber() {
        return reservationNumber;
    }

    public void setReservationNumber(
            String reservationNumber
    ) {
        this.reservationNumber =
                reservationNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(
            String customerName
    ) {
        this.customerName =
                customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(
            String customerPhone
    ) {
        this.customerPhone =
                customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(
            String customerEmail
    ) {
        this.customerEmail =
                customerEmail;
    }

    public RestaurantTable getTable() {
        return table;
    }

    public void setTable(
            RestaurantTable table
    ) {
        this.table = table;
    }

    public LocalDate getReservationDate() {
        return reservationDate;
    }

    public void setReservationDate(
            LocalDate reservationDate
    ) {
        this.reservationDate =
                reservationDate;
    }

    public LocalTime getReservationTime() {
        return reservationTime;
    }

    public void setReservationTime(
            LocalTime reservationTime
    ) {
        this.reservationTime =
                reservationTime;
    }

    public Integer getPartySize() {
        return partySize;
    }

    public void setPartySize(
            Integer partySize
    ) {
        this.partySize =
                partySize;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(
            ReservationStatus status
    ) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(
            String notes
    ) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}