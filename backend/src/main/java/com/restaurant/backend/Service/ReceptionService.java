package com.restaurant.backend.Service;

import com.restaurant.backend.Repository.OrderRepository;
import com.restaurant.backend.Repository.RestaurantTableRepository;

import com.restaurant.backend.dto.ReceptionDashboardResponse;
import com.restaurant.backend.dto.ReceptionTableResponse;

import com.restaurant.backend.entity.Order;
import com.restaurant.backend.entity.OrderStatus;
import com.restaurant.backend.entity.TableStatus;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReceptionService {

    private final RestaurantTableRepository tableRepository;
    private final OrderRepository orderRepository;

    public ReceptionService(
            RestaurantTableRepository tableRepository,
            OrderRepository orderRepository
    ) {
        this.tableRepository = tableRepository;
        this.orderRepository = orderRepository;
    }

    // =====================================================
    // RECEPTION DASHBOARD
    // =====================================================

    public ReceptionDashboardResponse getDashboard() {

        long totalTables =
                tableRepository.count();

        long availableTables =
                tableRepository.countByStatus(
                        TableStatus.AVAILABLE
                );

        long occupiedTables =
                tableRepository.countByStatus(
                        TableStatus.OCCUPIED
                );

        long reservedTables =
                tableRepository.countByStatus(
                        TableStatus.RESERVED
                );

        long placedOrders =
                orderRepository.countByStatus(
                        OrderStatus.PLACED
                );

        long preparingOrders =
                orderRepository.countByStatus(
                        OrderStatus.PREPARING
                );

        long readyOrders =
                orderRepository.countByStatus(
                        OrderStatus.READY
                );

        long servedOrders =
                orderRepository.countByStatus(
                        OrderStatus.SERVED
                );

        long activeOrders =
                placedOrders +
                preparingOrders +
                readyOrders +
                servedOrders;

        return new ReceptionDashboardResponse(
                totalTables,
                availableTables,
                occupiedTables,
                reservedTables,
                activeOrders,
                placedOrders,
                preparingOrders,
                readyOrders,
                servedOrders
        );
    }


    // =====================================================
    // RECEPTION - ALL TABLES
    // =====================================================

    public List<ReceptionTableResponse> getTables() {

        return tableRepository
                .findAll()
                .stream()
                .map(table -> {

                    Long orderId = null;
                    String orderNumber = null;

                    Long waiterId = null;
                    String waiterName = null;

                    /*
                     * Get active orders for this table.
                     *
                     * COMPLETED orders are ignored because
                     * they are no longer active.
                     */
                    List<Order> orders =
                            orderRepository
                                    .findByTableIdAndStatusNotOrderByCreatedAtDesc(
                                            table.getId(),
                                            OrderStatus.COMPLETED
                                    );

                    /*
                     * Because repository returns newest first,
                     * the first order is the latest active order.
                     */
                    if (!orders.isEmpty()) {

                        Order latestOrder =
                                orders.get(0);

                        orderId =
                                latestOrder.getId();

                        orderNumber =
                                latestOrder.getOrderNumber();

                        if (latestOrder
                                .getAssignedWaiter() != null) {

                            waiterId =
                                    latestOrder
                                            .getAssignedWaiter()
                                            .getId();

                            waiterName =
                                    latestOrder
                                            .getAssignedWaiter()
                                            .getFullName();
                        }
                    }

                    return new ReceptionTableResponse(
                            table.getId(),
                            table.getTableNumber(),
                            table.getCapacity(),
                            table.getLocation(),
                            table.getStatus().name(),
                            table.isActive(),
                            orderId,
                            orderNumber,
                            waiterId,
                            waiterName
                    );
                })
                .toList();
    }
}