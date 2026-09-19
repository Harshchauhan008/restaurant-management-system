package com.restaurant.backend.Controller;

import com.restaurant.backend.Repository.UserRepository;

import com.restaurant.backend.Service.OrderService;
import com.restaurant.backend.Service.ReceptionService;
import com.restaurant.backend.Service.RestaurantTableService;

import com.restaurant.backend.dto.OrderResponse;
import com.restaurant.backend.dto.ReceptionDashboardResponse;
import com.restaurant.backend.dto.ReceptionOrderResponse;
import com.restaurant.backend.dto.ReceptionTableResponse;
import com.restaurant.backend.dto.TableResponse;
import com.restaurant.backend.dto.WaiterResponse;

import com.restaurant.backend.entity.OrderStatus;
import com.restaurant.backend.entity.Role;
import com.restaurant.backend.entity.TableStatus;
import com.restaurant.backend.entity.User;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reception")
public class ReceptionController {

    private final ReceptionService receptionService;
    private final OrderService orderService;
    private final UserRepository userRepository;
    private final RestaurantTableService tableService;

    public ReceptionController(
            ReceptionService receptionService,
            OrderService orderService,
            UserRepository userRepository,
            RestaurantTableService tableService
    ) {
        this.receptionService = receptionService;
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.tableService = tableService;
    }

    // =====================================================
    // DASHBOARD
    // =====================================================

    @GetMapping("/dashboard")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTIONIST') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('VIEW_DASHBOARD')"
    )
    public ReceptionDashboardResponse getDashboard() {
        return receptionService.getDashboard();
    }

    // =====================================================
    // ALL ORDERS
    // =====================================================

    @GetMapping("/orders")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTIONIST') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('VIEW_ALL_ORDERS')"
    )
    public List<ReceptionOrderResponse> getOrders() {
        return orderService.getAllReceptionOrders();
    }

    // =====================================================
    // ORDERS BY STATUS
    // =====================================================

    @GetMapping("/orders/status/{status}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTIONIST') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('VIEW_ALL_ORDERS')"
    )
    public List<ReceptionOrderResponse> getOrdersByStatus(
            @PathVariable OrderStatus status
    ) {
        return orderService.getReceptionOrdersByStatus(status);
    }

    // =====================================================
    // ACTIVE WAITERS
    // =====================================================

    @GetMapping("/waiters")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTIONIST') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('ASSIGN_WAITER')"
    )
    public List<WaiterResponse> getWaiters() {

        return userRepository
                .findByRoleAndActiveTrue(Role.WAITER)
                .stream()
                .map(waiter -> new WaiterResponse(
                        waiter.getId(),
                        waiter.getEmployeeId(),
                        waiter.getFullName(),
                        waiter.getRole().name(),
                        waiter.isActive()
                ))
                .toList();
    }

    // =====================================================
    // ASSIGN / REASSIGN WAITER
    // =====================================================

    @PatchMapping("/orders/{orderId}/assign-waiter/{waiterId}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTIONIST') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('ASSIGN_WAITER')"
    )
    public OrderResponse assignWaiter(
            @PathVariable Long orderId,
            @PathVariable Long waiterId
    ) {
        return orderService.assignWaiter(orderId, waiterId);
    }

    // =====================================================
    // ALL TABLES
    // =====================================================

    @GetMapping("/tables")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTIONIST') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('VIEW_ALL_TABLES')"
    )
    public List<ReceptionTableResponse> getTables() {
        return receptionService.getTables();
    }

    // =====================================================
    // CHANGE TABLE STATUS
    // =====================================================

    @PatchMapping("/tables/{tableId}/status")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('RECEPTIONIST') or " +
            "hasRole('CASHIER') or " +
            "hasAuthority('MANAGE_TABLES')"
    )
    public TableResponse changeTableStatus(
            @PathVariable Long tableId,
            @RequestParam TableStatus status
    ) {
        return tableService.changeTableStatus(tableId, status);
    }

    // =====================================================
    // WAITER RESPONSE
    // =====================================================

    private WaiterResponse toWaiterResponse(User waiter) {

        return new WaiterResponse(
                waiter.getId(),
                waiter.getEmployeeId(),
                waiter.getFullName(),
                waiter.getRole().name(),
                waiter.isActive()
        );
    }
}