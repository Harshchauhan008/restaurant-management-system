package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.ReservationService;

import com.restaurant.backend.dto.ReservationResponse;

import com.restaurant.backend.entity.ReservationStatus;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reception/reservations")
public class ReceptionReservationController {

    private final ReservationService reservationService;

    public ReceptionReservationController(
            ReservationService reservationService
    ) {
        this.reservationService = reservationService;
    }


    // =====================================================
    // GET ALL RESERVATIONS
    // =====================================================

    @GetMapping
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTION') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('VIEW_DASHBOARD')"
    )
    public List<ReservationResponse> getReservations() {

        return reservationService.getAllReservations();
    }


    // =====================================================
    // GET RESERVATIONS BY STATUS
    // =====================================================

    @GetMapping("/status/{status}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTION') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('VIEW_DASHBOARD')"
    )
    public List<ReservationResponse> getReservationsByStatus(
            @PathVariable ReservationStatus status
    ) {

        return reservationService
                .getReservationsByStatus(status);
    }


    // =====================================================
    // GET ONE RESERVATION
    // =====================================================

    @GetMapping("/{id}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTION') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('VIEW_DASHBOARD')"
    )
    public ReservationResponse getReservation(
            @PathVariable Long id
    ) {

        return reservationService
                .getReservation(id);
    }


    // =====================================================
    // CONFIRM RESERVATION
    // =====================================================

    @PatchMapping("/{id}/confirm")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTION') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('MANAGE_RESERVATIONS')"
    )
    public ReservationResponse confirmReservation(
            @PathVariable Long id
    ) {

        return reservationService
                .confirmReservation(id);
    }


    // =====================================================
    // CANCEL RESERVATION
    // =====================================================

    @PatchMapping("/{id}/cancel")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTION') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('MANAGE_RESERVATIONS')"
    )
    public ReservationResponse cancelReservation(
            @PathVariable Long id
    ) {

        return reservationService
                .cancelReservation(id);
    }


    // =====================================================
    // SEAT CUSTOMER
    // =====================================================

    @PatchMapping("/{id}/seat")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTION') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('MANAGE_RESERVATIONS')"
    )
    public ReservationResponse seatReservation(
            @PathVariable Long id
    ) {

        return reservationService
                .seatReservation(id);
    }


    // =====================================================
    // COMPLETE RESERVATION
    // =====================================================

    @PatchMapping("/{id}/complete")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTION') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('MANAGE_RESERVATIONS')"
    )
    public ReservationResponse completeReservation(
            @PathVariable Long id
    ) {

        return reservationService
                .completeReservation(id);
    }
}