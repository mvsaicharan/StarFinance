// V:\Virtusa Capstone Project\starfinance\src\main\java\com\virtusa\starfinance\service\AuthService.java

package com.virtusa.starfinance.service;

import com.virtusa.starfinance.entity.Customer;
import com.virtusa.starfinance.entity.Employee;
import com.virtusa.starfinance.repository.CustomerRepository;
import com.virtusa.starfinance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CustomerRepository customerRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Resets the customer's password after verifying email and date of birth.
     */
    @Transactional
    public void resetCustomerPassword(String email, String dateOfBirth, String newPassword) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Customer not found."));

        // 1. Verification Check: Compare DOB provided by the user with the stored DOB
        // NOTE: Date formats must match (e.g., ISO_LOCAL_DATE: YYYY-MM-DD)
        if (dateOfBirth == null || !dateOfBirth.equals(customer.getDateOfBirth())) {
            throw new IllegalArgumentException("Verification failed: Date of Birth does not match.");
        }

        // 2. Update Password
        customer.setPassword(passwordEncoder.encode(newPassword));
        customerRepository.save(customer);
    }

    /**
     * Resets the employee's password after verifying email (username).
     * NOTE: Employee verification is simplified here (only email/username lookup).
     */
    @Transactional
    public void resetEmployeePassword(String email, String newPassword) {
        Employee employee = employeeRepository.findByUsername(email)
                .orElseThrow(() -> new NoSuchElementException("Employee not found."));

        // 1. Verification Check (Additional checks like security questions would go here)
        // For simplicity, we assume finding the employee by email/username is sufficient for the reset process.

        // 2. Update Password
        employee.setPassword(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
    }

    @Transactional
    public void changeCustomerPassword(String email, String currentPassword, String newPassword) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Customer not found."));

        // 1. Verify Current Password
        if (!passwordEncoder.matches(currentPassword, customer.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        // 2. Update Password
        customer.setPassword(passwordEncoder.encode(newPassword));
        customerRepository.save(customer);
    }

    /**
     * Authenticates the current password and updates it for the employee.
     */
    @Transactional
    public void changeEmployeePassword(String username, String currentPassword, String newPassword) {
        Employee employee = employeeRepository.findByUsername(username)
                .orElseThrow(() -> new NoSuchElementException("Employee not found."));

        // 1. Verify Current Password
        if (!passwordEncoder.matches(currentPassword, employee.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        // 2. Update Password
        employee.setPassword(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
    }
}