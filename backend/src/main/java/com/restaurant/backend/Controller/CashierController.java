package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.BillService;
import com.restaurant.backend.Service.OrderService;

import com.restaurant.backend.dto.BillResponse;
import com.restaurant.backend.dto.ReceptionOrderResponse;

import com.restaurant.backend.entity.OrderStatus;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cashier")
@PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'RECEPTION')")
public class CashierController {

    private final BillService billService;
    private final OrderService orderService;

    public CashierController(
            BillService billService,
            OrderService orderService
    ) {
        this.billService = billService;
        this.orderService = orderService;
    }


    // =====================================================
    // SERVED ORDERS
    // =====================================================

    /*
     * Cashier needs to see all orders that have been
     * served by the waiter and are now ready for billing.
     */
    @GetMapping("/orders/served")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION')"
    )
    public List<ReceptionOrderResponse> getServedOrders() {

        return orderService.getReceptionOrdersByStatus(
                OrderStatus.SERVED
        );
    }


    // =====================================================
    // GENERATE BILL
    // =====================================================

    @PostMapping("/bills/order/{orderId}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION') or " +
            "hasAuthority('CREATE_BILL')"
    )
    public BillResponse generateBill(
            @PathVariable Long orderId
    ) {
        return billService.generateBill(orderId);
    }


    // =====================================================
    // GET BILL
    // =====================================================

    @GetMapping("/bills/{billId}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION') or " +
            "hasAuthority('VIEW_SERVED_ORDERS')"
    )
    public BillResponse getBill(
            @PathVariable Long billId
    ) {
        return billService.getBill(billId);
    }


    // =====================================================
    // PRINT BILL
    // =====================================================

    @GetMapping("/bills/{billId}/print")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION') or " +
            "hasAuthority('PRINT_BILL')"
    )
    public String printBill(
            @PathVariable Long billId
    ) {
        return billService.printBill(billId);
    }


    // =====================================================
    // MARK BILL AS PRINTED
    // =====================================================

    @PatchMapping("/bills/{billId}/printed")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION') or " +
            "hasAuthority('PRINT_BILL')"
    )
    public BillResponse markPrinted(
            @PathVariable Long billId
    ) {
        return billService.markPrinted(billId);
    }


    // =====================================================
    // MARK PHYSICAL PAYMENT COLLECTED
    // =====================================================

    @PatchMapping("/bills/{billId}/paid")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION') or " +
            "hasAuthority('CONFIRM_CASH_COLLECTION')"
    )
    public BillResponse markPaid(
            @PathVariable Long billId
    ) {
        return billService.markPaid(billId);
    }
}