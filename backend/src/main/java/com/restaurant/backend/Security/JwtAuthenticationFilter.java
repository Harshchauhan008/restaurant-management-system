package com.restaurant.backend.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader =
                request.getHeader("Authorization");

        // =================================================
        // NO JWT TOKEN
        // =================================================

        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token =
                authHeader.substring(7);

        // =================================================
        // CHECK TOKEN SIGNATURE + EXPIRATION
        // =================================================

        if (!jwtService.isTokenValid(token)) {

            SecurityContextHolder.clearContext();

            filterChain.doFilter(request, response);
            return;
        }

        try {

            // =================================================
            // GET EMPLOYEE ID FROM JWT
            // =================================================

            String employeeId =
                    jwtService.extractEmployeeId(token);

            // =================================================
            // GET CREDENTIALS VERSION FROM JWT
            // =================================================

            Long tokenCredentialsVersion =
                    jwtService.extractCredentialsVersion(token);

            // -------------------------------------------------
            // OLD JWT WITHOUT credentialsVersion
            // -------------------------------------------------

            if (tokenCredentialsVersion == null) {

                SecurityContextHolder.clearContext();

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.setContentType(
                        "application/json"
                );

                response.getWriter().write(
                        "{\"message\":\"Authentication token is outdated. Please login again.\"}"
                );

                return;
            }

            // =================================================
            // LOAD CURRENT USER FROM DATABASE
            // =================================================

            UserDetails userDetails =
                    userDetailsService
                            .loadUserByUsername(employeeId);

            // =================================================
            // CHECK ACCOUNT ACTIVE
            // =================================================

            if (!userDetails.isEnabled()) {

                SecurityContextHolder.clearContext();

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.setContentType(
                        "application/json"
                );

                response.getWriter().write(
                        "{\"message\":\"Employee account is disabled\"}"
                );

                return;
            }

            // =================================================
            // CHECK CREDENTIALS VERSION
            // =================================================

            if (!(userDetails instanceof CustomUserDetails)) {

                SecurityContextHolder.clearContext();

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.setContentType(
                        "application/json"
                );

                response.getWriter().write(
                        "{\"message\":\"Invalid user authentication configuration\"}"
                );

                return;
            }

            CustomUserDetails customUserDetails =
                    (CustomUserDetails) userDetails;

            Long currentCredentialsVersion =
                    customUserDetails.getCredentialsVersion();

            // -------------------------------------------------
            // JWT VERSION != DATABASE VERSION
            // -------------------------------------------------

            if (currentCredentialsVersion == null ||
                    !currentCredentialsVersion.equals(
                            tokenCredentialsVersion
                    )) {

                SecurityContextHolder.clearContext();

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.setContentType(
                        "application/json"
                );

                response.getWriter().write(
                        "{\"message\":\"Your credentials have changed. Please login again.\"}"
                );

                return;
            }

            // =================================================
            // CREATE AUTHENTICATION
            // =================================================

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

        } catch (UsernameNotFoundException e) {

            SecurityContextHolder.clearContext();

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.setContentType(
                    "application/json"
            );

            response.getWriter().write(
                    "{\"message\":\"Employee account not found\"}"
            );

            return;

        } catch (Exception e) {

            SecurityContextHolder.clearContext();

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.setContentType(
                    "application/json"
            );

            response.getWriter().write(
                    "{\"message\":\"Invalid authentication token\"}"
            );

            return;
        }

        // =================================================
        // CONTINUE REQUEST
        // =================================================

        filterChain.doFilter(request, response);
    }
}