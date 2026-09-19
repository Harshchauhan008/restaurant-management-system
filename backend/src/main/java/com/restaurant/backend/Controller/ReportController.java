package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.ReportService;
import com.restaurant.backend.dto.ReportResponse;
import com.restaurant.backend.entity.ReportPeriod;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(
            ReportService reportService
    ) {
        this.reportService = reportService;
    }

    // =====================================================
    // GENERATE REPORT
    // =====================================================

    @GetMapping
    public ReportResponse generateReport(

            @RequestParam(
                    defaultValue = "MONTH"
            )
            ReportPeriod period,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date

    ) {

        if (date == null) {
            date = LocalDate.now();
        }

        return reportService.generateReport(
                period,
                date
        );
    }
}