package com.restaurant.backend.Service;

import com.restaurant.backend.Exception.ConflictException;
import com.restaurant.backend.Exception.ResourceNotFoundException;

import com.restaurant.backend.Repository.RestaurantTableRepository;

import com.restaurant.backend.dto.CreateTableRequest;
import com.restaurant.backend.dto.QRResponse;
import com.restaurant.backend.dto.TablePublicResponse;
import com.restaurant.backend.dto.TableResponse;

import com.restaurant.backend.entity.AuditAction;
import com.restaurant.backend.entity.RestaurantTable;
import com.restaurant.backend.entity.TableStatus;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final QRCodeService qrCodeService;
    private final AuditLogService auditLogService;

    /*
     * Frontend URL comes from application.properties.
     *
     * Development:
     * http://localhost:5173
     *
     * Production:
     * https://yourrestaurant.com
     */
    @Value("${app.frontend.url}")
    private String frontendUrl;

    public RestaurantTableService(
            RestaurantTableRepository tableRepository,
            QRCodeService qrCodeService,
            AuditLogService auditLogService
    ) {
        this.tableRepository = tableRepository;
        this.qrCodeService = qrCodeService;
        this.auditLogService = auditLogService;
    }


    // =====================================================
    // CREATE TABLE
    // =====================================================

    @Transactional
    public TableResponse createTable(
            CreateTableRequest request
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "Create table request is required"
            );
        }

        if (request.getTableNumber() == null ||
                request.getTableNumber().isBlank()) {

            throw new IllegalArgumentException(
                    "Table number is required"
            );
        }

        if (request.getCapacity() == null ||
                request.getCapacity() <= 0) {

            throw new IllegalArgumentException(
                    "Table capacity must be greater than zero"
            );
        }

        String tableNumber =
                request.getTableNumber().trim();

        if (tableRepository.existsByTableNumber(
                tableNumber
        )) {

            throw new ConflictException(
                    "Table number already exists: "
                            + tableNumber
            );
        }

        RestaurantTable table =
                new RestaurantTable();

        table.setTableNumber(
                tableNumber
        );

        table.setCapacity(
                request.getCapacity()
        );

        table.setLocation(
                request.getLocation()
        );

        table.setQrToken(
                UUID.randomUUID().toString()
        );

        RestaurantTable saved =
                tableRepository.save(table);

        // -------------------------------------------------
        // AUDIT
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.CREATE_TABLE,
                "TABLE",
                saved.getId(),
                "Created table " +
                        saved.getTableNumber()
        );

        return toResponse(saved);
    }


    // =====================================================
    // GET ALL TABLES
    // =====================================================

    @Transactional(readOnly = true)
    public List<TableResponse> getAllTables() {

        return tableRepository
                .findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =====================================================
    // GET TABLE BY ID
    // =====================================================

    @Transactional(readOnly = true)
    public TableResponse getTable(
            Long id
    ) {

        if (id == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        RestaurantTable table =
                tableRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Table not found: " + id
                                )
                        );

        return toResponse(table);
    }


    // =====================================================
    // ADMIN - DIRECT STATUS UPDATE
    // =====================================================

    @Transactional
    public TableResponse updateStatus(
            Long id,
            String status
    ) {

        if (id == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        if (status == null ||
                status.isBlank()) {

            throw new IllegalArgumentException(
                    "Table status is required"
            );
        }

        RestaurantTable table =
                tableRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Table not found: " + id
                                )
                        );

        TableStatus newStatus;

        try {

            newStatus =
                    TableStatus.valueOf(
                            status.trim().toUpperCase()
                    );

        } catch (IllegalArgumentException ex) {

            throw new IllegalArgumentException(
                    "Invalid table status: " + status
            );
        }

        TableStatus oldStatus =
                table.getStatus();

        table.setStatus(
                newStatus
        );

        RestaurantTable updated =
                tableRepository.save(table);

        // -------------------------------------------------
        // AUDIT
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.CHANGE_TABLE_STATUS,
                "TABLE",
                updated.getId(),
                "Changed table " +
                        updated.getTableNumber() +
                        " status from " +
                        oldStatus +
                        " to " +
                        newStatus
        );

        return toResponse(updated);
    }


    // =====================================================
    // DISABLE TABLE
    // =====================================================

    @Transactional
    public void disableTable(
            Long id
    ) {

        if (id == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        RestaurantTable table =
                tableRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Table not found: " + id
                                )
                        );

        if (!table.isActive()) {

            throw new ConflictException(
                    "Table is already inactive"
            );
        }

        table.setActive(false);

        RestaurantTable saved =
                tableRepository.save(table);

        // -------------------------------------------------
        // AUDIT
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.DISABLE_TABLE,
                "TABLE",
                saved.getId(),
                "Disabled table " +
                        saved.getTableNumber()
        );
    }


    // =====================================================
    // VERIFY QR TOKEN
    // =====================================================

    @Transactional(readOnly = true)
    public TablePublicResponse verifyQrToken(
            String qrToken
    ) {

        if (qrToken == null ||
                qrToken.isBlank()) {

            throw new IllegalArgumentException(
                    "QR token is required"
            );
        }

        RestaurantTable table =
                tableRepository.findByQrToken(
                        qrToken.trim()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Invalid QR code"
                        )
                );

        if (!table.isActive()) {

            throw new ConflictException(
                    "This table is inactive"
            );
        }

        return new TablePublicResponse(
                true,
                table.getId(),
                table.getTableNumber(),
                table.getCapacity()
        );
    }


    // =====================================================
    // RECEPTION - SAFE TABLE STATUS CHANGE
    // =====================================================

    @Transactional
    public TableResponse changeTableStatus(
            Long tableId,
            TableStatus newStatus
    ) {

        if (tableId == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        if (newStatus == null) {

            throw new IllegalArgumentException(
                    "New table status is required"
            );
        }

        RestaurantTable table =
                tableRepository.findById(tableId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Table not found: "
                                                + tableId
                                )
                        );

        if (!table.isActive()) {

            throw new ConflictException(
                    "Table is inactive"
            );
        }

        TableStatus currentStatus =
                table.getStatus();

        // ---------------------------------------------
        // SAME STATUS
        // ---------------------------------------------

        if (currentStatus == newStatus) {

            throw new ConflictException(
                    "Table is already " +
                    newStatus
            );
        }

        // ---------------------------------------------
        // AVAILABLE -> RESERVED
        // ---------------------------------------------

        if (currentStatus ==
                TableStatus.AVAILABLE &&
                newStatus ==
                        TableStatus.RESERVED) {

            table.setStatus(
                    TableStatus.RESERVED
            );
        }

        // ---------------------------------------------
        // RESERVED -> AVAILABLE
        // ---------------------------------------------

        else if (currentStatus ==
                TableStatus.RESERVED &&
                newStatus ==
                        TableStatus.AVAILABLE) {

            table.setStatus(
                    TableStatus.AVAILABLE
            );
        }

        // ---------------------------------------------
        // RESERVED -> OCCUPIED
        // ---------------------------------------------

        else if (currentStatus ==
                TableStatus.RESERVED &&
                newStatus ==
                        TableStatus.OCCUPIED) {

            table.setStatus(
                    TableStatus.OCCUPIED
            );
        }

        // ---------------------------------------------
        // AVAILABLE -> OCCUPIED
        // ---------------------------------------------

        else if (currentStatus ==
                TableStatus.AVAILABLE &&
                newStatus ==
                        TableStatus.OCCUPIED) {

            table.setStatus(
                    TableStatus.OCCUPIED
            );
        }

        // ---------------------------------------------
        // OCCUPIED -> AVAILABLE
        // ---------------------------------------------

        else if (currentStatus ==
                TableStatus.OCCUPIED &&
                newStatus ==
                        TableStatus.AVAILABLE) {

            throw new ConflictException(
                    "Occupied table cannot be manually " +
                    "made available. Complete the order " +
                    "and bill first."
            );
        }

        // ---------------------------------------------
        // INVALID TRANSITION
        // ---------------------------------------------

        else {

            throw new ConflictException(
                    "Invalid table status transition: "
                            + currentStatus
                            + " -> "
                            + newStatus
            );
        }

        RestaurantTable saved =
                tableRepository.save(table);

        // -------------------------------------------------
        // AUDIT
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.CHANGE_TABLE_STATUS,
                "TABLE",
                saved.getId(),
                "Changed table " +
                        saved.getTableNumber() +
                        " status from " +
                        currentStatus +
                        " to " +
                        newStatus
        );

        return toResponse(saved);
    }


    // =====================================================
    // GET CURRENT QR INFORMATION
    // =====================================================

    @Transactional(readOnly = true)
    public QRResponse getQR(
            Long tableId
    ) {

        if (tableId == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        RestaurantTable table =
                tableRepository.findById(tableId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Table not found: "
                                                + tableId
                                )
                        );

        if (!table.isActive()) {

            throw new ConflictException(
                    "Cannot get QR for inactive table"
            );
        }

        String orderUrl =
                buildOrderUrl(
                        table.getQrToken()
                );

        return new QRResponse(
                table.getId(),
                table.getTableNumber(),
                table.getQrToken(),
                orderUrl
        );
    }


    // =====================================================
    // REGENERATE QR
    // =====================================================

    @Transactional
    public QRResponse regenerateQR(
            Long tableId
    ) {

        if (tableId == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        RestaurantTable table =
                tableRepository.findById(tableId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Table not found: "
                                                + tableId
                                )
                        );

        if (!table.isActive()) {

            throw new ConflictException(
                    "Cannot regenerate QR for inactive table"
            );
        }

        String oldToken =
                table.getQrToken();

        String newToken =
                UUID.randomUUID().toString();

        while (newToken.equals(oldToken)) {

            newToken =
                    UUID.randomUUID().toString();
        }

        table.setQrToken(
                newToken
        );

        RestaurantTable saved =
                tableRepository.save(table);

        String orderUrl =
                buildOrderUrl(
                        saved.getQrToken()
                );

        // -------------------------------------------------
        // AUDIT
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.REGENERATE_QR,
                "TABLE",
                saved.getId(),
                "Regenerated QR for table " +
                        saved.getTableNumber()
        );

        return new QRResponse(
                saved.getId(),
                saved.getTableNumber(),
                saved.getQrToken(),
                orderUrl
        );
    }


    // =====================================================
    // GENERATE QR IMAGE
    // =====================================================

    @Transactional(readOnly = true)
    public byte[] generateTableQR(
            Long tableId
    ) {

        if (tableId == null) {

            throw new IllegalArgumentException(
                    "Table ID is required"
            );
        }

        RestaurantTable table =
                tableRepository.findById(tableId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Table not found: "
                                                + tableId
                                )
                        );

        if (!table.isActive()) {

            throw new ConflictException(
                    "Cannot generate QR for inactive table"
            );
        }

        String orderUrl =
                buildOrderUrl(
                        table.getQrToken()
                );

        return qrCodeService.generateQRCode(
                orderUrl,
                500,
                500
        );
    }


    // =====================================================
    // BUILD ORDER URL
    // =====================================================

    private String buildOrderUrl(
            String qrToken
    ) {

        if (frontendUrl == null ||
                frontendUrl.isBlank()) {

            throw new IllegalArgumentException(
                    "Frontend URL is not configured"
            );
        }

        if (qrToken == null ||
                qrToken.isBlank()) {

            throw new IllegalArgumentException(
                    "Table does not have a QR token"
            );
        }

        /*
         * Remove trailing slash so we don't get:
         *
         * http://localhost:5173//menu
         */
        String baseUrl =
                frontendUrl.trim();

        while (baseUrl.endsWith("/")) {

            baseUrl =
                    baseUrl.substring(
                            0,
                            baseUrl.length() - 1
                    );
        }

        return baseUrl
                + "/menu?table="
                + qrToken;
    }


    // =====================================================
    // RESPONSE MAPPER
    // =====================================================

    private TableResponse toResponse(
            RestaurantTable table
    ) {

        return new TableResponse(
                table.getId(),
                table.getTableNumber(),
                table.getCapacity(),
                table.getLocation(),
                table.getStatus().name(),
                table.isActive(),
                table.getQrToken()
        );
    }
}