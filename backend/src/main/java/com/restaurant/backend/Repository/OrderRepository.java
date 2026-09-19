package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.Order;
import com.restaurant.backend.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository
        extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    // =====================================================
    // REVIEW TOKEN
    // =====================================================

    Optional<Order> findByReviewToken(String reviewToken);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByTableId(Long tableId);

    List<Order> findByAssignedWaiterId(Long waiterId);

    List<Order> findByAssignedWaiterIdAndStatus(
            Long waiterId,
            OrderStatus status
    );

    long countByStatus(OrderStatus status);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByStatusOrderByCreatedAtDesc(
            OrderStatus status
    );

    List<Order> findByTableIdAndStatusNotOrderByCreatedAtDesc(
            Long tableId,
            OrderStatus status
    );

    // =====================================================
    // CUSTOMER SESSION ORDERS
    // =====================================================

    List<Order> findByCustomerSessionIdOrderByCreatedAtAsc(
            Long customerSessionId
    );

    // =====================================================
    // REPORT QUERIES
    // =====================================================

    List<Order> findByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    List<Order> findByStatusAndCreatedAtBetween(
            OrderStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    List<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime start,
            LocalDateTime end
    );
}