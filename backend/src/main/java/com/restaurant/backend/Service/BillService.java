package com.restaurant.backend.Service;

import com.restaurant.backend.Exception.ConflictException;
import com.restaurant.backend.Exception.ResourceNotFoundException;

import com.restaurant.backend.Repository.BillItemRepository;
import com.restaurant.backend.Repository.BillRepository;
import com.restaurant.backend.Repository.OrderItemRepository;
import com.restaurant.backend.Repository.OrderRepository;
import com.restaurant.backend.Repository.RestaurantTableRepository;

import com.restaurant.backend.dto.BillItemResponse;
import com.restaurant.backend.dto.BillResponse;
import com.restaurant.backend.dto.RestaurantSettingsResponse;

import com.restaurant.backend.entity.AuditAction;
import com.restaurant.backend.entity.Bill;
import com.restaurant.backend.entity.BillItem;
import com.restaurant.backend.entity.BillStatus;
import com.restaurant.backend.entity.CustomerSession;
import com.restaurant.backend.entity.Order;
import com.restaurant.backend.entity.OrderItem;
import com.restaurant.backend.entity.OrderStatus;
import com.restaurant.backend.entity.TableStatus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@Service
public class BillService {

    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestaurantTableRepository tableRepository;
    private final RestaurantSettingsService settingsService;
    private final AuditLogService auditLogService;

    public BillService(
            BillRepository billRepository,
            BillItemRepository billItemRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RestaurantTableRepository tableRepository,
            RestaurantSettingsService settingsService,
            AuditLogService auditLogService
    ) {
        this.billRepository = billRepository;
        this.billItemRepository = billItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.tableRepository = tableRepository;
        this.settingsService = settingsService;
        this.auditLogService = auditLogService;
    }

    // =====================================================
    // GENERATE FINAL BILL
    // =====================================================

    @Transactional
    public BillResponse generateBill(Long orderId) {

        Order requestedOrder =
                orderRepository.findById(orderId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Order not found: " + orderId
                                )
                        );

        if (requestedOrder.getStatus() != OrderStatus.SERVED) {

            throw new IllegalArgumentException(
                    "Bill can only be generated for a SERVED order"
            );
        }

        CustomerSession session =
                requestedOrder.getCustomerSession();

        // =================================================
        // SESSION-BASED BILLING
        // =================================================

        if (session != null) {

            if (billRepository
                    .findByCustomerSessionId(session.getId())
                    .isPresent()) {

                throw new ConflictException(
                        "Bill already exists for customer session: "
                                + session.getId()
                );
            }

            List<Order> sessionOrders =
                    orderRepository
                            .findByCustomerSessionIdOrderByCreatedAtAsc(
                                    session.getId()
                            );

            if (sessionOrders.isEmpty()) {

                throw new IllegalArgumentException(
                        "No orders found for customer session"
                );
            }

            for (Order order : sessionOrders) {

                if (order.getStatus() != OrderStatus.SERVED) {

                    throw new ConflictException(
                            "All orders in the customer session "
                                    + "must be SERVED before generating "
                                    + "the final bill. Order "
                                    + order.getOrderNumber()
                                    + " is currently "
                                    + order.getStatus()
                    );
                }
            }

            BigDecimal subtotal = BigDecimal.ZERO;
            BigDecimal tax = BigDecimal.ZERO;
            BigDecimal discount = BigDecimal.ZERO;
            BigDecimal totalAmount = BigDecimal.ZERO;

            for (Order order : sessionOrders) {

                subtotal =
                        subtotal.add(
                                safeAmount(order.getSubtotal())
                        );

                tax =
                        tax.add(
                                safeAmount(order.getTax())
                        );

                discount =
                        discount.add(
                                safeAmount(order.getDiscount())
                        );

                totalAmount =
                        totalAmount.add(
                                safeAmount(order.getTotalAmount())
                        );
            }

            Bill bill = new Bill();

            bill.setBillNumber(
                    "BILL-SESSION-" + session.getId()
            );

            bill.setOrder(
                    sessionOrders.get(0)
            );

            bill.setCustomerSession(
                    session
            );

            bill.setSubtotal(subtotal);
            bill.setTax(tax);
            bill.setDiscount(discount);
            bill.setTotalAmount(totalAmount);
            bill.setStatus(BillStatus.GENERATED);

            Bill savedBill =
                    billRepository.save(bill);

            boolean hasItems = false;

            for (Order order : sessionOrders) {

                List<OrderItem> orderItems =
                        orderItemRepository.findByOrderId(
                                order.getId()
                        );

                for (OrderItem orderItem : orderItems) {

                    hasItems = true;

                    BillItem billItem =
                            new BillItem();

                    billItem.setBill(savedBill);

                    billItem.setMenuItemName(
                            orderItem
                                    .getMenuItem()
                                    .getName()
                    );

                    billItem.setQuantity(
                            orderItem.getQuantity()
                    );

                    billItem.setUnitPrice(
                            orderItem.getUnitPrice()
                    );

                    billItem.setTotalPrice(
                            orderItem.getTotalPrice()
                    );

                    billItemRepository.save(billItem);
                }
            }

            if (!hasItems) {

                throw new IllegalArgumentException(
                        "Cannot generate bill for a session "
                                + "with no order items"
                );
            }

            auditLogService.log(
                    AuditAction.GENERATE_BILL,
                    "BILL",
                    savedBill.getId(),
                    "Generated " +
                            savedBill.getBillNumber() +
                            " for customer session " +
                            session.getId() +
                            " containing " +
                            sessionOrders.size() +
                            " order(s)"
            );

            return toResponse(savedBill);
        }

