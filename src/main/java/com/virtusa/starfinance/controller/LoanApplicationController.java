package com.virtusa.starfinance.controller;

import com.virtusa.starfinance.dto.*;
import com.virtusa.starfinance.entity.Customer;
import com.virtusa.starfinance.service.LoanApplicationService;
import com.virtusa.starfinance.repository.CustomerRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class LoanApplicationController {

    private final CustomerRepository customerRepository;
    private final LoanApplicationService loanApplicationService;

    /**
     * Endpoint to fetch pre-filled customer and bank details (Read-only).
     * Angular will call GET /api/customer/loan-details-prefill
     */
    @GetMapping("/loan-details-prefill")
    public ResponseEntity<CustomerDetailsResponse> getPrefillDetails(Authentication authentication) {
        String email = authentication.getName();

        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated customer not found."));

        if (customer.getKycVerified() == null || !customer.getKycVerified()) {
            // ... logic
        }

        CustomerDetailsResponse response = new CustomerDetailsResponse();
        response.setId(customer.getId());
        response.setFullName(customer.getName());
        response.setKnNumber(customer.getKnNumber());
        response.setGender(customer.getGender());
        response.setMobileNumber(customer.getMobileNumber());
        response.setEmailId(customer.getEmail());
        response.setKycVerified(customer.getKycVerified() != null && customer.getKycVerified());

        response.setAccountNumber(customer.getBankAccountNumber());
        response.setIfscCode(customer.getIfscCode());
        response.setBankName("Verified Bank Name");
        response.setAccountHolderName(customer.getName());
        response.setBranchName("Verified Branch");

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint to submit the loan application.
     * Angular will call POST /api/customer/loan-application
     */
    @PostMapping("/loan-application")
    public ResponseEntity<String> submitLoanApplication(@Valid @RequestBody LoanApplicationRequest request, Authentication authentication) {
        Customer authCustomer = customerRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user session."));

        if (!authCustomer.getId().equals(request.getCustomerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Customer ID mismatch with authenticated user.");
        }

        try {
            String rid = loanApplicationService.createLoanApplication(request);
            return new ResponseEntity<>("Loan application submitted successfully. Reference ID: " + rid, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to submit loan application: " + e.getMessage());
        }
    }

    /**
     * 💡 NEW ENDPOINT: Allows the customer to signal that the physical gold has been submitted (Step 2).
     * Angular will call POST /api/customer/loan/submit-gold/{rid}
     */
    @PostMapping("/loan/submit-gold/{rid}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> submitGoldForLoan(
            @PathVariable String rid,
            Authentication authentication) {

        // The status to transition to
        String newStatus = "GOLD_SUBMITTED";

        try {
            // Uses the customer-specific service method which includes ownership and state checks
            loanApplicationService.updateLoanStatusByCustomer(rid, authentication.getName(), newStatus);
            return ResponseEntity.ok("Gold submission confirmed. Status updated to awaiting evaluation.");
        } catch (SecurityException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan application not found or status invalid.");
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to confirm gold submission: " + e.getMessage());
        }
    }

    @PostMapping("/loan/offer-decision/{rid}")
    // Inherits @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> recordOfferDecision(
            @PathVariable String rid,
            @Valid @RequestBody LoanStatusUpdateRequest request, // Reusing this DTO
            Authentication authentication) {

        String email = authentication.getName();
        String newStatus = request.getNewStatus();

        try {
            // Service method needs to handle the offer transition (OFFER_MADE -> OFFER_ACCEPTED/OFFER_REJECTED)
            loanApplicationService.updateOfferDecision(rid, email, newStatus);
            return ResponseEntity.ok("Offer decision recorded: " + newStatus);
        } catch (SecurityException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan application not found.");
        }
    }

    @PostMapping("/loan/pay-fine/{rid}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> payFine(
            @PathVariable String rid,
            @Valid @RequestBody FinePaymentRequest request, // Use the new DTO
            Authentication authentication) {

        try {
            loanApplicationService.payRejectionFine(rid, authentication.getName(), request);
            return ResponseEntity.ok("Fine paid successfully. You may now collect your collateral.");
        } catch (SecurityException | IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PostMapping("/loan/{rid}/status")
    public ResponseEntity<String> updateLoanStatusByCustomer(
            @PathVariable String rid,
            @RequestBody LoanStatusUpdateRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        String newStatus = request.getNewStatus();

        // 1. Input Validation: Ensure customer is only attempting to reset to PENDING
        if (!newStatus.equalsIgnoreCase("PENDING")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status update. Customer can only re-apply by setting status to PENDING.");
        }

        try {
            // 💡 FIX: Call the dedicated reApplyLoan service method.
            loanApplicationService.reApplyLoan(rid, email);

            return ResponseEntity.ok("Loan application successfully reset to PENDING. Please update your details.");
        } catch (SecurityException e) {
            // Catches if the loan doesn't belong to the customer
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (IllegalStateException e) {
            // Catches if the status transition is invalid (e.g., trying to re-apply from VERIFIED)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (NoSuchElementException e) {
            // Catches if the loan is not found
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }


    @GetMapping("/loans")
    public ResponseEntity<List<LoanResponse>> getCustomerLoans(Authentication authentication) {
        String email = authentication.getName();

        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated customer not found."));

        List<LoanResponse> loans = loanApplicationService.getLoansByCustomerId(customer.getId());

        return ResponseEntity.ok(loans);
    }


}