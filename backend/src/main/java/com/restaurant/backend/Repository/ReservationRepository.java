package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.Reservation;
import com.restaurant.backend.entity.ReservationStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository
        extends JpaRepository<Reservation, Long> {

    // =====================================================
    // ALL RESERVATIONS
    // =====================================================

    List<Reservation>
    findAllByOrderByReservationDateAscReservationTimeAsc();


    // =====================================================
    // RESERVATIONS BY STATUS
    // =====================================================

    List<Reservation>
    findByStatusOrderByReservationDateAscReservationTimeAsc(
            ReservationStatus status
    );


    // =====================================================
    // RESERVATIONS FOR ONE TABLE ON ONE DATE
    // =====================================================

    List<Reservation>
    findByTableIdAndReservationDateAndStatusIn(
            Long tableId,
            LocalDate reservationDate,
            List<ReservationStatus> statuses
    );
}