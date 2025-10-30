package com.virtusa.starfinance.service;

import com.virtusa.starfinance.entity.Customer;
import com.virtusa.starfinance.entity.Employee;
import com.virtusa.starfinance.repository.CustomerRepository;
import com.virtusa.starfinance.repository.EmployeeRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;


import java.util.Collections;
import java.util.List;
import java.util.Optional;


@Service
public class UserDetailsServiceImpl implements UserDetailsService, OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final DefaultOAuth2UserService oAuth2UserService = new DefaultOAuth2UserService();

    public UserDetailsServiceImpl(CustomerRepository customerRepository, EmployeeRepository employeeRepository) {
        this.customerRepository = customerRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Try to find customer
        Optional<Customer> customerOpt = customerRepository.findByEmail(username);
        if (customerOpt.isPresent()) {
            return buildCustomerUserDetails(customerOpt.get());
        }

        // 2. If no customer, try to find employee
        Optional<Employee> employeeOpt = employeeRepository.findByUsername(username);
        if (employeeOpt.isPresent()) {
            return buildEmployeeUserDetails(employeeOpt.get());
        }

        // 3. If neither found, throw the exception, causing AuthenticationManager failure
        throw new UsernameNotFoundException("User not found: " + username);
    }

    private UserDetails buildCustomerUserDetails(Customer customer) {
        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(customer.getRole()));
        return User.builder()
                .username(customer.getEmail())
                .password(customer.getPassword())
                .authorities(authorities)
                .disabled(false)  // Override to allow login with pending KYC
                .build();
    }

    private UserDetails buildEmployeeUserDetails(Employee employee) {
        // Access the role ENUM, get its name (e.g., BANK_STAFF), and prepend "ROLE_"
        String authorityString = "ROLE_" + employee.getRole().name();

        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(authorityString));

        return User.builder()
                .username(employee.getUsername())
                .password(employee.getPassword())
                .authorities(authorities)
                .build();
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws UsernameNotFoundException {
        OAuth2User oAuth2User = oAuth2UserService.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        final String userId = oAuth2User.getAttribute("sub") != null
                ? oAuth2User.getAttribute("sub")
                : oAuth2User.getAttribute("id");

        Customer customer = customerRepository.findByOauthIdAndOauthProvider(userId, registrationId)
                .orElseThrow(() -> new UsernameNotFoundException("OAuth user not found: " + userId));

        return new DefaultOAuth2User(
                Collections.singletonList(new SimpleGrantedAuthority(customer.getRole())),
                oAuth2User.getAttributes(),
                "email");
    }
}