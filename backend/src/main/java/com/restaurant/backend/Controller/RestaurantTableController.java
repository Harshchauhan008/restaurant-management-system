package com.restaurant.backend.Controller;

import com.restaurant.backend.dto.CreateTableRequest;
import com.restaurant.backend.dto.TableResponse;
import com.restaurant.backend.Service.RestaurantTableService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tables")
@PreAuthorize("hasRole('ADMIN')")
public class RestaurantTableController {

    private final RestaurantTableService tableService;

    public RestaurantTableController(
            RestaurantTableService tableService
    ) {
        this.tableService = tableService;
    }


    // =====================================================
    // CREATE TABLE
    // =====================================================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TableResponse createTable(
            @RequestBody CreateTableRequest request
    ) {

        return tableService.createTable(
                request
        );
    }


    // =====================================================
    // GET ALL TABLES
    // =====================================================

    @GetMapping
    public List<TableResponse> getAllTables() {

        return tableService.getAllTables();
    }


    // =====================================================
    // GET TABLE
    // =====================================================

    @GetMapping("/{id}")
    public TableResponse getTable(
            @PathVariable Long id
    ) {

        return tableService.getTable(
                id
        );
    }


    // =====================================================
    // UPDATE TABLE STATUS
    // =====================================================

    @PatchMapping("/{id}/status")
    public TableResponse updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {

        return tableService.updateStatus(
                id,
                status
        );
    }


    // =====================================================
    // DISABLE TABLE
    // =====================================================

    @PatchMapping("/{id}/disable")
    public String disableTable(
            @PathVariable Long id
    ) {

        tableService.disableTable(
                id
        );

        return "Table disabled successfully";
    }
}