package com.restaurant.backend.dto;

import java.math.BigDecimal;

public class ReportChartPointResponse {

    private String label;
    private BigDecimal value;

    public ReportChartPointResponse() {
    }

    public ReportChartPointResponse(
            String label,
            BigDecimal value
    ) {
        this.label = label;
        this.value = value;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(
            String label
    ) {
        this.label = label;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(
            BigDecimal value
    ) {
        this.value = value;
    }
}