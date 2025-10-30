package com.virtusa.starfinance.service;

import com.virtusa.starfinance.dto.*;
import com.virtusa.starfinance.entity.Asset;
import com.virtusa.starfinance.entity.Customer;
import com.virtusa.starfinance.entity.LoanApplication;
import com.virtusa.starfinance.repository.AssetRepository;
import com.virtusa.starfinance.repository.CustomerRepository;
import com.virtusa.starfinance.repository.LoanApplicationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.virtusa.starfinance.dto.LoanDetailsResponse.ApplicantDetails;
import com.virtusa.starfinance.dto.LoanDetailsResponse.AssetDetails;
import com.virtusa.starfinance.dto.LoanDetailsResponse.FinancialDetails;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LoanApplicationService {

    private static final String RID_NOT_FOUND_MSG = "Loan application not found with RID: ";
    private static final String STATUS_OFFER_ACCEPTED = "OFFER_ACCEPTED";
    private static final String STATUS_OFFER_REJECTED = "OFFER_REJECTED";

    private final CustomerRepository customerRepository;
    private final AssetRepository assetRepository;
    private final LoanApplicationRepository loanApplicationRepository;

    @Transactional
    public String createLoanApplication(LoanApplicationRequest request) {

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new NoSuchElementException("Customer not found with ID: " + request.getCustomerId()));

        if (customer.getKycVerified() == null || !customer.getKycVerified()) {
            throw new IllegalStateException("Customer KYC is not verified. Cannot apply for loan.");
        }

        Asset asset = new Asset();
        asset.setCustomer(customer);
        asset.setType(Asset.AssetType.fromPurity(request.getPurity()));
        asset.setWeight(BigDecimal.valueOf(request.getNetWeight()));

        asset = assetRepository.save(asset);

        LoanApplication loanApplication = new LoanApplication();
        loanApplication.setCustomer(customer);
        loanApplication.setAsset(asset);
        loanApplication.setAmount(BigDecimal.valueOf(request.getAmountSeeking()));
        loanApplication.setRid("GLN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        loanApplication.setStatus(LoanApplication.LoanStatus.PENDING);

        loanApplication = loanApplicationRepository.save(loanApplication);

        return loanApplication.getRid();
    }

    /**
     * Retrieves all loan applications for the authenticated Customer.
     */
    public List<LoanResponse> getLoansByCustomerId(Long customerId) {
        List<LoanApplication> loanApplications = loanApplicationRepository.findByCustomerId(customerId);

        return loanApplications.stream()
                .map(loan -> {
                    LoanResponse response = new LoanResponse();
                    response.setId(loan.getRid());
                    response.setStatus(loan.getStatus().name());

                    Customer customer = loan.getCustomer();
                    if (customer != null) {
                        response.setName(customer.getName());
                        response.setKn(customer.getKnNumber());
                    } else {
                        response.setName("N/A");
                        response.setKn("N/A");
                    }

                    if (loan.getAsset() != null && loan.getAsset().getType() != null) {
                        response.setType("Gold Loan - " + loan.getAsset().getType().getDbValue());
                    } else {
                        response.setType("Gold Loan");
                    }

                    response.setCreatedAt(loan.getCreatedAt());

                    response.setFinalValue(loan.getFinalValue());

                    response.setRejectionReason(loan.getRejectionReason());

                    return response;
                })
                .toList();
    }

    /**
     * Retrieves all loan applications for the Employee Dashboard.
     */
    public List<LoanResponse> getAllLoanApplications() {
        List<LoanApplication> loanApplications = loanApplicationRepository.findAll();

        return loanApplications.stream()
                .map(loan -> {
                    LoanResponse response = new LoanResponse();
                    response.setId(loan.getRid());
                    response.setStatus(loan.getStatus().name());

                    Customer customer = loan.getCustomer();
                    if (customer != null) {
                        response.setName(customer.getName());
                        response.setKn(customer.getKnNumber());
                    } else {
                        response.setName("Unknown");
                        response.setKn("N/A");
                    }

                    response.setType("Gold Loan");
                    response.setCreatedAt(loan.getCreatedAt());

                    return response;
                })
                .toList();
    }

    /**
     * Updates the status of a specific loan application by RID (Used by Employee).
     */
    @Transactional
    public void updateLoanStatus(String rid, String newStatus, String rejectionReason) {
        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        if ((newStatus.equalsIgnoreCase(STATUS_OFFER_ACCEPTED) || newStatus.equalsIgnoreCase(STATUS_OFFER_REJECTED))
                && !loanApp.getStatus().name().equalsIgnoreCase("OFFER_MADE")) {

            throw new IllegalStateException("Cannot process offer decision. Current status is " + loanApp.getStatus().name() + ". Must be Offer Made.");
        }

        try {
            LoanApplication.LoanStatus status = LoanApplication.LoanStatus.valueOf(newStatus.toUpperCase());
            loanApp.setStatus(status);

            // CRITICAL FIX: Explicitly handle saving/clearing the rejectionReason
            if (status == LoanApplication.LoanStatus.REJECTED_FOR_REVIEW) {
                // Save the reason provided by the employee
                loanApp.setRejectionReason(rejectionReason);
            } else if (loanApp.getRejectionReason() != null) {
                // Clear the reason when moving to any other non-rejection status
                loanApp.setRejectionReason(null);
            }

            loanApplicationRepository.save(loanApp);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid loan status: " + newStatus);
        }
    }

    /**
     * FIX: Customer-specific status update logic for Gold Submission (Step 2).
     */
    @Transactional
    public void updateLoanStatusByCustomer(String rid, String customerEmail, String newStatus) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new NoSuchElementException("Customer not found."));

        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        // 1. Ownership Check
        if (!loanApp.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied: Loan does not belong to the authenticated customer.");
        }

        // 2. State Transition Check (Must move from Verified to GOLD_SUBMITTED)
        if (!loanApp.getStatus().name().equalsIgnoreCase("VERIFIED")) {
            throw new IllegalStateException("Cannot submit gold. Loan status is " + loanApp.getStatus().name() + ". Must be Verified.");
        }

        try {
            // 3. Update Status
            LoanApplication.LoanStatus status = LoanApplication.LoanStatus.valueOf(newStatus.toUpperCase());
            loanApp.setStatus(status);
            loanApplicationRepository.save(loanApp);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid loan status: " + newStatus);
        }
    }


    @Transactional
    public LoanDetailsResponse getLoanDetailsByRid(String rid) {
        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        Customer customer = loanApp.getCustomer();
        Asset asset = loanApp.getAsset();

        LoanDetailsResponse response = new LoanDetailsResponse();
        response.setRid(loanApp.getRid());
        response.setStatus(loanApp.getStatus());
        response.setCreatedAt(loanApp);
        response.setAmount(loanApp.getAmount());

        response.setRejectionReason(loanApp.getRejectionReason());

        ApplicantDetails applicantDetails = new ApplicantDetails();
        if (customer != null) {
            applicantDetails.setFullName(customer.getName());
            applicantDetails.setKnNumber(customer.getKnNumber());
            applicantDetails.setMobileNumber(customer.getMobileNumber());
            applicantDetails.setEmailId(customer.getEmail());
        }
        response.setApplicant(applicantDetails);

        AssetDetails assetDetails = new AssetDetails();
        assetDetails.setItemType("N/A - Gold");
        assetDetails.setNumberOfItems(1);
        if (asset != null) {
            Optional.ofNullable(asset.getType()).ifPresent(type -> assetDetails.setPurity(type.getDbValue()));
            assetDetails.setNetWeight(asset.getWeight());
        } else {
            assetDetails.setPurity("N/A");
            assetDetails.setNetWeight(BigDecimal.ZERO);
        }
        response.setAsset(assetDetails);

        FinancialDetails financialDetails = new FinancialDetails();
        if (customer != null) {
            financialDetails.setAccountHolderName(customer.getName());
            financialDetails.setAccountNumber(customer.getBankAccountNumber());
            financialDetails.setIfscCode(customer.getIfscCode());
            financialDetails.setBankName("Inferred/Verified Bank");
        }
        response.setFinancial(financialDetails);

        return response;
    }

    @Transactional
    public void completeGoldEvaluation(String rid, EvaluationDataRequest request) {
        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        // 1. State check (Must be GOLD_SUBMITTED)
        if (!loanApp.getStatus().name().equalsIgnoreCase("GOLD_SUBMITTED")) {
            throw new IllegalStateException("Cannot evaluate. Loan status is " + loanApp.getStatus().name() + ". Must be GOLD_SUBMITTED.");
        }

        // 2. Update LoanApplication entity (Status and Final Value)
        loanApp.setStatus(LoanApplication.LoanStatus.EVALUATED);
        // This line now works:
        loanApp.setFinalValue(request.getFinalValue());
        loanApplicationRepository.save(loanApp);

        // 3. Update Asset entity (Quality Index)
        Asset asset = loanApp.getAsset();
        if (asset != null) {
            // This line now works:
            asset.setQualityIndex(request.getQualityIndex());
            assetRepository.save(asset);
        }
    }

    @Transactional
    public void updateOfferDecision(String rid, String customerEmail, String newStatus) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new SecurityException("Authenticated customer not found."));

        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        // 1. Ownership Check
        if (!loanApp.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied: Loan does not belong to the authenticated customer.");
        }

        // 2. State Check: Must be OFFER_MADE
        if (!loanApp.getStatus().name().equalsIgnoreCase("OFFER_MADE")) {
            throw new IllegalStateException("Offer not active. Current status: " + loanApp.getStatus().name());
        }

        // 3. Status Transition Check
        if (newStatus.equalsIgnoreCase(STATUS_OFFER_ACCEPTED) || newStatus.equalsIgnoreCase(STATUS_OFFER_REJECTED)) {
            LoanApplication.LoanStatus status = LoanApplication.LoanStatus.valueOf(newStatus.toUpperCase());
            loanApp.setStatus(status);
            loanApplicationRepository.save(loanApp);
        } else {
            throw new IllegalArgumentException("Invalid offer decision status: " + newStatus);
        }
    }

    @Transactional
    public void disburseLoan(String rid) {
        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        // State check: Must be OFFER_ACCEPTED (Step 5 complete)
        if (!loanApp.getStatus().name().equalsIgnoreCase(STATUS_OFFER_ACCEPTED)) {
            throw new IllegalStateException("Loan cannot be disbursed. Current status is " + loanApp.getStatus().name() + ". Must be OFFER_ACCEPTED.");
        }

        // Final status update
        loanApp.setStatus(LoanApplication.LoanStatus.DISBURSED);
        loanApplicationRepository.save(loanApp);
    }

    @Transactional
    public void payRejectionFine(String rid, String customerEmail, FinePaymentRequest request) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new SecurityException("Authenticated customer not found."));

        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        // 1. Ownership and State Check: Must be OFFER_REJECTED
        if (!loanApp.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied: Loan does not belong to the authenticated customer.");
        }
        if (!loanApp.getStatus().name().equalsIgnoreCase(STATUS_OFFER_REJECTED)) {
            throw new IllegalStateException("Cannot pay fine. Current status is " + loanApp.getStatus().name() + ". Must be Offer Rejected.");
        }

        // 2. Simulate Payment Verification (Assume success for now)
        // In a real app, this verifies request.fineAmount against actual fine amount.

        // 3. Update Status
        loanApp.setStatus(LoanApplication.LoanStatus.PAID_FINE);
        loanApplicationRepository.save(loanApp);
    }

    /**
     * NEW METHOD: Step 6.5 - Employee finalizes the process by releasing gold.
     */
    @Transactional
    public void collectGold(String rid) {
        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        // 1. State Check: Must be PAID_FINE
        if (!loanApp.getStatus().name().equalsIgnoreCase("PAID_FINE")) {
            throw new IllegalStateException("Cannot collect gold. Current status is " + loanApp.getStatus().name() + ". Must be PAID_FINE.");
        }

        // 2. Update Status to terminal states
        loanApp.setStatus(LoanApplication.LoanStatus.GOLD_COLLECTED);
        loanApplicationRepository.save(loanApp);

    }

    @Transactional
    public void reApplyLoan(String rid, String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new NoSuchElementException("Customer not found."));

        LoanApplication loanApp = loanApplicationRepository.findByRid(rid)
                .orElseThrow(() -> new NoSuchElementException(RID_NOT_FOUND_MSG + rid));

        // 1. Ownership Check
        if (!loanApp.getCustomer().getId().equals(customer.getId())) {
            throw new SecurityException("Access denied: Loan does not belong to the authenticated customer.");
        }

        // 2. State Transition Check (Must move from REJECTED_FOR_REVIEW to PENDING)
        if (!loanApp.getStatus().name().equalsIgnoreCase("REJECTED_FOR_REVIEW")) {
            throw new IllegalStateException("Cannot re-apply. Current status is " + loanApp.getStatus().name() + ". Must be REJECTED_FOR_REVIEW.");
        }

        // 3. Update Status
        try {
            loanApp.setStatus(LoanApplication.LoanStatus.PENDING);

            // FIX: Clear the rejection reason when re-applying
            loanApp.setRejectionReason(null);

            loanApplicationRepository.save(loanApp);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to save updated loan status to PENDING.");
        }
    }
}