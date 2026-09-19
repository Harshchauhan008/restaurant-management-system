package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderItemRepository
        extends JpaRepository<OrderItem, Long> {

    // =====================================================
    // EXISTING
    // =====================================================

    List<OrderItem> findByOrderId(Long orderId);

    // =====================================================
    // REPORT QUERIES
    // =====================================================

    List<OrderItem> findByOrder_CreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );
}