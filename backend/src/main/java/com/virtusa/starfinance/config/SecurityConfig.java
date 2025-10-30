package com.virtusa.starfinance.config;

import com.virtusa.starfinance.handler.OAuth2AuthenticationSuccessHandler;
import com.virtusa.starfinance.service.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // Sonar Fix: Defined constants for repeated literals
    private static final String ROLE_BANK_STAFF = "BANK_STAFF";
    private static final String ROLE_BANK_ADMIN = "BANK_ADMIN";
    private static final String ROLE_CUSTOMER = "CUSTOMER";


    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2FailureHandler;

    public SecurityConfig(JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
                          JwtAuthenticationFilter jwtAuthenticationFilter,
                          UserDetailsServiceImpl userDetailsService,
                          OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
                          JwtAccessDeniedHandler jwtAccessDeniedHandler, OAuth2AuthenticationFailureHandler oAuth2FailureHandler) {
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
        this.jwtAccessDeniedHandler = jwtAccessDeniedHandler;
        this.oAuth2FailureHandler = oAuth2FailureHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // 1. PUBLIC PATHS & HEALTH CHECKS (Permit All)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**", "/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/api/bullion/rates").permitAll()

                        // 2. EMPLOYEE-SPECIFIC PATHS (Role-based access)
                        // Explicit GET paths for detail views
                        .requestMatchers(HttpMethod.GET,
                                "/api/customer/employee/loans",
                                "/api/customer/employee/loan/{rid}"
                        ).hasAnyRole(ROLE_BANK_STAFF, ROLE_BANK_ADMIN) // <-- Used Constant

                        // General Employee Paths
                        .requestMatchers("/api/customer/employee/**", "/api/employee/**")
                        .hasAnyRole(ROLE_BANK_STAFF, ROLE_BANK_ADMIN) // <-- Used Constant

                        // Specific POST for create (tighter control)
                        .requestMatchers(HttpMethod.POST, "/api/customer/employee/create").hasRole(ROLE_BANK_ADMIN) // <-- Used Constant


                        // 3. CUSTOMER-SPECIFIC PATHS (Role-based access)
                        .requestMatchers("/api/kyc/**").hasRole(ROLE_CUSTOMER) // <-- Used Constant
                        .requestMatchers("/api/customer/**").hasRole(ROLE_CUSTOMER) // <-- Used Constant


                        // 4. CATCH-ALL (Requires JWT for everything else)
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        // OAuth2 login configuration
        http.oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl("/api/auth/oauth/success", true)
                .userInfoEndpoint(userInfo -> userInfo.userService(userDetailsService))
                .successHandler(oAuth2AuthenticationSuccessHandler)
                .failureHandler(oAuth2FailureHandler)
        );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://127.0.0.1:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}