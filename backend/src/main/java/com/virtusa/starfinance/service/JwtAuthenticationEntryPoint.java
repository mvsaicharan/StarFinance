package com.virtusa.starfinance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
public class JwtAuthenticationEntryPoint implements org.springframework.security.web.AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException, ServletException {

        String requestURI = request.getRequestURI();
        String acceptHeader = request.getHeader("Accept");
        boolean isApiRequest = requestURI.startsWith("/api/") ||
                (acceptHeader != null && acceptHeader.contains("application/json"));

        if (isApiRequest) {
            // JSON response for API clients
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

            Map<String, Object> errorResponse = Map.of(
                    "status", HttpServletResponse.SC_UNAUTHORIZED,
                    "error", "Unauthorized",
                    "message", authException.getMessage() != null ? authException.getMessage() : "Access denied",
                    "path", requestURI
            );

            objectMapper.writeValue(response.getOutputStream(), errorResponse);
        } else {
            // Redirect for browser requests
            response.sendRedirect("/login");
        }
    }
}