package com.restaurant.backend.Config;

import com.restaurant.backend.entity.Permission;
import com.restaurant.backend.Repository.PermissionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PermissionInitializer {

    @Bean
    CommandLineRunner createPermissions(
            PermissionRepository permissionRepository
    ) {
        return args -> {

            add(permissionRepository,
                    "VIEW_ORDERS",
                    "View restaurant orders");

            add(permissionRepository,
                    "CREATE_ORDER",
                    "Create orders");

            add(permissionRepository,
                    "EDIT_ORDER",
                    "Edit orders");

            add(permissionRepository,
                    "CANCEL_ORDER",
                    "Cancel orders");

            add(permissionRepository,
                    "VIEW_TABLES",
                    "View restaurant tables");

            add(permissionRepository,
                    "MANAGE_TABLES",
                    "Manage restaurant tables");

            add(permissionRepository,
                    "VIEW_MENU",
                    "View menu");

            add(permissionRepository,
                    "EDIT_MENU",
                    "Edit menu");

            add(permissionRepository,
                    "CHANGE_MENU_AVAILABILITY",
                    "Mark menu items available/unavailable");

            add(permissionRepository,
                    "VIEW_KITCHEN_ORDERS",
                    "View kitchen orders");

            add(permissionRepository,
                    "UPDATE_KITCHEN_STATUS",
                    "Update kitchen order status");

            add(permissionRepository,
                    "VIEW_RESERVATIONS",
                    "View reservations");

            add(permissionRepository,
                    "MANAGE_RESERVATIONS",
                    "Manage reservations");

            add(permissionRepository,
                    "VIEW_BILLS",
                    "View bills");

            add(permissionRepository,
                    "CREATE_BILL",
                    "Create bills");

            add(permissionRepository,
                    "PROCESS_PAYMENT",
                    "Process payments");

            add(permissionRepository,
                    "VIEW_REPORTS",
                    "View reports");

            add(permissionRepository,
                    "VIEW_SALES_REPORT",
                    "View sales reports");

            add(permissionRepository,
                    "VIEW_REVIEWS",
                    "View customer reviews");

            add(permissionRepository,
                    "APPROVE_REVIEWS",
                    "Approve customer reviews");

            add(permissionRepository,
                    "MANAGE_EMPLOYEES",
                    "Create and manage employees");

            add(permissionRepository,
                    "MANAGE_PERMISSIONS",
                    "Assign employee permissions");

            add(permissionRepository,
                        "CREATE_MENU_ITEM",
                        "Create menu items" );
            add(permissionRepository,
                        "DELETE_MENU_ITEM",
                        "Archive or deactivate menu items");
            add(permissionRepository,
                        "MANAGE_MENU_CATEGORIES",
                        "Create and manage menu categories");

            add(permissionRepository,
                        "VIEW_KITCHEN_ORDERS",
                        "View orders in the kitchen");

            add(permissionRepository,
                        "UPDATE_KITCHEN_STATUS",
                        "Update kitchen order status");

            add(permissionRepository,
                        "ASSIGN_WAITER",
                        "Assign or reassign an order to a waiter");

           add(permissionRepository,
                        "VIEW_ASSIGNED_ORDERS",
                        "View orders assigned to the logged-in waiter");

           add(permissionRepository,
                        "VIEW_SERVED_ORDERS",
                        "View served orders ready for billing");

           add(permissionRepository,
                        "CREATE_BILL",
                        "Generate a bill for a served order");

           add(permissionRepository,
                        "PRINT_BILL",
                        "Print a restaurant bill");

           add(permissionRepository,
                        "CONFIRM_CASH_COLLECTION",
                        "Confirm that physical payment was collected");

           add(permissionRepository,
                        "VIEW_DASHBOARD",
                        "View restaurant dashboard");

           add(permissionRepository,
                        "VIEW_ALL_ORDERS",
                        "View all restaurant orders");

           add(permissionRepository,
                        "VIEW_ALL_TABLES",
                        "View all restaurant tables");

           add(permissionRepository,
                        "MODERATE_REVIEWS",
                        "Approve, reject and hide customer reviews");
        };
    }

    private void add(
            PermissionRepository repository,
            String code,
            String description
    ) {
        if (!repository.existsByPermissionCode(code)) {

            repository.save(
                    new Permission(code, description)
            );
        }
    }
}