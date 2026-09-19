package com.restaurant.backend.Service;

import com.restaurant.backend.Repository.BillRepository;
import com.restaurant.backend.Repository.OrderItemRepository;
import com.restaurant.backend.Repository.OrderRepository;

import com.restaurant.backend.dto.ReportChartPointResponse;
import com.restaurant.backend.dto.ReportResponse;
import com.restaurant.backend.dto.ReportSummaryResponse;
import com.restaurant.backend.dto.TopSellingItemResponse;

import com.restaurant.backend.entity.Bill;
import com.restaurant.backend.entity.BillStatus;
import com.restaurant.backend.entity.Order;
import com.restaurant.backend.entity.OrderItem;
import com.restaurant.backend.entity.OrderStatus;
import com.restaurant.backend.entity.ReportPeriod;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final BillRepository billRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public ReportService(
            BillRepository billRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.billRepository = billRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    // =====================================================
    // MAIN REPORT
    // =====================================================

    @Transactional(readOnly = true)
    public ReportResponse generateReport(
            ReportPeriod period,
            LocalDate date
    ) {

        if (period == null) {
            throw new IllegalArgumentException(
                    "Report period is required"
            );
        }

        if (date == null) {
            date = LocalDate.now();
        }

        LocalDateTime start;
        LocalDateTime end;

        switch (period) {

            case YEAR:

                start = date
                        .withDayOfYear(1)
                        .atStartOfDay();

                end = date
                        .plusYears(1)
                        .withDayOfYear(1)
                        .atStartOfDay()
                        .minusNanos(1);

                break;

            case MONTH:

                YearMonth yearMonth =
                        YearMonth.from(date);

                start = yearMonth
                        .atDay(1)
                        .atStartOfDay();

                end = yearMonth
                        .plusMonths(1)
                        .atDay(1)
                        .atStartOfDay()
                        .minusNanos(1);

                break;

            case WEEK:

                LocalDate weekStart =
                        date.with(
                                java.time.temporal.TemporalAdjusters
                                        .previousOrSame(
                                                DayOfWeek.MONDAY
                                        )
                        );

                start = weekStart.atStartOfDay();

                end = weekStart
                        .plusDays(7)
                        .atStartOfDay()
                        .minusNanos(1);

                break;

            case DAY:

                start = date.atStartOfDay();

                end = date
                        .plusDays(1)
                        .atStartOfDay()
                        .minusNanos(1);

                break;

            default:

                throw new IllegalArgumentException(
                        "Unsupported report period"
                );
        }

        List<Bill> bills =
                billRepository.findByCreatedAtBetween(
                        start,
                        end
                );

        List<Order> orders =
                orderRepository.findByCreatedAtBetween(
                        start,
                        end
                );

        List<OrderItem> orderItems =
                orderItemRepository.findByOrder_CreatedAtBetween(
                        start,
                        end
                );

        ReportSummaryResponse summary =
                buildSummary(
                        bills,
                        orders
                );

        List<ReportChartPointResponse> chart =
                buildChart(
                        period,
                        date,
                        bills
                );

        List<TopSellingItemResponse> topSellingItems =
                buildTopSellingItems(
                        orderItems
                );

        return new ReportResponse(
                summary,
                chart,
                topSellingItems
        );
    }

    // =====================================================
    // SUMMARY
    // =====================================================

    private ReportSummaryResponse buildSummary(
            List<Bill> bills,
            List<Order> orders
    ) {

        BigDecimal totalSales =
                BigDecimal.ZERO;

        BigDecimal totalTax =
                BigDecimal.ZERO;

        BigDecimal totalDiscount =
                BigDecimal.ZERO;

        long paidBills = 0;
        long generatedBills = 0;

        for (Bill bill : bills) {

            if (bill.getStatus() ==
                    BillStatus.PAID) {

                paidBills++;

                totalSales =
                        totalSales.add(
                                safe(
                                        bill.getTotalAmount()
                                )
                        );

                totalTax =
                        totalTax.add(
                                safe(
                                        bill.getTax()
                                )
                        );

                totalDiscount =
                        totalDiscount.add(
                                safe(
                                        bill.getDiscount()
                                )
                        );

            } else {

                generatedBills++;
            }
        }

        long placedOrders = countOrders(
                orders,
                OrderStatus.PLACED
        );

        long confirmedOrders = countOrders(
                orders,
                OrderStatus.CONFIRMED
        );

        long preparingOrders = countOrders(
                orders,
                OrderStatus.PREPARING
        );

        long readyOrders = countOrders(
                orders,
                OrderStatus.READY
        );

        long servedOrders = countOrders(
                orders,
                OrderStatus.SERVED
        );

        long cancelledOrders = countOrders(
                orders,
                OrderStatus.CANCELLED
        );

        return new ReportSummaryResponse(
                totalSales.setScale(
                        2,
                        RoundingMode.HALF_UP
                ),

                totalTax.setScale(
                        2,
                        RoundingMode.HALF_UP
                ),

                totalDiscount.setScale(
                        2,
                        RoundingMode.HALF_UP
                ),

                bills.size(),
                paidBills,
                generatedBills,

                orders.size(),
                placedOrders,
                confirmedOrders,
                preparingOrders,
                readyOrders,
                servedOrders,
                cancelledOrders
        );
    }

    // =====================================================
    // ORDER STATUS COUNT
    // =====================================================

    private long countOrders(
            List<Order> orders,
            OrderStatus status
    ) {

        return orders.stream()
                .filter(order ->
                        order.getStatus() == status
                )
                .count();
    }

    // =====================================================
    // BAR CHART
    // =====================================================

    private List<ReportChartPointResponse> buildChart(
            ReportPeriod period,
            LocalDate date,
            List<Bill> bills
    ) {

        Map<String, BigDecimal> values =
                new LinkedHashMap<>();

        switch (period) {

            case YEAR:

                buildYearChart(
                        date,
                        values
                );

                break;

            case MONTH:

                buildMonthChart(
                        date,
                        values
                );

                break;

            case WEEK:

                buildWeekChart(
                        date,
                        values
                );

                break;

            case DAY:

                buildDayChart(
                        date,
                        values
                );

                break;

            default:

                throw new IllegalArgumentException(
                        "Unsupported report period"
                );
        }

        // -------------------------------------------------
        // ADD PAID BILL VALUES
        // -------------------------------------------------

        for (Bill bill : bills) {

            if (bill.getStatus() !=
                    BillStatus.PAID) {

                continue;
            }

            if (bill.getCreatedAt() == null) {
                continue;
            }

            LocalDateTime createdAt =
                    bill.getCreatedAt();

            String key;

            switch (period) {

                case YEAR:

                    key =
                            createdAt
                                    .getMonth()
                                    .name();

                    break;

                case MONTH:

                    key =
                            String.valueOf(
                                    createdAt.getDayOfMonth()
                            );

                    break;

                case WEEK:

                    key =
                            createdAt
                                    .getDayOfWeek()
                                    .name();

                    break;

                case DAY:

                    int hour =
                            createdAt.getHour();

                    key =
                            formatHour(hour);

                    break;

                default:

                    key = "";
            }

            if (values.containsKey(key)) {

                values.put(
                        key,
                        values.get(key)
                                .add(
                                        safe(
                                                bill.getTotalAmount()
                                        )
                                )
                );
            }
        }

        List<ReportChartPointResponse> result =
                new ArrayList<>();

        for (Map.Entry<String, BigDecimal> entry :
                values.entrySet()) {

            result.add(
                    new ReportChartPointResponse(
                            formatChartLabel(
                                    period,
                                    entry.getKey()
                            ),
                            entry.getValue()
                                    .setScale(
                                            2,
                                            RoundingMode.HALF_UP
                                    )
                    )
            );
        }

        return result;
    }

    // =====================================================
    // YEAR CHART
    // =====================================================

    private void buildYearChart(
            LocalDate date,
            Map<String, BigDecimal> values
    ) {

        for (Month month : Month.values()) {

            values.put(
                    month.name(),
                    BigDecimal.ZERO
            );
        }
    }

    // =====================================================
    // MONTH CHART
    // =====================================================

    private void buildMonthChart(
            LocalDate date,
            Map<String, BigDecimal> values
    ) {

        YearMonth yearMonth =
                YearMonth.from(date);

        int days =
                yearMonth.lengthOfMonth();

        for (int day = 1; day <= days; day++) {

            values.put(
                    String.valueOf(day),
                    BigDecimal.ZERO
            );
        }
    }

    // =====================================================
    // WEEK CHART
    // =====================================================

    private void buildWeekChart(
            LocalDate date,
            Map<String, BigDecimal> values
    ) {

        DayOfWeek[] days =
                DayOfWeek.values();

        DayOfWeek[] orderedDays = {

                DayOfWeek.MONDAY,
                DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY,
                DayOfWeek.SATURDAY,
                DayOfWeek.SUNDAY
        };

        for (DayOfWeek day : orderedDays) {

            values.put(
                    day.name(),
                    BigDecimal.ZERO
            );
        }
    }

    // =====================================================
    // DAY / HOURLY CHART
    // =====================================================

    private void buildDayChart(
            LocalDate date,
            Map<String, BigDecimal> values
    ) {

        for (int hour = 0; hour <= 23; hour++) {

            values.put(
                    formatHour(hour),
                    BigDecimal.ZERO
            );
        }
    }

    // =====================================================
    // CHART LABEL
    // =====================================================

    private String formatChartLabel(
            ReportPeriod period,
            String key
    ) {

        switch (period) {

            case YEAR:

                Month month =
                        Month.valueOf(key);

                return month
                        .getDisplayName(
                                java.time.format.TextStyle.SHORT,
                                java.util.Locale.ENGLISH
                        );

            case MONTH:

                return key;

            case WEEK:

                DayOfWeek day =
                        DayOfWeek.valueOf(key);

                return day
                        .getDisplayName(
                                java.time.format.TextStyle.SHORT,
                                java.util.Locale.ENGLISH
                        );

            case DAY:

                return key;

            default:

                return key;
        }
    }

    // =====================================================
    // HOUR FORMAT
    // =====================================================

    private String formatHour(int hour) {

        LocalTime time =
                LocalTime.of(
                        hour,
                        0
                );

        return time.format(
                DateTimeFormatter.ofPattern(
                        "h a"
                )
        );
    }

    // =====================================================
    // TOP SELLING ITEMS
    // =====================================================

    private List<TopSellingItemResponse>
    buildTopSellingItems(
            List<OrderItem> orderItems
    ) {

        Map<Long, TopSellingAccumulator> map =
                new LinkedHashMap<>();

        for (OrderItem item : orderItems) {

            if (item == null ||
                    item.getMenuItem() == null) {

                continue;
            }

            /*
             * Cancelled order items should not contribute
             * to the top-selling report.
             */
            if (item.getOrder() != null &&
                    item.getOrder().getStatus() ==
                            OrderStatus.CANCELLED) {

                continue;
            }

            Long menuItemId =
                    item.getMenuItem().getId();

            String menuItemName =
                    item.getMenuItem().getName();

            TopSellingAccumulator accumulator =
                    map.computeIfAbsent(
                            menuItemId,
                            id ->
                                    new TopSellingAccumulator(
                                            menuItemId,
                                            menuItemName
                                    )
                    );

            accumulator.quantitySold +=
                    item.getQuantity() == null
                            ? 0
                            : item.getQuantity();

            accumulator.totalSales =
                    accumulator.totalSales.add(
                            safe(
                                    item.getTotalPrice()
                            )
                    );
        }

        List<TopSellingItemResponse> result =
                new ArrayList<>();

        for (TopSellingAccumulator accumulator :
                map.values()) {

            result.add(
                    new TopSellingItemResponse(
                            accumulator.menuItemId,
                            accumulator.menuItemName,
                            accumulator.quantitySold,
                            accumulator.totalSales
                                    .setScale(
                                            2,
                                            RoundingMode.HALF_UP
                                    )
                    )
            );
        }

        result.sort(
                Comparator
                        .comparingLong(
                                TopSellingItemResponse
                                        ::getQuantitySold
                        )
                        .reversed()
        );

        return result;
    }

    // =====================================================
    // SAFE DECIMAL
    // =====================================================

    private BigDecimal safe(
            BigDecimal value
    ) {

        return value == null
                ? BigDecimal.ZERO
                : value;
    }

    // =====================================================
    // ACCUMULATOR
    // =====================================================

    private static class TopSellingAccumulator {

        private final Long menuItemId;
        private final String menuItemName;

        private long quantitySold;

        private BigDecimal totalSales =
                BigDecimal.ZERO;

        private TopSellingAccumulator(
                Long menuItemId,
                String menuItemName
        ) {
            this.menuItemId = menuItemId;
            this.menuItemName = menuItemName;
        }
    }
}