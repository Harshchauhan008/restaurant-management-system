package com.restaurant.backend.Security;

import com.restaurant.backend.entity.User;
import com.restaurant.backend.Repository.UserRepository;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService
        implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(
            UserRepository userRepository
    ) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String employeeId)
            throws UsernameNotFoundException {

        User user = userRepository
                .findByEmployeeId(employeeId)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Employee not found"
                        )
                );

        List<SimpleGrantedAuthority> authorities =
                new ArrayList<>();

        // -------------------------------------------------
        // ROLE
        // -------------------------------------------------

        authorities.add(
                new SimpleGrantedAuthority(
                        "ROLE_" + user.getRole().name()
                )
        );

        // -------------------------------------------------
        // PERMISSIONS
        // -------------------------------------------------

        for (String permissionCode :
                RolePermissions.forRole(user.getRole())) {

            authorities.add(
                    new SimpleGrantedAuthority(permissionCode)
            );
        }

        System.out.println(
                "Employee: " + user.getEmployeeId()
        );

        System.out.println(
                "Authorities: " + authorities
        );

        // -------------------------------------------------
        // CUSTOM USER DETAILS
        // -------------------------------------------------

        return new CustomUserDetails(
                user.getEmployeeId(),
                user.getPassword(),
                user.isActive(),
                authorities,
                user.getCredentialsVersion()
        );
    }
}