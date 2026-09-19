package com.restaurant.backend.Repository;

import com.restaurant.backend.entity.RestaurantSettings;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantSettingsRepository
        extends JpaRepository<RestaurantSettings, Long> {
}