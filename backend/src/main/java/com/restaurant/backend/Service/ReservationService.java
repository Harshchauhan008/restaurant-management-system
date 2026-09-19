package com.restaurant.backend.Service;

import com.restaurant.backend.Exception.ConflictException;
import com.restaurant.backend.Exception.ResourceNotFoundException;

import com.restaurant.backend.Repository.ReservationRepository;
import com.restaurant.backend.Repository.RestaurantTableRepository;

import com.restaurant.backend.dto.AvailableTableResponse;
import com.restaurant.backend.dto.ReservationRequest;
import com.restaurant.backend.dto.ReservationResponse;

import com.restaurant.backend.entity.AuditAction;
import com.restaurant.backend.entity.Reservation;
import com.restaurant.backend.entity.ReservationStatus;
import com.restaurant.backend.entity.RestaurantTable;
import com.restaurant.backend.entity.TableStatus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {

    /*
     * Each reservation blocks a table for 90 minutes.
     *
     * Example:
     *
     * 19:00 -> 20:30
     * 20:30 -> 22:00
     *
     * 20:00 would conflict with 19:00.
     */
    private static final long RESERVATION_DURATION_MINUTES = 90;

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    public ReservationService(
            ReservationRepository reservationRepository,
            RestaurantTableRepository tableRepository,
            AuditLogService auditLogService,
            EmailService emailService
    ) {
        this.reservationRepository = reservationRepository;
        this.tableRepository = tableRepository;
        this.auditLogService = auditLogService;
        this.emailService = emailService;
    }


    // =====================================================
    // CREATE RESERVATION
    // =====================================================

    @Transactional
    public ReservationResponse createReservation(
            ReservationRequest request
    ) {

        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (request == null) {

            throw new IllegalArgumentException(
                    "Reservation request is required"
            );
        }

        if (request.getCustomerName() == null ||
                request.getCustomerName().isBlank()) {

            throw new IllegalArgumentException(
                    "Customer name is required"
            );
        }

        if (request.getCustomerPhone() == null ||
                request.getCustomerPhone().isBlank()) {

            throw new IllegalArgumentException(
                    "Customer phone is required"
            );
        }

        if (request.getTableId() == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        if (request.getReservationDate() == null) {

            throw new IllegalArgumentException(
                    "Reservation date is required"
            );
        }

        if (request.getReservationTime() == null) {

            throw new IllegalArgumentException(
                    "Reservation time is required"
            );
        }

        if (request.getPartySize() == null ||
                request.getPartySize() <= 0) {

            throw new IllegalArgumentException(
                    "Party size must be greater than zero"
            );
        }


        // -------------------------------------------------
        // DATE / TIME VALIDATION
        // -------------------------------------------------

        LocalDate today =
                LocalDate.now();

        LocalTime now =
                LocalTime.now();

        LocalDate reservationDate =
                request.getReservationDate();

        LocalTime reservationTime =
                request.getReservationTime();

        if (reservationDate.isBefore(today)) {

            throw new IllegalArgumentException(
                    "Reservation date cannot be in the past"
            );
        }

        if (reservationDate.isEqual(today) &&
                reservationTime.isBefore(now)) {

            throw new IllegalArgumentException(
                    "Reservation time cannot be in the past"
            );
        }


        // -------------------------------------------------
        // FIND TABLE
        // -------------------------------------------------

        RestaurantTable table =
                tableRepository.findById(
                        request.getTableId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Table not found: " +
                                        request.getTableId()
                        )
                );


        // -------------------------------------------------
        // TABLE ACTIVE CHECK
        // -------------------------------------------------

        if (!table.isActive()) {

            throw new ConflictException(
                    "Table " +
                            table.getTableNumber() +
                            " is inactive"
            );
        }


        // -------------------------------------------------
        // CAPACITY CHECK
        // -------------------------------------------------

        if (request.getPartySize() >
                table.getCapacity()) {

            throw new IllegalArgumentException(
                    "Party size exceeds table capacity. " +
                            "Table capacity is " +
                            table.getCapacity()
            );
        }


        // -------------------------------------------------
        // RESERVATION OVERLAP CHECK
        // -------------------------------------------------

        if (!isTableAvailable(
                table.getId(),
                reservationDate,
                reservationTime,
                request.getPartySize()
        )) {

            throw new ConflictException(
                    "Table " +
                            table.getTableNumber() +
                            " is not available for " +
                            reservationDate +
                            " at " +
                            reservationTime
            );
        }


        // -------------------------------------------------
        // CREATE RESERVATION
        // -------------------------------------------------

        Reservation reservation =
                new Reservation();

        reservation.setReservationNumber(
                "RES-" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase()
        );

        reservation.setCustomerName(
                request.getCustomerName().trim()
        );

        reservation.setCustomerPhone(
                request.getCustomerPhone().trim()
        );

        // -------------------------------------------------
        // CUSTOMER EMAIL
        // -------------------------------------------------

        if (request.getCustomerEmail() != null &&
                !request.getCustomerEmail().isBlank()) {

            reservation.setCustomerEmail(
                    request.getCustomerEmail().trim()
            );
        }

        reservation.setTable(
                table
        );

        reservation.setReservationDate(
                reservationDate
        );

        reservation.setReservationTime(
                reservationTime
        );

        reservation.setPartySize(
                request.getPartySize()
        );

        reservation.setStatus(
                ReservationStatus.PENDING
        );

        reservation.setNotes(
                request.getNotes()
        );

        Reservation saved =
                reservationRepository.save(
                        reservation
                );


        /*
         * IMPORTANT:
         *
         * Do NOT change table status here.
         *
         * A reservation may be for a future date.
         *
         * Example:
         *
         * Today       = September 1
         * Reservation = September 5, 19:30
         *
         * T01 remains AVAILABLE today.
         *
         * The physical table becomes OCCUPIED
         * only when the customer is actually seated.
         */


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.CREATE_RESERVATION,
                "RESERVATION",
                saved.getId(),
                "Created reservation " +
                        saved.getReservationNumber() +
                        " for " +
                        saved.getCustomerName() +
                        " at table " +
                        table.getTableNumber()
        );

        return toResponse(
                saved
        );
    }


    // =====================================================
    // GET ONE RESERVATION
    // =====================================================

    @Transactional(readOnly = true)
    public ReservationResponse getReservation(
            Long reservationId
    ) {

        Reservation reservation =
                getReservationEntity(
                        reservationId
                );

        return toResponse(
                reservation
        );
    }


    // =====================================================
    // GET ALL RESERVATIONS
    // =====================================================

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {

        return reservationRepository
                .findAllByOrderByReservationDateAscReservationTimeAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =====================================================
    // GET RESERVATIONS BY STATUS
    // =====================================================

    @Transactional(readOnly = true)
    public List<ReservationResponse> getReservationsByStatus(
            ReservationStatus status
    ) {

        if (status == null) {

            throw new IllegalArgumentException(
                    "Reservation status is required"
            );
        }

        return reservationRepository
                .findByStatusOrderByReservationDateAscReservationTimeAsc(
                        status
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =====================================================
    // CONFIRM RESERVATION
    // =====================================================

    @Transactional
    public ReservationResponse confirmReservation(
            Long reservationId
    ) {

        Reservation reservation =
                getReservationEntity(
                        reservationId
                );

        if (reservation.getStatus() !=
                ReservationStatus.PENDING) {

            throw new ConflictException(
                    "Only PENDING reservations can be confirmed"
            );
        }

        reservation.setStatus(
                ReservationStatus.CONFIRMED
        );

        Reservation saved =
                reservationRepository.save(
                        reservation
                );


        // -------------------------------------------------
        // SEND CONFIRMATION EMAIL
        // -------------------------------------------------

        if (saved.getCustomerEmail() != null &&
                !saved.getCustomerEmail().isBlank()) {

            try {

                emailService.sendReservationConfirmation(
                        saved
                );

            } catch (Exception e) {

                /*
                 * IMPORTANT:
                 *
                 * Email failure should NOT cancel
                 * the reservation confirmation.
                 *
                 * The reservation remains CONFIRMED.
                 */

                System.err.println(
                        "Failed to send reservation confirmation email for "
                                + saved.getReservationNumber()
                );

                e.printStackTrace();
            }
        }


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.CONFIRM_RESERVATION,
                "RESERVATION",
                saved.getId(),
                "Confirmed reservation " +
                        saved.getReservationNumber()
        );

        return toResponse(
                saved
        );
    }


    // =====================================================
    // CANCEL RESERVATION
    // =====================================================

    @Transactional
    public ReservationResponse cancelReservation(
            Long reservationId
    ) {

        Reservation reservation =
                getReservationEntity(
                        reservationId
                );

        ReservationStatus currentStatus =
                reservation.getStatus();

        if (currentStatus ==
                ReservationStatus.CANCELLED) {

            throw new ConflictException(
                    "Reservation is already cancelled"
            );
        }

        if (currentStatus ==
                ReservationStatus.COMPLETED) {

            throw new ConflictException(
                    "Completed reservation cannot be cancelled"
            );
        }

        if (currentStatus ==
                ReservationStatus.SEATED) {

            throw new ConflictException(
                    "Seated reservation cannot be cancelled"
            );
        }

        reservation.setStatus(
                ReservationStatus.CANCELLED
        );

        Reservation saved =
                reservationRepository.save(
                        reservation
                );

        auditLogService.log(
                AuditAction.CANCEL_RESERVATION,
                "RESERVATION",
                saved.getId(),
                "Cancelled reservation " +
                        saved.getReservationNumber()
        );

        return toResponse(
                saved
        );
    }


    // =====================================================
    // SEAT CUSTOMER
    // =====================================================

    @Transactional
    public ReservationResponse seatReservation(
            Long reservationId
    ) {

        Reservation reservation =
                getReservationEntity(
                        reservationId
                );

        if (reservation.getStatus() !=
                ReservationStatus.CONFIRMED) {

            throw new ConflictException(
                    "Only CONFIRMED reservations can be seated"
            );
        }


        // -------------------------------------------------
        // RESERVATION DATE / TIME CHECK
        // -------------------------------------------------

        LocalDate today =
                LocalDate.now();

        LocalTime now =
                LocalTime.now();

        LocalDate reservationDate =
                reservation.getReservationDate();

        LocalTime reservationTime =
                reservation.getReservationTime();

        if (reservationDate == null ||
                reservationTime == null) {

            throw new ConflictException(
                    "Reservation date and time are required"
            );
        }

        if (reservationDate.isAfter(today)) {

            throw new ConflictException(
                    "Reservation cannot be seated before " +
                            reservationDate +
                            " at " +
                            reservationTime
            );
        }

        if (reservationDate.isEqual(today) &&
                reservationTime.isAfter(now)) {

            throw new ConflictException(
                    "Reservation cannot be seated before " +
                            reservationTime
            );
        }


        // -------------------------------------------------
        // FIND TABLE
        // -------------------------------------------------

        RestaurantTable table =
                reservation.getTable();


        // -------------------------------------------------
        // TABLE EXISTS
        // -------------------------------------------------

        if (table == null) {

            throw new ResourceNotFoundException(
                    "Reservation has no table"
            );
        }


        // -------------------------------------------------
        // TABLE ACTIVE
        // -------------------------------------------------

        if (!table.isActive()) {

            throw new ConflictException(
                    "Table is inactive"
            );
        }


        // -------------------------------------------------
        // TABLE STATUS
        // -------------------------------------------------

        if (table.getStatus() !=
                TableStatus.AVAILABLE &&
                table.getStatus() !=
                        TableStatus.RESERVED) {

            throw new ConflictException(
                    "Table is currently " +
                            table.getStatus()
            );
        }


        // -------------------------------------------------
        // SEAT
        // -------------------------------------------------

        reservation.setStatus(
                ReservationStatus.SEATED
        );

        table.setStatus(
                TableStatus.OCCUPIED
        );

        tableRepository.save(
                table
        );

        Reservation saved =
                reservationRepository.save(
                        reservation
                );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.SEAT_RESERVATION,
                "RESERVATION",
                saved.getId(),
                "Seated reservation " +
                        saved.getReservationNumber() +
                        " at table " +
                        table.getTableNumber()
        );

        return toResponse(
                saved
        );
    }


    // =====================================================
    // COMPLETE RESERVATION
    // =====================================================

    @Transactional
    public ReservationResponse completeReservation(
            Long reservationId
    ) {

        Reservation reservation =
                getReservationEntity(
                        reservationId
                );

        if (reservation.getStatus() !=
                ReservationStatus.SEATED) {

            throw new ConflictException(
                    "Only SEATED reservations can be completed"
            );
        }

        reservation.setStatus(
                ReservationStatus.COMPLETED
        );

        /*
         * Do NOT make table AVAILABLE here.
         *
         * Final availability is controlled by:
         *
         * BILL PAID
         *      ↓
         * ORDER COMPLETED
         *      ↓
         * TABLE AVAILABLE
         */

        Reservation saved =
                reservationRepository.save(
                        reservation
                );

        auditLogService.log(
                AuditAction.COMPLETE_RESERVATION,
                "RESERVATION",
                saved.getId(),
                "Completed reservation " +
                        saved.getReservationNumber()
        );

        return toResponse(
                saved
        );
    }


    // =====================================================
    // CHECK ONE TABLE AVAILABILITY
    // =====================================================

    @Transactional(readOnly = true)
    public boolean isTableAvailable(
            Long tableId,
            LocalDate reservationDate,
            LocalTime reservationTime,
            Integer partySize
    ) {

        if (tableId == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        if (reservationDate == null) {

            throw new IllegalArgumentException(
                    "Reservation date is required"
            );
        }

        if (reservationTime == null) {

            throw new IllegalArgumentException(
                    "Reservation time is required"
            );
        }

        if (partySize == null ||
                partySize <= 0) {

            throw new IllegalArgumentException(
                    "Party size must be greater than zero"
            );
        }

        RestaurantTable table =
                tableRepository.findById(
                        tableId
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Table not found: " +
                                        tableId
                        )
                );

        if (!table.isActive()) {
            return false;
        }

        if (partySize >
                table.getCapacity()) {

            return false;
        }


        // -------------------------------------------------
        // BLOCKING RESERVATION STATUSES
        // -------------------------------------------------

        List<ReservationStatus> blockingStatuses =
                List.of(
                        ReservationStatus.PENDING,
                        ReservationStatus.CONFIRMED,
                        ReservationStatus.SEATED
                );


        List<Reservation> existingReservations =
                reservationRepository
                        .findByTableIdAndReservationDateAndStatusIn(
                                tableId,
                                reservationDate,
                                blockingStatuses
                        );


        // -------------------------------------------------
        // REQUESTED TIME RANGE
        // -------------------------------------------------

        LocalTime requestedStart =
                reservationTime;

        LocalTime requestedEnd =
                requestedStart.plusMinutes(
                        RESERVATION_DURATION_MINUTES
                );


        // -------------------------------------------------
        // CHECK EVERY EXISTING RESERVATION
        // -------------------------------------------------

        for (Reservation existing :
                existingReservations) {

            LocalTime existingStart =
                    existing.getReservationTime();

            LocalTime existingEnd =
                    existingStart.plusMinutes(
                            RESERVATION_DURATION_MINUTES
                    );

            boolean overlaps =
                    requestedStart.isBefore(
                            existingEnd
                    )
                            &&
                            requestedEnd.isAfter(
                                    existingStart
                            );

            if (overlaps) {

                return false;
            }
        }

        return true;
    }


    // =====================================================
    // GET ALL AVAILABLE TABLES
    // =====================================================

    @Transactional(readOnly = true)
    public List<AvailableTableResponse> getAvailableTables(
            LocalDate reservationDate,
            LocalTime reservationTime,
            Integer partySize
    ) {

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (reservationDate == null) {

            throw new IllegalArgumentException(
                    "Reservation date is required"
            );
        }

        if (reservationTime == null) {

            throw new IllegalArgumentException(
                    "Reservation time is required"
            );
        }

        if (partySize == null ||
                partySize <= 0) {

            throw new IllegalArgumentException(
                    "Party size must be greater than zero"
            );
        }


        // -------------------------------------------------
        // FUTURE / CURRENT TIME CHECK
        // -------------------------------------------------

        LocalDate today =
                LocalDate.now();

        LocalTime now =
                LocalTime.now();

        if (reservationDate.isBefore(today)) {

            throw new IllegalArgumentException(
                    "Reservation date cannot be in the past"
            );
        }

        if (reservationDate.isEqual(today) &&
                reservationTime.isBefore(now)) {

            throw new IllegalArgumentException(
                    "Reservation time cannot be in the past"
            );
        }


        // -------------------------------------------------
        // FIND SUITABLE TABLES
        // -------------------------------------------------

        return tableRepository
                .findAll()
                .stream()

                .filter(
                        RestaurantTable::isActive
                )

                .filter(
                        table ->
                                table.getCapacity() >= partySize
                )

                .filter(
                        table ->
                                isTableAvailable(
                                        table.getId(),
                                        reservationDate,
                                        reservationTime,
                                        partySize
                                )
                )

                .map(
                        table ->
                                new AvailableTableResponse(
                                        table.getId(),
                                        table.getTableNumber(),
                                        table.getCapacity(),
                                        table.getLocation(),
                                        true
                                )
                )

                .toList();
    }


    // =====================================================
    // GET RESERVATION ENTITY
    // =====================================================

    private Reservation getReservationEntity(
            Long reservationId
    ) {

        if (reservationId == null) {

            throw new IllegalArgumentException(
                    "Reservation ID is required"
            );
        }

        return reservationRepository
                .findById(
                        reservationId
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Reservation not found: " +
                                        reservationId
                        )
                );
    }


    // =====================================================
    // RESPONSE MAPPER
    // =====================================================

    private ReservationResponse toResponse(
            Reservation reservation
    ) {

        Long tableId = null;
        String tableNumber = null;

        if (reservation.getTable() != null) {

            tableId =
                    reservation.getTable()
                            .getId();

            tableNumber =
                    reservation.getTable()
                            .getTableNumber();
        }

        return new ReservationResponse(
                reservation.getId(),
                reservation.getReservationNumber(),
                reservation.getCustomerName(),
                reservation.getCustomerPhone(),
                reservation.getCustomerEmail(),
                tableId,
                tableNumber,
                reservation.getReservationDate(),
                reservation.getReservationTime(),
                reservation.getPartySize(),
                reservation.getStatus().name(),
                reservation.getNotes()
        );
    }
}