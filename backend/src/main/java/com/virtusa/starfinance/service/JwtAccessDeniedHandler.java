// New class: JwtAccessDeniedHandler.java in com.virtusa.starfinance.service
package com.virtusa.starfinance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
public class JwtAccessDeniedHandler implements org.springframework.security.web.access.AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        String requestURI = request.getRequestURI();
        String acceptHeader = request.getHeader("Accept");
        boolean isApiRequest = requestURI.startsWith("/api/") ||
                (acceptHeader != null && acceptHeader.contains("application/json"));

        if (isApiRequest) {
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);

            Map<String, Object> errorResponse = Map.of(
                    "status", HttpServletResponse.SC_FORBIDDEN,
                    "error", "Forbidden",
                    "message", accessDeniedException.getMessage() != null ? accessDeniedException.getMessage() : "Access denied",
                    "path", requestURI
            );

            objectMapper.writeValue(response.getOutputStream(), errorResponse);
        } else {
            // Fallback to error page or redirect for browser requests
            response.sendRedirect("/access-denied");  // Or /login if preferred
        }
    }
}