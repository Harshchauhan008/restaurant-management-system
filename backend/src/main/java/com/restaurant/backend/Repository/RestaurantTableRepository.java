package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.RestaurantTable;
import com.restaurant.backend.entity.TableStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface RestaurantTableRepository
        extends JpaRepository<RestaurantTable, Long> {

    Optional<RestaurantTable> findByTableNumber(String tableNumber);

    // ---------------------------------------------------------
    // NORMAL QR LOOKUP
    // Used by QR verification.
    // No database lock.
    // ---------------------------------------------------------
    Optional<RestaurantTable> findByQrToken(String qrToken);

    // ---------------------------------------------------------
    // LOCKED QR LOOKUP
    // Used only while creating an order.
    // Explicit query is required because the method name
    // contains "ForUpdate".
    // ---------------------------------------------------------
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT rt
            FROM RestaurantTable rt
            WHERE rt.qrToken = :qrToken
            """)
    Optional<RestaurantTable> findByQrTokenForUpdate(
            @Param("qrToken") String qrToken
    );

    boolean existsByTableNumber(String tableNumber);

    boolean existsByQrToken(String qrToken);

    long countByStatus(TableStatus status);
}