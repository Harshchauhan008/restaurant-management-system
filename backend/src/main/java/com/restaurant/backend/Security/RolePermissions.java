package com.restaurant.backend.Security;

import com.restaurant.backend.entity.Role;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

public class RolePermissions {

    private static final Map<Role, Set<String>> ROLE_PERMISSIONS =
            new EnumMap<>(Role.class);

    static {

        ROLE_PERMISSIONS.put(Role.ADMIN, Set.of(
                "VIEW_MENU",
                "CREATE_MENU_ITEM",
                "EDIT_MENU_ITEM",
                "DELETE_MENU_ITEM",
                "CHANGE_MENU_AVAILABILITY",
                "MANAGE_MENU_CATEGORIES",
                "MODERATE_REVIEWS",
                "MANAGE_RESERVATIONS",
                "MANAGE_TABLES",
                "VIEW_DASHBOARD",
                "VIEW_ALL_ORDERS",
                "ASSIGN_WAITER",
                "VIEW_ALL_TABLES",
                "CREATE_BILL",
                "VIEW_SERVED_ORDERS",
                "PRINT_BILL",
                "CONFIRM_CASH_COLLECTION"
        ));

        ROLE_PERMISSIONS.put(Role.MANAGER, ROLE_PERMISSIONS.get(Role.ADMIN));

        // Cashier and Receptionist are the same front-desk job here,
        // so they share the same permission set.
        Set<String> frontDesk = Set.of(
                "CONFIRM_CASH_COLLECTION",
                "PRINT_BILL",
                "CREATE_BILL",
                "VIEW_SERVED_ORDERS",
                "MANAGE_RESERVATIONS",
                "MANAGE_TABLES",
                "VIEW_DASHBOARD",
                "VIEW_ALL_ORDERS",
                "VIEW_ALL_TABLES"
        );

        ROLE_PERMISSIONS.put(Role.CASHIER, frontDesk);
        ROLE_PERMISSIONS.put(Role.RECEPTIONIST, frontDesk);

        ROLE_PERMISSIONS.put(Role.WAITER, Set.of(
                "VIEW_ALL_ORDERS"
        ));

        ROLE_PERMISSIONS.put(Role.KITCHEN, Set.of(
                "VIEW_ALL_ORDERS"
        ));

        ROLE_PERMISSIONS.put(Role.STAFF, Set.of());
    }

    private RolePermissions() {
    }

    public static Set<String> forRole(Role role) {
        return ROLE_PERMISSIONS.getOrDefault(role, Set.of());
    }
}