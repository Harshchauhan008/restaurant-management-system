package com.restaurant.backend.Controller;

import com.restaurant.backend.dto.CreateMenuCategoryRequest;
import com.restaurant.backend.dto.CreateMenuItemRequest;
import com.restaurant.backend.dto.MenuItemResponse;
import com.restaurant.backend.dto.UpdateMenuItemRequest;
import com.restaurant.backend.entity.MenuCategory;
import com.restaurant.backend.Service.MenuCategoryService;
import com.restaurant.backend.Service.MenuItemService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/menu")
public class AdminMenuController {

    private final MenuCategoryService categoryService;
    private final MenuItemService itemService;

    public AdminMenuController(
            MenuCategoryService categoryService,
            MenuItemService itemService
    ) {
        this.categoryService = categoryService;
        this.itemService = itemService;
    }

    // =========================================================
    // CATEGORY
    // =========================================================

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('MANAGE_MENU_CATEGORIES')"
    )
    public MenuCategory createCategory(
            @RequestBody CreateMenuCategoryRequest request
    ) {

        return categoryService.createCategory(request);
    }


    @GetMapping("/categories")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('VIEW_MENU')"
    )
    public List<MenuCategory> getCategories() {

        return categoryService.getActiveCategories();
    }


    // =========================================================
    // MENU ITEMS
    // =========================================================

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('CREATE_MENU_ITEM')"
    )
    public MenuItemResponse createItem(
            @RequestBody CreateMenuItemRequest request
    ) {

        return itemService.createItem(request);
    }


    @GetMapping("/items")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('VIEW_MENU')"
    )
    public List<MenuItemResponse> getAllItems() {

        return itemService.getAllItems();
    }


    @GetMapping("/items/{id}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('VIEW_MENU')"
    )
    public MenuItemResponse getItem(
            @PathVariable Long id
    ) {

        return itemService.getItem(id);
    }


    // =========================================================
    // IMAGE UPLOAD
    // =========================================================

    @PostMapping(
            value = "/upload-image",
            consumes = "multipart/form-data"
    )
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('EDIT_MENU_ITEM')"
    )
    public String uploadImage(
            @RequestParam("file") MultipartFile file
    ) {

        return itemService.uploadImage(file);
    }


    // =========================================================
    // EDIT
    // =========================================================

    @PutMapping("/items/{id}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('EDIT_MENU_ITEM')"
    )
    public MenuItemResponse updateItem(
            @PathVariable Long id,
            @RequestBody UpdateMenuItemRequest request
    ) {

        return itemService.updateItem(
                id,
                request
        );
    }


    // =========================================================
    // AVAILABILITY
    // =========================================================

    @PatchMapping("/items/{id}/availability")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('CHANGE_MENU_AVAILABILITY')"
    )
    public MenuItemResponse changeAvailability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {

        return itemService.changeAvailability(
                id,
                available
        );
    }


    // =========================================================
    // ACTIVE / INACTIVE
    // =========================================================

    @PatchMapping("/items/{id}/active")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('EDIT_MENU_ITEM')"
    )
    public MenuItemResponse changeActiveStatus(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        return itemService.changeActiveStatus(
                id,
                active
        );
    }


    // =========================================================
    // ARCHIVE
    // =========================================================

    @DeleteMapping("/items/{id}")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('DELETE_MENU_ITEM')"
    )
    public MenuItemResponse archiveItem(
            @PathVariable Long id
    ) {

        return itemService.archiveItem(id);
    }


    // =========================================================
    // RESTORE
    // =========================================================

    @PatchMapping("/items/{id}/restore")
    @PreAuthorize(
            "hasRole('ADMIN') or " +
            "hasAuthority('EDIT_MENU_ITEM')"
    )
    public MenuItemResponse restoreItem(
            @PathVariable Long id
    ) {

        return itemService.restoreItem(id);
    }
}