package com.virtusa.starfinance.service.impl;

import com.virtusa.starfinance.dto.NewEmployeeRequest;
import com.virtusa.starfinance.entity.Employee;
import com.virtusa.starfinance.repository.EmployeeRepository;
import com.virtusa.starfinance.service.EmployeeCreationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeCreationServiceImpl implements EmployeeCreationService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    // Optional: Retain for explicit validation if preferred over enum-only check
    private static final List<String> VALID_ROLES = List.of("BANK_ADMIN", "BANK_STAFF");

    @Override
    public Employee createEmployee(NewEmployeeRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Employee request cannot be null.");
        }

        // 1. Check if the username already exists
        if (employeeRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' already exists.");
        }

        // 2. Optional explicit role validation
        if (!VALID_ROLES.contains(request.getRole())) {
            throw new IllegalArgumentException("Invalid role specified: " + request.getRole() + ". Valid roles: " + VALID_ROLES);
        }

        // 3. Convert String role to Employee.Role Enum
        Employee.Role employeeRole;
        try {
            employeeRole = Employee.Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role specified: " + request.getRole());
        }

        // 4. Create the new Employee entity
        Employee newEmployee = new Employee();
        newEmployee.setUsername(request.getUsername());
        newEmployee.setFullName(request.getFullName());
        newEmployee.setBranchName(request.getBranchName());
        newEmployee.setRole(employeeRole);

        // 5. Hash the password before saving
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        newEmployee.setPassword(hashedPassword);

        // 6. Save and log success
        Employee savedEmployee = employeeRepository.save(newEmployee);
        log.info("New employee created successfully: username={}, role={}", savedEmployee.getUsername(), savedEmployee.getRole());

        return savedEmployee;
    }
}