        // =================================================
        // LEGACY BILLING
        // =================================================

        if (billRepository
                .findByOrderId(orderId)
                .isPresent()) {

            throw new ConflictException(
                    "Bill already exists for order: " + orderId
            );
        }

        Bill bill = new Bill();

        bill.setBillNumber(
                "BILL-" + orderId
        );

        bill.setOrder(requestedOrder);

        bill.setSubtotal(
                safeAmount(requestedOrder.getSubtotal())
        );

        bill.setTax(
                safeAmount(requestedOrder.getTax())
        );

        bill.setDiscount(
                safeAmount(requestedOrder.getDiscount())
        );

        bill.setTotalAmount(
                safeAmount(requestedOrder.getTotalAmount())
        );

        bill.setStatus(BillStatus.GENERATED);

        Bill savedBill =
                billRepository.save(bill);

        List<OrderItem> orderItems =
                orderItemRepository.findByOrderId(orderId);

        if (orderItems.isEmpty()) {

            throw new IllegalArgumentException(
                    "Cannot generate bill for an order with no items"
            );
        }

        for (OrderItem orderItem : orderItems) {

            BillItem billItem =
                    new BillItem();

            billItem.setBill(savedBill);

            billItem.setMenuItemName(
                    orderItem
                            .getMenuItem()
                            .getName()
            );

            billItem.setQuantity(
                    orderItem.getQuantity()
            );

            billItem.setUnitPrice(
                    orderItem.getUnitPrice()
            );

            billItem.setTotalPrice(
                    orderItem.getTotalPrice()
            );

            billItemRepository.save(billItem);
        }

        auditLogService.log(
                AuditAction.GENERATE_BILL,
                "BILL",
                savedBill.getId(),
                "Generated " +
                        savedBill.getBillNumber() +
                        " for order " +
                        requestedOrder.getOrderNumber()
        );

        return toResponse(savedBill);
    }

    // =====================================================
    // GET BILL
    // =====================================================

    @Transactional(readOnly = true)
    public BillResponse getBill(Long billId) {

        Bill bill =
                billRepository.findById(billId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Bill not found: " + billId
                                )
                        );

        return toResponse(bill);
    }
// =====================================================
// GET ALL BILLS
// =====================================================

@Transactional(readOnly = true)
public List<BillResponse> getAllBills() {

    return billRepository.findAll()
            .stream()
            .map(this::toResponse)
            .toList();
}

// =====================================================
// GET BILLS BY DATE RANGE
// =====================================================

