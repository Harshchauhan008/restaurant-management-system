package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.RestaurantTableService;
import com.restaurant.backend.dto.QRResponse;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/tables")
public class AdminTableController {

    private final RestaurantTableService tableService;

    public AdminTableController(
            RestaurantTableService tableService
    ) {
        this.tableService = tableService;
    }

    // =========================================
    // GET QR INFORMATION
    // =========================================

    @GetMapping("/{tableId}/qr")
    @PreAuthorize("hasRole('ADMIN')")
    public QRResponse getQR(
            @PathVariable Long tableId
    ) {

        return tableService.getQR(tableId);
    }

    // =========================================
    // REGENERATE QR
    // =========================================

    @PostMapping("/{tableId}/qr/regenerate")
    @PreAuthorize("hasRole('ADMIN')")
    public QRResponse regenerateQR(
            @PathVariable Long tableId
    ) {

        return tableService.regenerateQR(tableId);
    }

    // =========================================
    // GENERATE QR IMAGE
    // =========================================

    @GetMapping(
            value = "/{tableId}/qr/image",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> getQRImage(
            @PathVariable Long tableId
    ) {

        byte[] qrImage =
                tableService.generateTableQR(
                        tableId
                );

        return ResponseEntity
                .ok()
                .contentType(
                        MediaType.IMAGE_PNG
                )
                .body(qrImage);
    }
}