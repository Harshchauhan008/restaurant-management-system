package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MenuCategoryRepository
        extends JpaRepository<MenuCategory, Long> {

    Optional<MenuCategory> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}