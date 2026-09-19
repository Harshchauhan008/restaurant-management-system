package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.BillService;
import com.restaurant.backend.dto.BillResponse;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;

    public BillController(
            BillService billService
    ) {
        this.billService = billService;
    }

    // =====================================================
    // GET ALL BILLS
    // =====================================================

    @GetMapping
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION')"
    )
    public List<BillResponse> getAllBills() {

        return billService.getAllBills();
    }

    // =====================================================
    // GET BILLS BY DATE RANGE
    // =====================================================

    @GetMapping("/range")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION')"
    )
    public List<BillResponse> getBillsByDateRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end
    ) {

        return billService.getBillsByDateRange(start, end);
    }

    // =====================================================
    // GENERATE FINAL BILL
    // =====================================================

    @PostMapping("/generate/{orderId}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION')"
    )
    public BillResponse generateBill(
            @PathVariable Long orderId
    ) {
        return billService.generateBill(orderId);
    }

    // =====================================================
    // GET BILL
    // =====================================================

    @GetMapping("/{billId}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION')"
    )
    public BillResponse getBill(
            @PathVariable Long billId
    ) {
        return billService.getBill(billId);
    }

    // =====================================================
    // MARK BILL PRINTED
    // =====================================================

    @PatchMapping("/{billId}/printed")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION')"
    )
    public BillResponse markPrinted(
            @PathVariable Long billId
    ) {
        return billService.markPrinted(billId);
    }

    // =====================================================
    // PRINT RECEIPT
    // =====================================================

    @GetMapping("/{billId}/print")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER') or " +
            "hasRole('RECEPTION')"
    )
    public String printBill(
            @PathVariable Long billId
    ) {
        return billService.printBill(billId);
    }

    // =====================================================
    // MARK BILL PAID
    // =====================================================

    @PatchMapping("/{billId}/paid")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasRole('CASHIER')"
    )
    public BillResponse markPaid(
            @PathVariable Long billId
    ) {
        return billService.markPaid(billId);
    }
}