package com.restaurant.backend.dto;

import java.util.List;

public class ReportResponse {

    private ReportSummaryResponse summary;

    private List<ReportChartPointResponse> chart;

    private List<TopSellingItemResponse> topSellingItems;

    public ReportResponse() {
    }

    public ReportResponse(
            ReportSummaryResponse summary,
            List<ReportChartPointResponse> chart,
            List<TopSellingItemResponse> topSellingItems
    ) {
        this.summary = summary;
        this.chart = chart;
        this.topSellingItems = topSellingItems;
    }

    public ReportSummaryResponse getSummary() {
        return summary;
    }

    public void setSummary(
            ReportSummaryResponse summary
    ) {
        this.summary = summary;
    }

    public List<ReportChartPointResponse> getChart() {
        return chart;
    }

    public void setChart(
            List<ReportChartPointResponse> chart
    ) {
        this.chart = chart;
    }

    public List<TopSellingItemResponse> getTopSellingItems() {
        return topSellingItems;
    }

    public void setTopSellingItems(
            List<TopSellingItemResponse> topSellingItems
    ) {
        this.topSellingItems = topSellingItems;
    }
}