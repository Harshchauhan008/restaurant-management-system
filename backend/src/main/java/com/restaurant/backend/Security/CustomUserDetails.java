package com.restaurant.backend.Security;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public class CustomUserDetails
        extends org.springframework.security.core.userdetails.User {

    private final Long credentialsVersion;

    public CustomUserDetails(
            String username,
            String password,
            boolean enabled,
            Collection<? extends GrantedAuthority> authorities,
            Long credentialsVersion
    ) {

        super(
                username,
                password,
                enabled,
                true,  // accountNonExpired
                true,  // credentialsNonExpired
                true,  // accountNonLocked
                authorities
        );

        this.credentialsVersion = credentialsVersion;
    }

    public Long getCredentialsVersion() {
        return credentialsVersion;
    }
}