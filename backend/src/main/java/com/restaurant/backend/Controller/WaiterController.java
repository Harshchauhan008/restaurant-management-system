package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.OrderService;
import com.restaurant.backend.dto.WaiterOrderResponse;
import com.restaurant.backend.entity.OrderStatus;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/waiter")
public class WaiterController {

    private final OrderService orderService;

    public WaiterController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/orders")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('WAITER') or " +
            "hasAuthority('VIEW_READY_ORDERS')"
    )
    public List<WaiterOrderResponse> getReadyOrders() {

        return orderService.getReadyOrdersForLoggedInWaiter();
    }

    @PatchMapping("/orders/{id}/status")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('WAITER') or " +
            "hasAuthority('UPDATE_SERVICE_STATUS')"
    )
    public WaiterOrderResponse updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status
    ) {

        return orderService.updateServiceStatus(
                id,
                status
        );
    }
}