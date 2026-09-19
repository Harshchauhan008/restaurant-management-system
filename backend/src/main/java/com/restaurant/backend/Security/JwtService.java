package com.restaurant.backend.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expiration;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration
    ) {
        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );

        this.expiration = expiration;
    }

    // =====================================================
    // GENERATE TOKEN
    // =====================================================

    public String generateToken(
            String employeeId,
            String role,
            Long credentialsVersion
    ) {

        Date now = new Date();

        Date expiryDate =
                new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(employeeId)
                .claim("role", role)
                .claim("credentialsVersion", credentialsVersion)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }


    // =====================================================
    // EXTRACT EMPLOYEE ID
    // =====================================================

    public String extractEmployeeId(String token) {

        return getClaims(token)
                .getSubject();
    }


    // =====================================================
    // EXTRACT CREDENTIALS VERSION
    // =====================================================

    public Long extractCredentialsVersion(String token) {

        Object version =
                getClaims(token)
                        .get("credentialsVersion");

        if (version == null) {
            return null;
        }

        return ((Number) version).longValue();
    }


    // =====================================================
    // CHECK TOKEN VALIDITY
    // =====================================================

    public boolean isTokenValid(String token) {

        try {

            Claims claims = getClaims(token);

            return claims.getExpiration()
                    .after(new Date());

        } catch (Exception e) {

            return false;
        }
    }


    // =====================================================
    // GET CLAIMS
    // =====================================================

    private Claims getClaims(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}