package com.restaurant.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "permissions")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String permissionCode;

    private String description;

    public Permission() {
    }

    public Permission(String permissionCode, String description) {
        this.permissionCode = permissionCode;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public String getPermissionCode() {
        return permissionCode;
    }

    public void setPermissionCode(String permissionCode) {
        this.permissionCode = permissionCode;
    }

     public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
