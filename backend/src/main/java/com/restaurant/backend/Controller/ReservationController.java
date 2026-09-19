package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.ReservationService;
import com.restaurant.backend.dto.AvailableTableResponse;
import com.restaurant.backend.dto.ReservationRequest;
import com.restaurant.backend.dto.ReservationResponse;
import com.restaurant.backend.entity.ReservationStatus;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(
            ReservationService reservationService
    ) {
        this.reservationService = reservationService;
    }

    // =====================================================
    // CREATE RESERVATION
    // =====================================================

    @PostMapping
    public ReservationResponse createReservation(
            @RequestBody ReservationRequest request
    ) {
        return reservationService.createReservation(request);
    }

    // =====================================================
    // CHECK TABLE AVAILABILITY
    // =====================================================

    @GetMapping("/availability")
    public boolean checkTableAvailability(
            @RequestParam Long tableId,
            @RequestParam LocalDate date,
            @RequestParam LocalTime time,
            @RequestParam Integer partySize
    ) {
        return reservationService.isTableAvailable(
                tableId,
                date,
                time,
                partySize
        );
    }

    // =====================================================
    // GET ALL RESERVATIONS
    // =====================================================

    @GetMapping
    public List<ReservationResponse> getAllReservations() {
        return reservationService.getAllReservations();
    }

    // =====================================================
    // GET BY STATUS
    // =====================================================

    @GetMapping("/status/{status}")
    public List<ReservationResponse> getReservationsByStatus(
            @PathVariable ReservationStatus status
    ) {
        return reservationService.getReservationsByStatus(status);
    }

    // =====================================================
    // GET AVAILABLE TABLES
    // =====================================================

    @GetMapping("/available-tables")
    public List<AvailableTableResponse> getAvailableTables(
            @RequestParam LocalDate date,
            @RequestParam LocalTime time,
            @RequestParam Integer partySize
    ) {
        return reservationService.getAvailableTables(
                date,
                time,
                partySize
        );
    }

    // =====================================================
    // GET ONE RESERVATION
    // =====================================================

    @GetMapping("/{id}")
    public ReservationResponse getReservation(
            @PathVariable Long id
    ) {
        return reservationService.getReservation(id);
    }

    // =====================================================
    // CONFIRM RESERVATION
    // =====================================================

    @PatchMapping("/{id}/confirm")
    public ReservationResponse confirmReservation(
            @PathVariable Long id
    ) {
        return reservationService.confirmReservation(id);
    }

    // =====================================================
    // CANCEL RESERVATION
    // =====================================================

    @PatchMapping("/{id}/cancel")
    public ReservationResponse cancelReservation(
            @PathVariable Long id
    ) {
        return reservationService.cancelReservation(id);
    }

    // =====================================================
    // SEAT RESERVATION
    // =====================================================

    @PatchMapping("/{id}/seat")
    public ReservationResponse seatReservation(
            @PathVariable Long id
    ) {
        return reservationService.seatReservation(id);
    }

    // =====================================================
    // COMPLETE RESERVATION
    // =====================================================

    @PatchMapping("/{id}/complete")
    public ReservationResponse completeReservation(
            @PathVariable Long id
    ) {
        return reservationService.completeReservation(id);
    }
}