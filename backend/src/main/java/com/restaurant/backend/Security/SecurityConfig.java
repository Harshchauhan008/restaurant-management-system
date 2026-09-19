package com.restaurant.backend.Security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }


    // =====================================================
    // PASSWORD ENCODER
    // =====================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =====================================================
    // CORS CONFIGURATION
    // =====================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // -------------------------------------------------
        // FRONTEND ORIGIN
        // -------------------------------------------------

        configuration.setAllowedOrigins(
                List.of(
                        frontendUrl
                )
        );

        // -------------------------------------------------
        // HTTP METHODS
        // -------------------------------------------------

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        // -------------------------------------------------
        // REQUEST HEADERS
        // -------------------------------------------------

        configuration.setAllowedHeaders(
                List.of("*")
        );

        // -------------------------------------------------
        // EXPOSED RESPONSE HEADERS
        // -------------------------------------------------

        configuration.setExposedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type"
                )
        );

        // -------------------------------------------------
        // CREDENTIALS
        // -------------------------------------------------

        configuration.setAllowCredentials(true);

        // -------------------------------------------------
        // REGISTER CORS
        // -------------------------------------------------

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }


    // =====================================================
    // SECURITY FILTER CHAIN
    // =====================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                // =========================================
                // CORS
                // =========================================

                .cors(cors -> {})


                // =========================================
                // CSRF
                // =========================================

                .csrf(csrf -> csrf.disable())


                // =========================================
                // SESSION
                // =========================================

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )


                // =========================================
                // AUTHORIZATION
                // =========================================

                .authorizeHttpRequests(auth -> auth

                        // =================================
                        // PUBLIC CUSTOMER APIs
                        // =================================

                        .requestMatchers(
                                "/",
                                "/api/auth/**",
                                "/api/menu/**",
                                "/api/table/**",
                                "/api/orders",
                                "/api/orders/**",
                                "/api/reservations",
                                "/api/reservations/**",
                                "/api/reviews",
                                "/api/reviews/**"
                        ).permitAll()


                        // =================================
                        // PUBLIC UPLOADED IMAGES
                        // =================================

                        /*
                         * Menu images are stored in:
                         *
                         * uploads/menu/
                         *
                         * Browser/customer menu must be
                         * able to load these images
                         * without JWT.
                         */

                        .requestMatchers(
                                "/uploads/**"
                        )
                        .permitAll()


                        // =================================
                        // MENU ADMIN / DELEGATED PERMISSION
                        // =================================

                        /*
                         * AdminMenuController uses
                         * @PreAuthorize for:
                         *
                         * VIEW_MENU
                         * CREATE_MENU_ITEM
                         * EDIT_MENU_ITEM
                         * DELETE_MENU_ITEM
                         * CHANGE_MENU_AVAILABILITY
                         * MANAGE_MENU_CATEGORIES
                         *
                         * Therefore do not require ADMIN
                         * at URL level here.
                         */

                        .requestMatchers(
                                "/api/admin/menu/**"
                        )
                        .authenticated()


                        // =================================
                        // REVIEW MODERATION
                        // =================================

                        /*
                         * AdminReviewController uses
                         *
                         * ADMIN
                         * OR
                         * MODERATE_REVIEWS
                         *
                         * Therefore authentication is enough
                         * at URL level and @PreAuthorize
                         * decides the actual permission.
                         */

                        .requestMatchers(
                                "/api/admin/reviews/**"
                        )
                        .authenticated()


                        // =================================
                        // ADMIN
                        // =================================

                        .requestMatchers(
                                "/api/admin/**"
                        )
                        .hasRole("ADMIN")


                        // =================================
                        // KITCHEN
                        // =================================

                        .requestMatchers(
                                "/api/kitchen/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "KITCHEN"
                        )


                        // =================================
                        // WAITER
                        // =================================

                        .requestMatchers(
                                "/api/waiter/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "WAITER"
                        )


                        // =================================
                        // CASHIER
                        // =================================

                        .requestMatchers(
                                "/api/cashier/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "CASHIER",
                                "RECEPTIONIST"
                        )


                        // =================================
                        // RECEPTION
                        // =================================

                        /*
                         * ReceptionController and
                         * ReceptionReservationController
                         * use delegated permissions such as:
                         *
                         * VIEW_DASHBOARD
                         * VIEW_ALL_ORDERS
                         * ASSIGN_WAITER
                         * VIEW_ALL_TABLES
                         * MANAGE_TABLES
                         * MANAGE_RESERVATIONS
                         *
                         * Therefore do not restrict this
                         * namespace to ROLE_RECEPTION here.
                         *
                         * @PreAuthorize handles the actual
                         * operation-level permission.
                         */

                        .requestMatchers(
                                "/api/reception/**"
                        )
                        .authenticated()


                        // =================================
                        // EVERYTHING ELSE
                        // =================================

                        .anyRequest()
                        .authenticated()
                )


                // =========================================
                // JWT FILTER
                // =========================================

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}