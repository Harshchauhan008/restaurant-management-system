package com.restaurant.backend.dto;

import java.math.BigDecimal;

public class MenuItemResponse {

    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private boolean available;
    private boolean active;
    private Integer preparationTimeMinutes;

   public MenuItemResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        BigDecimal price,
        String imageUrl,
        boolean available,
        boolean active,
        Integer preparationTimeMinutes
    ) {
        this.id = id;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.available = available;
        this.active = active;
        this.preparationTimeMinutes = preparationTimeMinutes;
    }

    public Long getId() {
        return id;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
    return price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public boolean isAvailable() {
        return available;
    }

    public boolean isActive() {
        return active;
    }

    public Integer getPreparationTimeMinutes() {
        return preparationTimeMinutes;
    }
}