@Transactional(readOnly = true)
public List<BillResponse> getBillsByDateRange(
        LocalDateTime start,
        LocalDateTime end
) {

    return billRepository
            .findByCreatedAtBetween(start, end)
            .stream()
            .map(this::toResponse)
            .toList();
}

    // =====================================================
    // MARK BILL PRINTED
    // =====================================================

    @Transactional
    public BillResponse markPrinted(Long billId) {

        Bill bill =
                billRepository.findById(billId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Bill not found: " + billId
                                )
                        );

        if (bill.getStatus() == BillStatus.PAID) {

            throw new ConflictException(
                    "Paid bill cannot be marked as printed"
            );
        }

        if (bill.getStatus() == BillStatus.CANCELLED) {

            throw new ConflictException(
                    "Cancelled bill cannot be printed"
            );
        }

        /*
         * Printing the same bill again is allowed.
         */
        if (bill.getStatus() != BillStatus.PRINTED) {

            bill.markPrinted();

            billRepository.save(bill);

            auditLogService.log(
                    AuditAction.PRINT_BILL,
                    "BILL",
                    bill.getId(),
                    "Printed " +
                            bill.getBillNumber()
            );
        }

        return toResponse(bill);
    }

    // =====================================================
    // GENERATE PRINTABLE RECEIPT
    // =====================================================

    @Transactional(readOnly = true)
    public String printBill(Long billId) {

        Bill bill =
                billRepository.findById(billId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Bill not found: " + billId
                                )
                        );

        List<BillItem> items =
                billItemRepository.findByBillId(billId);

        RestaurantSettingsResponse settings =
                settingsService.getSettings();

        String restaurantName =
                settings.getRestaurantName();

        String receiptHeader =
                settings.getReceiptHeader();

        String receiptFooter =
                settings.getReceiptFooter();

        if (receiptHeader == null ||
                receiptHeader.isBlank()) {

            receiptHeader = restaurantName;
        }

        if (receiptFooter == null ||
                receiptFooter.isBlank()) {

            receiptFooter =
                    "THANK YOU!\nVISIT AGAIN";
        }

        StringBuilder receipt =
                new StringBuilder();

        receipt.append(
                "========================================\n"
        );

        appendMultilineText(
                receipt,
                receiptHeader
        );

        receipt.append(
                "========================================\n"
        );

        receipt.append(
                "Bill No : "
        ).append(
                bill.getBillNumber()
        ).append("\n");

        List<String> orderNumbers =
                getOrderNumbers(bill);

        if (!orderNumbers.isEmpty()) {

            receipt.append(
                    "Orders  : "
            ).append(
                    String.join(
                            ", ",
                            orderNumbers
                    )
            ).append("\n");
        }

        if (bill.getCustomerSession() != null) {

            receipt.append(
                    "Session : "
            ).append(
                    bill.getCustomerSession()
                            .getSessionCode()
            ).append("\n");
        }

        String tableNumber =
                getTableNumber(bill);

        if (tableNumber != null) {

            receipt.append(
                    "Table   : "
            ).append(
                    tableNumber
            ).append("\n");
        }

        receipt.append(
                "----------------------------------------\n"
        );

        receipt.append(
                String.format(
                        "%-22s %5s %10s%n",
                        "ITEM",
                        "QTY",
                        "AMOUNT"
                )
        );

        receipt.append(
                "----------------------------------------\n"
        );

        for (BillItem item : items) {

            String itemName =
                    item.getMenuItemName();

            if (itemName == null) {
                itemName = "";
            }

            if (itemName.length() > 22) {

                itemName =
                        itemName.substring(0, 22);
            }

            receipt.append(
                    String.format(
                            "%-22s %5d %10.2f%n",
                            itemName,
                            item.getQuantity(),
                            item.getTotalPrice()
                    )
            );
        }

        receipt.append(
                "----------------------------------------\n"
        );

        receipt.append(
                String.format(
                        "%-28s %10.2f%n",
                        "Subtotal:",
                        bill.getSubtotal()
                )
        );

        receipt.append(
                String.format(
                        "%-28s %10.2f%n",
                        "Tax:",
                        bill.getTax()
                )
        );

        receipt.append(
                String.format(
                        "%-28s %10.2f%n",
                        "Discount:",
                        bill.getDiscount()
                )
        );

        receipt.append(
                "----------------------------------------\n"
        );

        receipt.append(
                String.format(
                        "%-28s %10.2f%n",
                        "TOTAL:",
                        bill.getTotalAmount()
                )
        );

        receipt.append(
                "----------------------------------------\n"
        );

        appendMultilineText(
                receipt,
                receiptFooter
        );

        receipt.append(
                "========================================\n"
        );

        return receipt.toString();
    }

    // =====================================================
    // APPEND MULTILINE TEXT
    // =====================================================

    private void appendMultilineText(
            StringBuilder receipt,
            String text
    ) {

        if (text == null ||
                text.isBlank()) {

            return;
        }

        String[] lines =
                text.split("\\R");

        for (String line : lines) {

            if (line == null) {
                continue;
            }

            line = line.trim();

            if (line.isEmpty()) {
                continue;
            }

            if (line.length() > 40) {

                line =
                        line.substring(0, 40);
            }

            receipt.append(
                    centerText(line, 40)
            ).append("\n");
        }
    }

    // =====================================================
    // CENTER TEXT
    // =====================================================

    private String centerText(
            String text,
            int width
    ) {

        if (text.length() >= width) {
            return text;
        }

        int totalSpaces =
                width - text.length();

        int leftSpaces =
                totalSpaces / 2;

        return " ".repeat(leftSpaces) + text;
    }

    // =====================================================
    // MARK PHYSICAL PAYMENT COLLECTED
    // =====================================================

    @Transactional
    public BillResponse markPaid(Long billId) {

        // =================================================
        // IMPORTANT:
        // LOCK THE BILL BEFORE CHECKING ITS STATUS
        // =================================================

        Bill bill =
                billRepository.findByIdForUpdate(billId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Bill not found: " + billId
                                )
                        );

        System.out.println(
                "PAYMENT LOCK ACQUIRED | Bill=" + billId +
                        " | Status=" + bill.getStatus() +
                        " | Thread=" +
                        Thread.currentThread().getName()
        );

        // =================================================
        // ALREADY PAID
        // =================================================

        if (bill.getStatus() == BillStatus.PAID) {

            throw new ConflictException(
                    "Bill is already marked as paid"
            );
        }

        // =================================================
        // CANCELLED
        // =================================================

        if (bill.getStatus() == BillStatus.CANCELLED) {

            throw new ConflictException(
                    "Cancelled bill cannot be paid"
            );
        }

        // =================================================
        // VALID BILL STATE
        // =================================================

        if (bill.getStatus() != BillStatus.GENERATED &&
                bill.getStatus() != BillStatus.PRINTED) {

            throw new ConflictException(
                    "Bill cannot be marked as paid from status: "
                            + bill.getStatus()
            );
        }

        // =================================================
        // SESSION-BASED BILL
        // =================================================

        CustomerSession session =
                bill.getCustomerSession();

        if (session != null) {

            List<Order> sessionOrders =
                    orderRepository
                            .findByCustomerSessionIdOrderByCreatedAtAsc(
                                    session.getId()
                            );

            if (sessionOrders.isEmpty()) {

                throw new ConflictException(
                        "No orders found for customer session"
                );
            }

            bill.markPaid();

            Bill savedBill =
                    billRepository.save(bill);

            // -------------------------------------------------
            // COMPLETE ALL SESSION ORDERS
            // -------------------------------------------------

            for (Order order : sessionOrders) {

                if (order.getStatus() ==
                        OrderStatus.COMPLETED) {

                    continue;
                }

                order.setStatus(
                        OrderStatus.COMPLETED
                );

                orderRepository.save(order);
            }

            // -------------------------------------------------
            // CLOSE CUSTOMER SESSION
            // -------------------------------------------------

            session.setActive(false);

            session.setClosedAt(
                    java.time.LocalDateTime.now()
            );

            // -------------------------------------------------
            // FREE TABLE
            // -------------------------------------------------

            if (session.getTable() != null) {

                session.getTable().setStatus(
                        TableStatus.AVAILABLE
                );

                tableRepository.save(
                        session.getTable()
                );
            }

            // -------------------------------------------------
            // AUDIT LOG
            // -------------------------------------------------

            auditLogService.log(
                    AuditAction.MARK_BILL_PAID,
                    "BILL",
                    savedBill.getId(),
                    "Marked " +
                            savedBill.getBillNumber() +
                            " as paid, completed " +
                            sessionOrders.size() +
                            " order(s), closed customer session"
            );

            return toResponse(savedBill);
        }

        // =================================================
        // LEGACY BILLING
        // =================================================

        bill.markPaid();

        Bill savedBill =
                billRepository.save(bill);

        Order order =
                savedBill.getOrder();

        if (order == null) {

            throw new ConflictException(
                    "Bill has no associated order"
            );
        }

        if (order.getStatus() ==
                OrderStatus.COMPLETED) {

            throw new ConflictException(
                    "Order is already completed"
            );
        }

        order.setStatus(
                OrderStatus.COMPLETED
        );

        orderRepository.save(order);

        // -------------------------------------------------
        // FREE TABLE
        // -------------------------------------------------

        if (order.getTable() != null) {

            order.getTable().setStatus(
                    TableStatus.AVAILABLE
            );

            tableRepository.save(
                    order.getTable()
            );
        }

        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        auditLogService.log(
                AuditAction.MARK_BILL_PAID,
                "BILL",
                savedBill.getId(),
                "Marked " +
                        savedBill.getBillNumber() +
                        " as paid"
        );

        return toResponse(savedBill);
    }

    // =====================================================
    // RESPONSE MAPPING
    // =====================================================

    private BillResponse toResponse(Bill bill) {

        List<BillItemResponse> items =
                billItemRepository
                        .findByBillId(bill.getId())
                        .stream()
                        .map(item ->
                                new BillItemResponse(
                                        item.getMenuItemName(),
                                        item.getQuantity(),
                                        item.getUnitPrice(),
                                        item.getTotalPrice()
                                )
                        )
                        .toList();

        List<String> orderNumbers =
                getOrderNumbers(bill);

        String tableNumber =
                getTableNumber(bill);

        String sessionCode = null;

        if (bill.getCustomerSession() != null) {

            sessionCode =
                    bill.getCustomerSession()
                            .getSessionCode();
        }

        return new BillResponse(
                bill.getId(),
                bill.getBillNumber(),
                orderNumbers,
                tableNumber,
                sessionCode,
                bill.getSubtotal(),
                bill.getTax(),
                bill.getDiscount(),
                bill.getTotalAmount(),
                bill.getStatus().name(),
                items
        );
    }

    // =====================================================
    // GET ORDER NUMBERS
    // =====================================================

    private List<String> getOrderNumbers(Bill bill) {

        List<String> orderNumbers =
                new ArrayList<>();

        if (bill.getCustomerSession() != null) {

            List<Order> orders =
                    orderRepository
                            .findByCustomerSessionIdOrderByCreatedAtAsc(
                                    bill.getCustomerSession()
                                            .getId()
                            );

            for (Order order : orders) {

                orderNumbers.add(
                        order.getOrderNumber()
                );
            }

        } else if (bill.getOrder() != null) {

            orderNumbers.add(
                    bill.getOrder()
                            .getOrderNumber()
            );
        }

        return orderNumbers;
    }

    // =====================================================
    // GET TABLE NUMBER
    // =====================================================

    private String getTableNumber(Bill bill) {

        if (bill.getCustomerSession() != null &&
                bill.getCustomerSession().getTable() != null) {

            return bill.getCustomerSession()
                    .getTable()
                    .getTableNumber();
        }

        if (bill.getOrder() != null &&
                bill.getOrder().getTable() != null) {

            return bill.getOrder()
                    .getTable()
                    .getTableNumber();
        }

        return null;
    }

    // =====================================================
    // SAFE BIG DECIMAL
    // =====================================================

    private BigDecimal safeAmount(BigDecimal amount) {

        return amount != null
                ? amount
                : BigDecimal.ZERO;
    }
}