package com.virtusa.starfinance.controller;

import com.virtusa.starfinance.dto.KycRequest;
import com.virtusa.starfinance.dto.KycResponse;
import com.virtusa.starfinance.entity.Customer;
import com.virtusa.starfinance.entity.KycReference;
import com.virtusa.starfinance.repository.CustomerRepository;
import com.virtusa.starfinance.repository.KycReferenceRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.security.SecureRandom;

@RestController
@RequestMapping("/api/kyc")
@CrossOrigin(origins = {"http://localhost:4200"})
public class KycController {

    // Sonar Fix: Define a single, static, and final instance of Random for reuse
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CustomerRepository customerRepository;
    private final KycReferenceRepository kycReferenceRepository;

    public KycController(CustomerRepository customerRepository, KycReferenceRepository kycReferenceRepository) {
        this.customerRepository = customerRepository;
        this.kycReferenceRepository = kycReferenceRepository;
    }

    @PostMapping("/verify")
    public ResponseEntity<KycResponse> verifyKyc(@Valid @RequestBody KycRequest request, Authentication authentication) {
        String email = authentication.getName();
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Using the correct getter: getKycStatus()
        boolean alreadyVerified = customer.getKycStatus();

        // ----------------------------------------------------------------------------------
        // 1. Core Identity Validation (ONLY if KYC is NOT already verified)
        // ----------------------------------------------------------------------------------
        if (!alreadyVerified) {
            // Simulated External KYC API Verification (using MySQL reference data)
            Optional<KycReference> kycRecord = kycReferenceRepository.findByAadhaarNumberAndPanNumber(
                    request.getAadhaarNumber(), request.getPanNumber()
            );

            if (kycRecord.isEmpty()) {
                return ResponseEntity.badRequest().body(new KycResponse("KYC verification failed. Aadhaar and PAN details do not match official records.", null));
            }

            // Check if Aadhaar is already in use by another customer
            Optional<Customer> existingAadhaarOwner = customerRepository.findByAadhaar(request.getAadhaarNumber());
            if (existingAadhaarOwner.isPresent() && !existingAadhaarOwner.get().getId().equals(customer.getId())) {
                return ResponseEntity.badRequest().body(new KycResponse("Aadhaar number is already linked to another user.", null));
            }

            // Check if PAN is already in use by another customer
            Optional<Customer> existingPanOwner = customerRepository.findByPanCard(request.getPanNumber());
            if (existingPanOwner.isPresent() && !existingPanOwner.get().getId().equals(customer.getId())) {
                return ResponseEntity.badRequest().body(new KycResponse("PAN card number is already linked to another user.", null));
            }

            // Generate unique KN number on successful initial verification
            customer.setKnNumber(generateKnNumber());
            customer.setKycStatus(true);      // Maps to kyc_status (updated to 1)
            customer.setKycVerified(true);    // Maps to kyc_verified (updated to 1)

        } // If alreadyVerified is true, we skip the core validation section

        // ----------------------------------------------------------------------------------
        // 2. Update Customer Details (Applies to both initial verification and profile updates)
        // ----------------------------------------------------------------------------------

        // VITAL CORRECTION: Force kyc_verified to 1 if kyc_status is 1 (for data consistency)
        if (customer.getKycStatus() && customer.getKycVerified().equals(false)) {
            customer.setKycVerified(true);
        }

        // Update customer with ALL KYC details. Disabled fields are included via getRawValue() from Angular.
        customer.setName(request.getFullName());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setGender(request.getGender());
        customer.setMobileNumber(request.getMobileNumber());

        // Core Identity: Only update if not already verified (Angular disables them post-verification)
        if (!alreadyVerified) {
            customer.setAadhaar(request.getAadhaarNumber());
            customer.setPanCard(request.getPanNumber());
        }

        customer.setPassportNumber(request.getPassportNumber());
        customer.setFullAddress(request.getAddress());
        customer.setCity(request.getCity());
        customer.setState(request.getState());
        customer.setPinCode(request.getPinCode());
        customer.setOccupation(request.getOccupation());
        customer.setIncome(request.getIncome());
        customer.setBankAccountNumber(request.getBankAccountNumber());
        customer.setIfscCode(request.getIfscCode());
        customer.setExistingLoans(request.getExistingLoans());

        customerRepository.save(customer);

        // ----------------------------------------------------------------------------------
        // 3. Response
        // ----------------------------------------------------------------------------------
        if (!alreadyVerified) {
            return ResponseEntity.ok(new KycResponse("KYC verified successfully", customer.getKnNumber()));
        } else {
            return ResponseEntity.ok(new KycResponse("Profile updated successfully", customer.getKnNumber()));
        }
    }

    private String generateKnNumber() {
        // Now uses the class-level RANDOM object
        // Generates "KN" + timestamp (milliseconds) + random 4-digit number
        return "KN" + System.currentTimeMillis() + String.format("%04d", RANDOM.nextInt(10000));
    }
}