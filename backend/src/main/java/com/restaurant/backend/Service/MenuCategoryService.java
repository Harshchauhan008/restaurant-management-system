package com.restaurant.backend.Service;

import com.restaurant.backend.dto.CreateMenuCategoryRequest;
import com.restaurant.backend.entity.MenuCategory;
import com.restaurant.backend.Repository.MenuCategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuCategoryService {

    private final MenuCategoryRepository categoryRepository;

    public MenuCategoryService(
            MenuCategoryRepository categoryRepository
    ) {
        this.categoryRepository = categoryRepository;
    }

    public MenuCategory createCategory(
            CreateMenuCategoryRequest request
    ) {

        if (categoryRepository.existsByNameIgnoreCase(
                request.getName()
        )) {
            throw new RuntimeException(
                    "Category already exists"
            );
        }

        MenuCategory category = new MenuCategory();

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        if (request.getDisplayOrder() != null) {
            category.setDisplayOrder(
                    request.getDisplayOrder()
            );
        }

        return categoryRepository.save(category);
    }

    public List<MenuCategory> getActiveCategories() {

        return categoryRepository.findAll()
                .stream()
                .filter(MenuCategory::isActive)
                .sorted((a, b) ->
                        Integer.compare(
                                a.getDisplayOrder(),
                                b.getDisplayOrder()
                        )
                )
                .toList();
    }
}