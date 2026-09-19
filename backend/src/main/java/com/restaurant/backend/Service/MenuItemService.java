package com.restaurant.backend.Service;

import com.restaurant.backend.dto.CreateMenuItemRequest;
import com.restaurant.backend.dto.MenuItemResponse;
import com.restaurant.backend.dto.UpdateMenuItemRequest;
import com.restaurant.backend.entity.MenuCategory;
import com.restaurant.backend.entity.MenuItem;
import com.restaurant.backend.Repository.MenuCategoryRepository;
import com.restaurant.backend.Repository.MenuItemRepository;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class MenuItemService {

    private final MenuItemRepository itemRepository;
    private final MenuCategoryRepository categoryRepository;

    /*
     * Menu images are stored inside:
     *
     * backend/
     * └── uploads/
     *     └── menu/
     *
     * Convert this to an absolute normalized path once.
     */
    private final Path menuUploadDirectory =
            Paths.get("uploads", "menu")
                    .toAbsolutePath()
                    .normalize();

    public MenuItemService(
            MenuItemRepository itemRepository,
            MenuCategoryRepository categoryRepository
    ) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
    }

    // =========================================================
    // CREATE
    // =========================================================

    public MenuItemResponse createItem(
            CreateMenuItemRequest request
    ) {

        MenuCategory category =
                categoryRepository.findById(
                        request.getCategoryId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Category not found"
                        )
                );

        MenuItem item = new MenuItem();

        item.setCategory(category);
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setImageUrl(request.getImageUrl());

        item.setPreparationTimeMinutes(
                request.getPreparationTimeMinutes()
        );

        item.setAvailable(true);
        item.setActive(true);

        MenuItem saved =
                itemRepository.save(item);

        return toResponse(saved);
    }

    // =========================================================
    // GET ALL ACTIVE ITEMS - ADMIN/MANAGER
    // =========================================================

    public List<MenuItemResponse> getAllItems() {

        return itemRepository
                .findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // GET PUBLIC AVAILABLE ITEMS
    // =========================================================

    public List<MenuItemResponse> getAvailableItems() {

        return itemRepository
                .findByAvailableTrueAndActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // GET AVAILABLE ITEMS BY CATEGORY
    // =========================================================

    public List<MenuItemResponse> getAvailableItemsByCategory(
            Long categoryId
    ) {

        return itemRepository
                .findByCategoryId(categoryId)
                .stream()
                .filter(item ->
                        item.isAvailable()
                                && item.isActive()
                )
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // GET SINGLE ITEM
    // =========================================================

    public MenuItemResponse getItem(Long id) {

        MenuItem item =
                itemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Menu item not found"
                                )
                        );

        return toResponse(item);
    }

    // =========================================================
    // EDIT ITEM
    // =========================================================

    public MenuItemResponse updateItem(
            Long id,
            UpdateMenuItemRequest request
    ) {

        MenuItem item =
                itemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Menu item not found"
                                )
                        );

        if (request.getCategoryId() != null) {

            MenuCategory category =
                    categoryRepository.findById(
                            request.getCategoryId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Category not found"
                            )
                    );

            item.setCategory(category);
        }

        if (request.getName() != null) {
            item.setName(
                    request.getName()
            );
        }

        if (request.getDescription() != null) {
            item.setDescription(
                    request.getDescription()
            );
        }

        if (request.getPrice() != null) {
            item.setPrice(
                    request.getPrice()
            );
        }

        /*
         * Image URL can come from either:
         *
         * 1. External URL
         * 2. Uploaded image path
         *
         * Both use the same imageUrl database column.
         */
        item.setImageUrl(
                request.getImageUrl()
        );

        if (request.getPreparationTimeMinutes() != null) {

            item.setPreparationTimeMinutes(
                    request.getPreparationTimeMinutes()
            );
        }

        return toResponse(
                itemRepository.save(item)
        );
    }

    // =========================================================
    // IMAGE UPLOAD
    // =========================================================

    public String uploadImage(
            MultipartFile file
    ) {

        // -----------------------------------------------------
        // FILE EXISTS
        // -----------------------------------------------------

        if (file == null ||
                file.isEmpty()) {

            throw new IllegalArgumentException(
                    "Image file is required"
            );
        }

        // -----------------------------------------------------
        // MAX SIZE = 5 MB
        // -----------------------------------------------------

        long maxSize =
                5L * 1024L * 1024L;

        if (file.getSize() > maxSize) {

            throw new IllegalArgumentException(
                    "Image size must be 5 MB or less"
            );
        }

        // -----------------------------------------------------
        // MIME TYPE CHECK
        // -----------------------------------------------------

        String contentType =
                file.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new IllegalArgumentException(
                    "Only image files are allowed"
            );
        }

        // -----------------------------------------------------
        // ORIGINAL FILE NAME
        // -----------------------------------------------------

        String originalFilename =
                file.getOriginalFilename();

        if (originalFilename == null ||
                originalFilename.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Invalid image filename"
            );
        }

        // -----------------------------------------------------
        // GET EXTENSION
        // -----------------------------------------------------

        String extension = "";

        int lastDot =
                originalFilename.lastIndexOf(".");

        if (lastDot >= 0) {

            extension =
                    originalFilename
                            .substring(lastDot)
                            .toLowerCase();
        }

        // -----------------------------------------------------
        // ALLOWED EXTENSIONS
        // -----------------------------------------------------

        if (!extension.equals(".jpg") &&
                !extension.equals(".jpeg") &&
                !extension.equals(".png") &&
                !extension.equals(".webp")) {

            throw new IllegalArgumentException(
                    "Only JPG, JPEG, PNG and WEBP images are allowed"
            );
        }

        // -----------------------------------------------------
        // CREATE UPLOAD DIRECTORY
        // -----------------------------------------------------

        try {

            Files.createDirectories(
                    menuUploadDirectory
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Could not create menu upload directory: "
                            + menuUploadDirectory,
                    e
            );
        }

        // -----------------------------------------------------
        // GENERATE SERVER-SIDE FILE NAME
        // -----------------------------------------------------

        String filename =
                UUID.randomUUID()
                        .toString()
                        + extension;

        // -----------------------------------------------------
        // CREATE TARGET PATH
        // -----------------------------------------------------

        Path targetPath =
                menuUploadDirectory
                        .resolve(filename)
                        .normalize();

        // -----------------------------------------------------
        // SECURITY CHECK
        // -----------------------------------------------------

        /*
         * targetPath MUST remain inside
         * menuUploadDirectory.
         */
        if (!targetPath.startsWith(
                menuUploadDirectory
        )) {

            throw new IllegalArgumentException(
                    "Invalid image path"
            );
        }

        // -----------------------------------------------------
        // SAVE FILE
        // -----------------------------------------------------

        try {

            file.transferTo(
                    targetPath.toFile()
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to save menu image",
                    e
            );
        }

        // -----------------------------------------------------
        // RETURN WEB URL
        // -----------------------------------------------------

        /*
         * Example:
         *
         * /uploads/menu/
         * 6c8c0f8c-7f7c-4e2b-a0f4-1d7d4b3d1abc.jpg
         */
        return "/uploads/menu/" + filename;
    }

    // =========================================================
    // AVAILABLE / UNAVAILABLE
    // =========================================================

    public MenuItemResponse changeAvailability(
            Long id,
            boolean available
    ) {

        MenuItem item =
                itemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Menu item not found"
                                )
                        );

        item.setAvailable(
                available
        );

        return toResponse(
                itemRepository.save(item)
        );
    }

    // =========================================================
    // ACTIVE / INACTIVE
    // =========================================================

    public MenuItemResponse changeActiveStatus(
            Long id,
            boolean active
    ) {

        MenuItem item =
                itemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Menu item not found"
                                )
                        );

        item.setActive(
                active
        );

        return toResponse(
                itemRepository.save(item)
        );
    }

    // =========================================================
    // SOFT DELETE / ARCHIVE
    // =========================================================

    public MenuItemResponse archiveItem(
            Long id
    ) {

        MenuItem item =
                itemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Menu item not found"
                                )
                        );

        item.setActive(false);

        return toResponse(
                itemRepository.save(item)
        );
    }

    // =========================================================
    // RESTORE
    // =========================================================

    public MenuItemResponse restoreItem(
            Long id
    ) {

        MenuItem item =
                itemRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Menu item not found"
                                )
                        );

        item.setActive(true);

        return toResponse(
                itemRepository.save(item)
        );
    }

    // =========================================================
    // RESPONSE MAPPER
    // =========================================================

    private MenuItemResponse toResponse(
            MenuItem item
    ) {

        return new MenuItemResponse(
                item.getId(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getImageUrl(),
                item.isAvailable(),
                item.isActive(),
                item.getPreparationTimeMinutes()
        );
    }
}