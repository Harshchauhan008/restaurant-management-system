package com.restaurant.backend.Controller;

import com.restaurant.backend.Service.MenuCategoryService;
import com.restaurant.backend.Service.MenuItemService;

import com.restaurant.backend.dto.MenuItemResponse;
import com.restaurant.backend.entity.MenuCategory;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class PublicMenuController {

    private final MenuCategoryService categoryService;
    private final MenuItemService itemService;

    public PublicMenuController(
            MenuCategoryService categoryService,
            MenuItemService itemService
    ) {
        this.categoryService = categoryService;
        this.itemService = itemService;
    }

    // =========================================
    // PUBLIC CATEGORIES
    // =========================================

    @GetMapping("/categories")
    public List<MenuCategory> getCategories() {

        return categoryService.getActiveCategories();
    }

    // =========================================
    // PUBLIC AVAILABLE MENU ITEMS
    // =========================================

    @GetMapping("/items")
    public List<MenuItemResponse> getAvailableItems() {

        return itemService.getAvailableItems();
    }

    // =========================================
    // PUBLIC ITEMS BY CATEGORY
    // =========================================

    @GetMapping("/items/category/{categoryId}")
    public List<MenuItemResponse> getItemsByCategory(
            @PathVariable Long categoryId
    ) {

        return itemService
                .getAvailableItemsByCategory(categoryId);
    }
}