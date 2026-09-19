package com.restaurant.backend.Controller;

import com.restaurant.backend.dto.TablePublicResponse;
import com.restaurant.backend.Service.RestaurantTableService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/table")
public class PublicTableController {

    private final RestaurantTableService tableService;

    public PublicTableController(
            RestaurantTableService tableService
    ) {
        this.tableService = tableService;
    }

    @GetMapping("/verify/{qrToken}")
    public TablePublicResponse verifyTable(
            @PathVariable String qrToken
    ) {
        return tableService.verifyQrToken(qrToken);
    }
}