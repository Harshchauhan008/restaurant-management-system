package com.restaurant.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class ReservationResponse {

    private Long id;
    private String reservationNumber;

    private String customerName;
    private String customerPhone;
    private String customerEmail;

    private Long tableId;
    private String tableNumber;

    private LocalDate reservationDate;
    private LocalTime reservationTime;

    private Integer partySize;

    private String status;

    private String notes;

    public ReservationResponse(
            Long id,
            String reservationNumber,
            String customerName,
            String customerPhone,
            String customerEmail,
            Long tableId,
            String tableNumber,
            LocalDate reservationDate,
            LocalTime reservationTime,
            Integer partySize,
            String status,
            String notes
    ) {
        this.id = id;
        this.reservationNumber = reservationNumber;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.customerEmail = customerEmail;
        this.tableId = tableId;
        this.tableNumber = tableNumber;
        this.reservationDate = reservationDate;
        this.reservationTime = reservationTime;
        this.partySize = partySize;
        this.status = status;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public String getReservationNumber() {
        return reservationNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public Long getTableId() {
        return tableId;
    }

    public String getTableNumber() {
        return tableNumber;
    }

    public LocalDate getReservationDate() {
        return reservationDate;
    }

    public LocalTime getReservationTime() {
        return reservationTime;
    }

    public Integer getPartySize() {
        return partySize;
    }

    public String getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }
}