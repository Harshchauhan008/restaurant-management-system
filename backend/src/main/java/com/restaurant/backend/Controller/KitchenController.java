package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.OrderService;
import com.restaurant.backend.dto.KitchenOrderResponse;
import com.restaurant.backend.entity.OrderStatus;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kitchen")
public class KitchenController {

    private final OrderService orderService;

    public KitchenController(
            OrderService orderService
    ) {
        this.orderService = orderService;
    }

    @GetMapping("/orders")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('KITCHEN') or " +
            "hasAuthority('VIEW_KITCHEN_ORDERS')"
    )
    public List<KitchenOrderResponse> getOrders() {

        return orderService.getKitchenOrders();
    }

    @GetMapping("/orders/status/{status}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('KITCHEN') or " +
            "hasAuthority('VIEW_KITCHEN_ORDERS')"
    )
    public List<KitchenOrderResponse> getOrdersByStatus(
            @PathVariable OrderStatus status
    ) {

        return orderService.getOrdersByKitchenStatus(status);
    }

    @PatchMapping("/orders/{id}/status")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('KITCHEN') or " +
            "hasAuthority('UPDATE_KITCHEN_STATUS')"
    )
    public KitchenOrderResponse updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status
    ) {

        return orderService.updateKitchenStatus(
                id,
                status
        );
    }
}