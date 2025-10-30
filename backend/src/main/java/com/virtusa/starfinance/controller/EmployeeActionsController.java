package com.virtusa.starfinance.controller;

import com.virtusa.starfinance.dto.*;
import com.virtusa.starfinance.entity.Employee;
import com.virtusa.starfinance.repository.EmployeeRepository;
import com.virtusa.starfinance.service.EmployeeCreationService;
import com.virtusa.starfinance.service.LoanApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.NoSuchElementException;
import java.util.List;

@RestController
@RequestMapping("/api/customer/employee")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BANK_STAFF', 'BANK_ADMIN')")
public class EmployeeActionsController {

    private final LoanApplicationService loanApplicationService;
    private final EmployeeRepository employeeRepository;
    private final EmployeeCreationService employeeCreationService;

    /**
     * Handles loan status updates initiated by bank employees. (Step 1, 4, 6)
     * POST /api/customer/employee/loan/{rid}/status
     */
    @PostMapping("/loan/{rid}/status")
    public ResponseEntity<Void> updateLoanStatus(
            @PathVariable String rid,
            @Valid @RequestBody LoanStatusUpdateRequest request,
            Authentication authentication) {

        try {
            // Pass the new status AND the rejection reason to the service
            loanApplicationService.updateLoanStatus(rid, request.getNewStatus(), request.getRejectionReason());

            // Return 204 NO_CONTENT, which is better for this update and fixes the previous parsing error (if you had one).
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan application not found with ID: " + rid);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update loan status: " + e.getMessage());
        }
    }

    @PostMapping("/loan/{rid}/evaluate")
    public ResponseEntity<String> submitEvaluationData(
            @PathVariable String rid,
            @Valid @RequestBody EvaluationDataRequest request) {

        try {
            loanApplicationService.completeGoldEvaluation(rid, request);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan application not found with ID: " + rid);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to submit evaluation data: " + e.getMessage());
        }
    }

    @PostMapping("/loan/{rid}/disburse")
    public ResponseEntity<String> disburseLoan(@PathVariable String rid) {
        try {
            // Service method updates status to DISBURSED and handles final logic
            loanApplicationService.disburseLoan(rid);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan application not found.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Disbursement failed: " + e.getMessage());
        }
    }

    @PostMapping("/loan/{rid}/collect-gold")
    public ResponseEntity<String> collectGold(@PathVariable String rid) {
        try {
            loanApplicationService.collectGold(rid);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan application not found.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Gold collection failed: " + e.getMessage());
        }
    }

    @PostMapping(value = "/create", produces = "application/json")
    @PreAuthorize("hasRole('BANK_ADMIN')")
    public ResponseEntity<Employee> createNewEmployee(@Valid @RequestBody NewEmployeeRequest request) {
        try {
            // Call the service to handle password hashing and saving the new employee
            Employee newEmployee = employeeCreationService.createEmployee(request);
            // Return 201 CREATED with the newly created employee object
            return new ResponseEntity<>(newEmployee, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            // e.g., Username already exists, invalid role
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create new employee: " + e.getMessage());
        }
    }

    /**
     * Note: You should move other employee endpoints like getLoanDetailsById
     * and getAllLoanApplications (if using the /api/customer/employee path) here as well.
     */
    @GetMapping("/profile")
    public ResponseEntity<Employee> getEmployeeProfile(Authentication authentication) {
        String username = authentication.getName();  // Extract from JWT subject
        Employee employee = employeeRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Customer not found")); // Note: This exception message is slightly misleading for an Employee profile endpoint, but keeping it for now.
        return ResponseEntity.ok(employee);
    }

    /**
     * 💡 NEW ENDPOINT: Fetches all loan applications for the Employee Dashboard.
     * Angular will call GET /api/customer/employee/loans
     */
    @GetMapping("/loans")
    public ResponseEntity<List<LoanResponse>> getAllLoanApplications(Authentication authentication) {
        List<LoanResponse> loans = loanApplicationService.getAllLoanApplications();
        return ResponseEntity.ok(loans);
    }


    @GetMapping("/loan/{rid}")
    public ResponseEntity<LoanDetailsResponse> getLoanDetailsById(@PathVariable String rid, Authentication authentication) {

        try {
            LoanDetailsResponse details = loanApplicationService.getLoanDetailsByRid(rid);
            return ResponseEntity.ok(details);
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan application not found with ID: " + rid);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve loan details.");
        }
    }
}