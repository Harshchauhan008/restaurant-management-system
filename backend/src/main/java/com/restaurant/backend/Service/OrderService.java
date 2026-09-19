package com.restaurant.backend.Service;

import com.restaurant.backend.Exception.ConflictException;
import com.restaurant.backend.Exception.ResourceNotFoundException;

import com.restaurant.backend.Repository.CustomerSessionRepository;
import com.restaurant.backend.Repository.MenuItemRepository;
import com.restaurant.backend.Repository.OrderItemRepository;
import com.restaurant.backend.Repository.OrderRepository;
import com.restaurant.backend.Repository.RestaurantTableRepository;
import com.restaurant.backend.Repository.UserRepository;

import com.restaurant.backend.dto.CreateOrderRequest;
import com.restaurant.backend.dto.KitchenOrderResponse;
import com.restaurant.backend.dto.OrderItemRequest;
import com.restaurant.backend.dto.OrderItemResponse;
import com.restaurant.backend.dto.OrderResponse;
import com.restaurant.backend.dto.ReceptionOrderResponse;
import com.restaurant.backend.dto.RestaurantSettingsResponse;
import com.restaurant.backend.dto.WaiterOrderResponse;

import com.restaurant.backend.entity.AuditAction;
import com.restaurant.backend.entity.CustomerSession;
import com.restaurant.backend.entity.MenuItem;
import com.restaurant.backend.entity.Order;
import com.restaurant.backend.entity.OrderItem;
import com.restaurant.backend.entity.OrderItemStatus;
import com.restaurant.backend.entity.OrderStatus;
import com.restaurant.backend.entity.RestaurantTable;
import com.restaurant.backend.entity.Role;
import com.restaurant.backend.entity.TableStatus;
import com.restaurant.backend.entity.User;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestaurantTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final CustomerSessionRepository customerSessionRepository;
    private final RestaurantSettingsService settingsService;
    private final AuditLogService auditLogService;

    private final Random random = new Random();

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RestaurantTableRepository tableRepository,
            MenuItemRepository menuItemRepository,
            UserRepository userRepository,
            CustomerSessionRepository customerSessionRepository,
            RestaurantSettingsService settingsService,
            AuditLogService auditLogService
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.tableRepository = tableRepository;
        this.menuItemRepository = menuItemRepository;
        this.userRepository = userRepository;
        this.customerSessionRepository = customerSessionRepository;
        this.settingsService = settingsService;
        this.auditLogService = auditLogService;
    }

    // =========================================================
    // CUSTOMER - CREATE ORDER
    // =========================================================

    @Transactional
    public OrderResponse createOrder(
            CreateOrderRequest request
    ) {

        // -----------------------------------------------------
        // VALIDATE QR TOKEN
        // -----------------------------------------------------

        if (request == null ||
                request.getQrToken() == null ||
                request.getQrToken().isBlank()) {

            throw new IllegalArgumentException(
                    "QR token is required"
            );
        }

        // IMPORTANT:
        // Use the locked query here because order creation
        // must protect against concurrent requests for the
        // same table.
        RestaurantTable table =
                tableRepository.findByQrTokenForUpdate(
                        request.getQrToken()
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Invalid QR code"
                        )
                );

        // -----------------------------------------------------
        // TABLE ACTIVE CHECK
        // -----------------------------------------------------

        if (!table.isActive()) {

            throw new ConflictException(
                    "Table is inactive"
            );
        }

        // -----------------------------------------------------
        // ORDER ITEMS CHECK
        // -----------------------------------------------------

        if (request.getItems() == null ||
                request.getItems().isEmpty()) {

            throw new IllegalArgumentException(
                    "Order must contain at least one item"
            );
        }

        // -----------------------------------------------------
        // CUSTOMER SESSION
        // -----------------------------------------------------

        CustomerSession customerSession;

        String providedSessionCode =
                request.getSessionCode();

        // Find currently active session for this table
        CustomerSession activeSession =
                customerSessionRepository
                        .findByTableIdAndActiveTrue(
                                table.getId()
                        )
                        .orElse(null);

        // -----------------------------------------------------
        // FIRST ORDER
        // -----------------------------------------------------

        if (activeSession == null) {

            // A new session must not be created
            // using an old/incorrect code.
            if (providedSessionCode != null &&
                    !providedSessionCode.isBlank()) {

                throw new ConflictException(
                        "No active customer session exists for this table"
                );
            }

            customerSession =
                    new CustomerSession();

            customerSession.setTable(table);

            customerSession.setSessionCode(
                    generateSessionCode(
                            table.getId()
                    )
            );

            customerSession.setActive(true);

            customerSession =
                    customerSessionRepository.save(
                            customerSession
                    );
        }

        // -----------------------------------------------------
        // EXISTING SESSION
        // -----------------------------------------------------

        else {

            if (providedSessionCode == null ||
                    providedSessionCode.isBlank()) {

                throw new ConflictException(
                        "Table already has an active order. " +
                        "Enter the 4-digit session code to place another order."
                );
            }

            String normalizedCode =
                    providedSessionCode.trim();

            if (!normalizedCode.matches("\\d{4}")) {

                throw new IllegalArgumentException(
                        "Session code must be exactly 4 digits"
                );
            }

            customerSession =
                    customerSessionRepository
                            .findByTableIdAndSessionCodeAndActiveTrue(
                                    table.getId(),
                                    normalizedCode
                            )
                            .orElseThrow(() ->
                                    new ConflictException(
                                            "Invalid 4-digit session code"
                                    )
                            );
        }

        // -----------------------------------------------------
        // CREATE ORDER
        // -----------------------------------------------------

        Order order =
                new Order();

        order.setOrderNumber(
                "ORD-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase()
        );

        order.setTable(table);

        // Link order to customer session
        order.setCustomerSession(
                customerSession
        );

        order.setStatus(
                OrderStatus.PLACED
        );

        BigDecimal subtotal =
                BigDecimal.ZERO;

        Order savedOrder =
                orderRepository.save(order);

        List<OrderItemResponse> responseItems =
                new ArrayList<>();

        // -----------------------------------------------------
        // CREATE ORDER ITEMS
        // -----------------------------------------------------

        for (OrderItemRequest requestItem :
                request.getItems()) {

            if (requestItem == null) {

                throw new IllegalArgumentException(
                        "Order item cannot be null"
                );
            }

            if (requestItem.getMenuItemId() == null) {

                throw new IllegalArgumentException(
                        "Menu item ID is required"
                );
            }

            if (requestItem.getQuantity() == null ||
                    requestItem.getQuantity() <= 0) {

                throw new IllegalArgumentException(
                        "Quantity must be greater than zero"
                );
            }

            MenuItem menuItem =
                    menuItemRepository.findById(
                            requestItem.getMenuItemId()
                    ).orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Menu item not found: " +
                                    requestItem.getMenuItemId()
                            )
                    );

            // -------------------------------------------------
            // MENU ITEM ACTIVE
            // -------------------------------------------------

            if (!menuItem.isActive()) {

                throw new ConflictException(
                        menuItem.getName() +
                        " is no longer active"
                );
            }

            // -------------------------------------------------
            // MENU ITEM AVAILABLE
            // -------------------------------------------------

            if (!menuItem.isAvailable()) {

                throw new ConflictException(
                        menuItem.getName() +
                        " is currently unavailable"
                );
            }

            // -------------------------------------------------
            // PRICE FROM DATABASE
            // -------------------------------------------------

            BigDecimal unitPrice =
                    menuItem.getPrice();

            if (unitPrice == null) {

                throw new IllegalArgumentException(
                        "Menu item price is not configured: " +
                        menuItem.getName()
                );
            }

            BigDecimal totalPrice =
                    unitPrice.multiply(
                            BigDecimal.valueOf(
                                    requestItem.getQuantity()
                            )
                    );

            // -------------------------------------------------
            // CREATE ORDER ITEM
            // -------------------------------------------------

            OrderItem orderItem =
                    new OrderItem();

            orderItem.setOrder(
                    savedOrder
            );

            orderItem.setMenuItem(
                    menuItem
            );

            orderItem.setQuantity(
                    requestItem.getQuantity()
            );

            orderItem.setUnitPrice(
                    unitPrice
            );

            orderItem.setTotalPrice(
                    totalPrice
            );

            orderItem.setSpecialInstruction(
                    requestItem.getSpecialInstruction()
            );

            orderItem.setStatus(
                    OrderItemStatus.PENDING
            );

            orderItemRepository.save(
                    orderItem
            );

            subtotal =
                    subtotal.add(totalPrice);

            responseItems.add(
                    new OrderItemResponse(
                            menuItem.getId(),
                            menuItem.getName(),
                            requestItem.getQuantity(),
                            unitPrice,
                            totalPrice,
                            requestItem.getSpecialInstruction(),
                            orderItem.getStatus().name()
                    )
            );
        }

        // -----------------------------------------------------
        // GET RESTAURANT TAX SETTINGS
        // -----------------------------------------------------

        RestaurantSettingsResponse settings =
                settingsService.getSettings();

        Double taxPercentage =
                settings.getTaxPercentage();

        if (taxPercentage == null) {
            taxPercentage = 0.0;
        }

        if (taxPercentage < 0 ||
                taxPercentage > 100) {

            throw new IllegalArgumentException(
                    "Restaurant tax percentage must be between 0 and 100"
            );
        }

        // -----------------------------------------------------
        // CALCULATE TAX
        // -----------------------------------------------------

        BigDecimal taxRate =
                BigDecimal.valueOf(
                        taxPercentage
                ).divide(
                        BigDecimal.valueOf(100),
                        6,
                        RoundingMode.HALF_UP
                );

        BigDecimal tax =
                subtotal
                        .multiply(taxRate)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        // -----------------------------------------------------
        // DISCOUNT
        // -----------------------------------------------------

        BigDecimal discount =
                BigDecimal.ZERO;

        // -----------------------------------------------------
        // FINAL TOTAL
        // -----------------------------------------------------

        BigDecimal totalAmount =
                subtotal
                        .add(tax)
                        .subtract(discount)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        // -----------------------------------------------------
        // SAVE ORDER TOTALS
        // -----------------------------------------------------

        savedOrder.setSubtotal(
                subtotal.setScale(
                        2,
                        RoundingMode.HALF_UP
                )
        );

        savedOrder.setTax(
                tax
        );

        savedOrder.setDiscount(
                discount
        );

        savedOrder.setTotalAmount(
                totalAmount
        );

        Order finalOrder =
                orderRepository.save(
                        savedOrder
                );

        // -----------------------------------------------------
        // OCCUPY TABLE
        // -----------------------------------------------------

        table.setStatus(
                TableStatus.OCCUPIED
        );

        tableRepository.save(
                table
        );

        // -----------------------------------------------------
        // AUDIT LOG
        // -----------------------------------------------------

        auditLogService.log(
                AuditAction.CREATE_ORDER,
                "ORDER",
                finalOrder.getId(),
                "Created order " +
                        finalOrder.getOrderNumber() +
                        " for table " +
                        table.getTableNumber()
        );

        return toOrderResponse(
                finalOrder,
                responseItems
        );
    }


    // =========================================================
    // GENERATE 4-DIGIT SESSION CODE
    // =========================================================

   private String generateSessionCode(Long tableId) {

    String code;

    do {
        code = String.format(
                "%04d",
                1000 + random.nextInt(9000)
        );

    } while (
            customerSessionRepository
                    .existsByTableIdAndSessionCode(
                            tableId,
                            code
                    )
    );

    return code;
}

    // =========================================================
    // KITCHEN - GET PLACED ORDERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<KitchenOrderResponse> getKitchenOrders() {

        return orderRepository
                .findByStatus(
                        OrderStatus.PLACED
                )
                .stream()
                .map(this::toKitchenResponse)
                .toList();
    }


    // =========================================================
    // KITCHEN - GET ORDERS BY STATUS
    // =========================================================

    @Transactional(readOnly = true)
    public List<KitchenOrderResponse> getOrdersByKitchenStatus(
            OrderStatus status
    ) {

        if (status == null) {

            throw new IllegalArgumentException(
                    "Order status is required"
            );
        }

        return orderRepository
                .findByStatus(status)
                .stream()
                .map(this::toKitchenResponse)
                .toList();
    }


    // =========================================================
    // KITCHEN - UPDATE STATUS
    // =========================================================

    @Transactional
    public KitchenOrderResponse updateKitchenStatus(
            Long orderId,
            OrderStatus newStatus
    ) {

        if (orderId == null) {

            throw new IllegalArgumentException(
                    "Order ID is required"
            );
        }

        if (newStatus == null) {

            throw new IllegalArgumentException(
                    "New order status is required"
            );
        }

        Order order =
                orderRepository.findById(
                        orderId
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Order not found: " +
                                orderId
                        )
                );

        OrderStatus currentStatus =
                order.getStatus();

        if (!isValidKitchenTransition(
                currentStatus,
                newStatus
        )) {

            throw new ConflictException(
                    "Invalid kitchen order status transition: "
                            + currentStatus
                            + " -> "
                            + newStatus
            );
        }

        order.setStatus(
                newStatus
        );

        Order saved =
                orderRepository.save(order);

        // -----------------------------------------------------
        // UPDATE ORDER ITEMS
        // -----------------------------------------------------

        List<OrderItem> orderItems =
                orderItemRepository.findByOrderId(
                        orderId
                );

        for (OrderItem item :
                orderItems) {

            if (newStatus ==
                    OrderStatus.PREPARING) {

                item.setStatus(
                        OrderItemStatus.PREPARING
                );
            }

            if (newStatus ==
                    OrderStatus.READY) {

                item.setStatus(
                        OrderItemStatus.READY
                );
            }

            orderItemRepository.save(
                    item
            );
        }

        // -----------------------------------------------------
        // AUDIT LOG
        // -----------------------------------------------------

        auditLogService.log(
                AuditAction.CHANGE_ORDER_STATUS,
                "ORDER",
                saved.getId(),
                "Changed order " +
                        saved.getOrderNumber() +
                        " status from " +
                        currentStatus +
                        " to " +
                        newStatus
        );

        return toKitchenResponse(
                saved
        );
    }


    // =========================================================
    // KITCHEN STATUS TRANSITION VALIDATION
    // =========================================================

    private boolean isValidKitchenTransition(
            OrderStatus current,
            OrderStatus next
    ) {

        return
                current == OrderStatus.PLACED &&
                        next == OrderStatus.CONFIRMED

                ||

                current == OrderStatus.CONFIRMED &&
                        next == OrderStatus.PREPARING

                ||

                current == OrderStatus.PREPARING &&
                        next == OrderStatus.READY;
    }


    // =========================================================
    // KITCHEN RESPONSE
    // =========================================================

    private KitchenOrderResponse toKitchenResponse(
            Order order
    ) {

        List<OrderItemResponse> items =
                orderItemRepository
                        .findByOrderId(
                                order.getId()
                        )
                        .stream()
                        .map(item ->
                                new OrderItemResponse(
                                        item.getMenuItem().getId(),
                                        item.getMenuItem().getName(),
                                        item.getQuantity(),
                                        item.getUnitPrice(),
                                        item.getTotalPrice(),
                                        item.getSpecialInstruction(),
                                        item.getStatus().name()
                                )
                        )
                        .toList();

        return new KitchenOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getTable().getTableNumber(),
                order.getStatus().name(),
                order.getTotalAmount(),
                items
        );
    }


    // =========================================================
    // WAITER - ALL READY ORDERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<WaiterOrderResponse>
    getReadyOrdersForLoggedInWaiter() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                authentication.getName() == null ||
                authentication.getName().isBlank()) {

            throw new IllegalArgumentException(
                    "User is not authenticated"
            );
        }

        String employeeId =
                authentication.getName();

        User waiter =
                userRepository
                        .findByEmployeeId(
                                employeeId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Logged-in employee not found"
                                )
                        );

        // -----------------------------------------------------
        // VERIFY LOGGED-IN EMPLOYEE IS A WAITER
        // -----------------------------------------------------

        if (waiter.getRole() != Role.WAITER) {

            throw new ConflictException(
                    "Logged-in employee is not a waiter"
            );
        }

        // -----------------------------------------------------
        // VERIFY ACCOUNT IS ACTIVE
        // -----------------------------------------------------

        if (!waiter.isActive()) {

            throw new ConflictException(
                    "Waiter account is inactive"
            );
        }

        // -----------------------------------------------------
        // GET ALL READY ORDERS
        // -----------------------------------------------------

        return orderRepository
                .findByStatusOrderByCreatedAtDesc(
                        OrderStatus.READY
                )
                .stream()
                .map(this::toWaiterResponse)
                .toList();
    }


    // =========================================================
    // WAITER - SERVE ANY READY ORDER
    // =========================================================

    @Transactional
    public WaiterOrderResponse updateServiceStatus(
            Long orderId,
            OrderStatus newStatus
    ) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                authentication.getName() == null ||
                authentication.getName().isBlank()) {

            throw new IllegalArgumentException(
                    "User is not authenticated"
            );
        }

        if (orderId == null) {

            throw new IllegalArgumentException(
                    "Order ID is required"
            );
        }

        if (newStatus == null) {

            throw new IllegalArgumentException(
                    "New order status is required"
            );
        }

        // -----------------------------------------------------
        // GET LOGGED-IN WAITER
        // -----------------------------------------------------

        String employeeId =
                authentication.getName();

        User loggedInWaiter =
                userRepository
                        .findByEmployeeId(
                                employeeId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Logged-in waiter not found"
                                )
                        );

        // -----------------------------------------------------
        // VERIFY WAITER ROLE
        // -----------------------------------------------------

        if (loggedInWaiter.getRole() !=
                Role.WAITER) {

            throw new ConflictException(
                    "Only a waiter can serve an order"
            );
        }

        // -----------------------------------------------------
        // VERIFY ACTIVE ACCOUNT
        // -----------------------------------------------------

        if (!loggedInWaiter.isActive()) {

            throw new ConflictException(
                    "Waiter account is inactive"
            );
        }

        // -----------------------------------------------------
        // GET ORDER
        // -----------------------------------------------------

        Order order =
                orderRepository.findById(
                        orderId
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Order not found: " +
                                orderId
                        )
                );

        // -----------------------------------------------------
        // ORDER MUST BE READY
        // -----------------------------------------------------

        if (order.getStatus() !=
                OrderStatus.READY) {

            throw new ConflictException(
                    "Only READY orders can be served"
            );
        }

        // -----------------------------------------------------
        // WAITER CAN ONLY DO READY → SERVED
        // -----------------------------------------------------

        if (newStatus !=
                OrderStatus.SERVED) {

            throw new ConflictException(
                    "Waiter can only change READY to SERVED"
            );
        }

        // -----------------------------------------------------
        // RECORD WHICH WAITER PICKED THE ORDER
        // -----------------------------------------------------

        order.setAssignedWaiter(
                loggedInWaiter
        );

        order.setStatus(
                OrderStatus.SERVED
        );

        // -----------------------------------------------------
        // UPDATE ORDER ITEMS
        // -----------------------------------------------------

        List<OrderItem> orderItems =
                orderItemRepository.findByOrderId(
                        orderId
                );

        for (OrderItem item :
                orderItems) {

            item.setStatus(
                    OrderItemStatus.SERVED
            );

            orderItemRepository.save(
                    item
            );
        }

        // -----------------------------------------------------
        // SAVE ORDER
        // -----------------------------------------------------

        Order savedOrder =
                orderRepository.save(
                        order
                );

        // -----------------------------------------------------
        // AUDIT LOG
        // -----------------------------------------------------

        auditLogService.log(
                AuditAction.CHANGE_ORDER_STATUS,
                "ORDER",
                savedOrder.getId(),
                "Waiter " +
                        loggedInWaiter.getFullName() +
                        " served order " +
                        savedOrder.getOrderNumber()
        );

        return toWaiterResponse(
                savedOrder
        );
    }


    // =========================================================
    // WAITER RESPONSE
    // =========================================================

    private WaiterOrderResponse toWaiterResponse(
            Order order
    ) {

        List<OrderItemResponse> items =
                orderItemRepository
                        .findByOrderId(
                                order.getId()
                        )
                        .stream()
                        .map(item ->
                                new OrderItemResponse(
                                        item.getMenuItem().getId(),
                                        item.getMenuItem().getName(),
                                        item.getQuantity(),
                                        item.getUnitPrice(),
                                        item.getTotalPrice(),
                                        item.getSpecialInstruction(),
                                        item.getStatus().name()
                                )
                        )
                        .toList();

        return new WaiterOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getTable().getTableNumber(),
                order.getStatus().name(),
                order.getTotalAmount(),
                items
        );
    }


    // =========================================================
    // ASSIGN / REASSIGN WAITER
    // =========================================================

    @Transactional
    public OrderResponse assignWaiter(
            Long orderId,
            Long waiterId
    ) {

        if (orderId == null) {

            throw new IllegalArgumentException(
                    "Order ID is required"
            );
        }

        if (waiterId == null) {

            throw new IllegalArgumentException(
                    "Waiter ID is required"
            );
        }

        Order order =
                orderRepository.findById(
                        orderId
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Order not found: "
                                        + orderId
                        )
                );

        User waiter =
                userRepository.findById(
                        waiterId
                ).orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Employee not found: "
                                        + waiterId
                        )
                );

        if (waiter.getRole() != Role.WAITER) {

            throw new ConflictException(
                    "Selected employee is not a waiter"
            );
        }

        if (!waiter.isActive()) {

            throw new ConflictException(
                    "Waiter account is inactive"
            );
        }

        // -----------------------------------------------------
        // CHECK WHETHER THIS IS REASSIGNMENT
        // -----------------------------------------------------

        User previousWaiter =
                order.getAssignedWaiter();

        order.setAssignedWaiter(
                waiter
        );

        Order saved =
                orderRepository.save(order);

        // -----------------------------------------------------
        // AUDIT LOG
        // -----------------------------------------------------

        if (previousWaiter == null) {

            auditLogService.log(
                    AuditAction.ASSIGN_WAITER,
                    "ORDER",
                    saved.getId(),
                    "Assigned waiter " +
                            waiter.getFullName() +
                            " to order " +
                            saved.getOrderNumber()
            );

        } else {

            auditLogService.log(
                    AuditAction.REASSIGN_WAITER,
                    "ORDER",
                    saved.getId(),
                    "Reassigned order " +
                            saved.getOrderNumber() +
                            " from waiter " +
                            previousWaiter.getFullName() +
                            " to waiter " +
                            waiter.getFullName()
            );
        }

        return toOrderResponse(
                saved
        );
    }


    // =========================================================
    // RECEPTION - ALL ORDERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<ReceptionOrderResponse>
    getAllReceptionOrders() {

        return orderRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toReceptionOrderResponse)
                .toList();
    }


    // =========================================================
    // RECEPTION - ORDERS BY STATUS
    // =========================================================

    @Transactional(readOnly = true)
    public List<ReceptionOrderResponse>
    getReceptionOrdersByStatus(
            OrderStatus status
    ) {

        if (status == null) {

            throw new IllegalArgumentException(
                    "Order status is required"
            );
        }

        return orderRepository
                .findByStatusOrderByCreatedAtDesc(
                        status
                )
                .stream()
                .map(this::toReceptionOrderResponse)
                .toList();
    }


    // =========================================================
    // RECEPTION - RESPONSE
    // =========================================================

    private ReceptionOrderResponse
    toReceptionOrderResponse(
            Order order
    ) {

        List<OrderItemResponse> items =
                orderItemRepository
                        .findByOrderId(
                                order.getId()
                        )
                        .stream()
                        .map(item ->
                                new OrderItemResponse(
                                        item.getMenuItem().getId(),
                                        item.getMenuItem().getName(),
                                        item.getQuantity(),
                                        item.getUnitPrice(),
                                        item.getTotalPrice(),
                                        item.getSpecialInstruction(),
                                        item.getStatus().name()
                                )
                        )
                        .toList();

        Long waiterId = null;
        String waiterName = null;

        if (order.getAssignedWaiter() != null) {

            waiterId =
                    order.getAssignedWaiter()
                            .getId();

            waiterName =
                    order.getAssignedWaiter()
                            .getFullName();
        }

        String tableNumber = null;

        if (order.getTable() != null) {

            tableNumber =
                    order.getTable()
                            .getTableNumber();
        }

        // -----------------------------------------------------
        // CUSTOMER SESSION CODE
        // -----------------------------------------------------

        String sessionCode = null;

        if (order.getCustomerSession() != null) {

            sessionCode =
                    order.getCustomerSession()
                            .getSessionCode();
        }

        return new ReceptionOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                tableNumber,
                sessionCode,
                order.getStatus().name(),
                order.getSubtotal(),
                order.getTax(),
                order.getDiscount(),
                order.getTotalAmount(),
                waiterId,
                waiterName,
                items
        );
    }


    // =========================================================
    // COMMON ORDER RESPONSE
    // =========================================================

    private OrderResponse toOrderResponse(
            Order order
    ) {

        List<OrderItemResponse> items =
                orderItemRepository
                        .findByOrderId(
                                order.getId()
                        )
                        .stream()
                        .map(item ->
                                new OrderItemResponse(
                                        item.getMenuItem().getId(),
                                        item.getMenuItem().getName(),
                                        item.getQuantity(),
                                        item.getUnitPrice(),
                                        item.getTotalPrice(),
                                        item.getSpecialInstruction(),
                                        item.getStatus().name()
                                )
                        )
                        .toList();

        return toOrderResponse(
                order,
                items
        );
    }


    private OrderResponse toOrderResponse(
            Order order,
            List<OrderItemResponse> items
    ) {

        Long waiterId = null;
        String waiterName = null;

        if (order.getAssignedWaiter() != null) {

            waiterId =
                    order.getAssignedWaiter()
                            .getId();

            waiterName =
                    order.getAssignedWaiter()
                            .getFullName();
        }

        String tableNumber = null;

        if (order.getTable() != null) {

            tableNumber =
                    order.getTable()
                            .getTableNumber();
        }

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                tableNumber,
                order.getStatus().name(),
                order.getSubtotal(),
                order.getTax(),
                order.getDiscount(),
                order.getTotalAmount(),
                items,
                waiterId,
                waiterName,
                order.getCustomerSession() != null
                        ? order.getCustomerSession().getSessionCode()
                        : null
        );
    }
}