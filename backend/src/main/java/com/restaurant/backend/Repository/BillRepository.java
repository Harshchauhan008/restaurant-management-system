package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.Bill;
import com.restaurant.backend.entity.BillStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BillRepository
        extends JpaRepository<Bill, Long> {

    Optional<Bill> findByOrderId(Long orderId);

    Optional<Bill> findByCustomerSessionId(Long customerSessionId);

    Optional<Bill> findByBillNumber(String billNumber);

    List<Bill> findByStatus(BillStatus status);

    // =====================================================
    // PAYMENT CONCURRENCY PROTECTION
    // =====================================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT b
            FROM Bill b
            WHERE b.id = :id
            """)
    Optional<Bill> findByIdForUpdate(@Param("id") Long id);

    // =====================================================
    // REPORT QUERIES
    // =====================================================

    List<Bill> findByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    List<Bill> findByStatusAndCreatedAtBetween(
            BillStatus status,
            LocalDateTime start,
            LocalDateTime end
    );
}