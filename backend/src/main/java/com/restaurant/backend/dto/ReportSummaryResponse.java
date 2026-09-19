package com.restaurant.backend.dto;

import java.math.BigDecimal;

public class ReportSummaryResponse {

    private BigDecimal totalSales;
    private BigDecimal totalTax;
    private BigDecimal totalDiscount;

    private long totalBills;
    private long paidBills;
    private long generatedBills;

    private long totalOrders;
    private long placedOrders;
    private long confirmedOrders;
    private long preparingOrders;
    private long readyOrders;
    private long servedOrders;
    private long cancelledOrders;

    public ReportSummaryResponse() {
    }

    public ReportSummaryResponse(
            BigDecimal totalSales,
            BigDecimal totalTax,
            BigDecimal totalDiscount,
            long totalBills,
            long paidBills,
            long generatedBills,
            long totalOrders,
            long placedOrders,
            long confirmedOrders,
            long preparingOrders,
            long readyOrders,
            long servedOrders,
            long cancelledOrders
    ) {
        this.totalSales = totalSales;
        this.totalTax = totalTax;
        this.totalDiscount = totalDiscount;
        this.totalBills = totalBills;
        this.paidBills = paidBills;
        this.generatedBills = generatedBills;
        this.totalOrders = totalOrders;
        this.placedOrders = placedOrders;
        this.confirmedOrders = confirmedOrders;
        this.preparingOrders = preparingOrders;
        this.readyOrders = readyOrders;
        this.servedOrders = servedOrders;
        this.cancelledOrders = cancelledOrders;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public void setTotalSales(BigDecimal totalSales) {
        this.totalSales = totalSales;
    }

    public BigDecimal getTotalTax() {
        return totalTax;
    }

    public void setTotalTax(BigDecimal totalTax) {
        this.totalTax = totalTax;
    }

    public BigDecimal getTotalDiscount() {
        return totalDiscount;
    }

    public void setTotalDiscount(BigDecimal totalDiscount) {
        this.totalDiscount = totalDiscount;
    }

    public long getTotalBills() {
        return totalBills;
    }

    public void setTotalBills(long totalBills) {
        this.totalBills = totalBills;
    }

    public long getPaidBills() {
        return paidBills;
    }

    public void setPaidBills(long paidBills) {
        this.paidBills = paidBills;
    }

    public long getGeneratedBills() {
        return generatedBills;
    }

    public void setGeneratedBills(long generatedBills) {
        this.generatedBills = generatedBills;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getPlacedOrders() {
        return placedOrders;
    }

    public void setPlacedOrders(long placedOrders) {
        this.placedOrders = placedOrders;
    }

    public long getConfirmedOrders() {
        return confirmedOrders;
    }

    public void setConfirmedOrders(long confirmedOrders) {
        this.confirmedOrders = confirmedOrders;
    }

    public long getPreparingOrders() {
        return preparingOrders;
    }

    public void setPreparingOrders(long preparingOrders) {
        this.preparingOrders = preparingOrders;
    }

    public long getReadyOrders() {
        return readyOrders;
    }

    public void setReadyOrders(long readyOrders) {
        this.readyOrders = readyOrders;
    }

    public long getServedOrders() {
        return servedOrders;
    }

    public void setServedOrders(long servedOrders) {
        this.servedOrders = servedOrders;
    }

    public long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(long cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }
}