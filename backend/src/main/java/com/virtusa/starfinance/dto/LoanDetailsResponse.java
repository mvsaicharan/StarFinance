package com.virtusa.starfinance.dto;

import com.virtusa.starfinance.entity.LoanApplication;
import lombok.Data;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Data
public class LoanDetailsResponse {
    private String rid;
    private String date;
    private String status;
    private BigDecimal amount;       // Requested amount
    private BigDecimal finalValue;   // Final offered amount (for Step 4)
    private String rejectionReason;

    // Nested DTOs
    private ApplicantDetails applicant;
    private AssetDetails asset;
    private FinancialDetails financial;

    public void setCreatedAt(LoanApplication loan) {
        this.date = loan.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    public void setStatus(LoanApplication.LoanStatus status) {
        this.status = status.name();
    }

    // Static nested class for Applicant details
    @Data
    public static class ApplicantDetails {
        private String fullName;
        private String knNumber;
        private String mobileNumber;
        private String emailId;
        // Map other Customer fields here if needed
    }

    // Static nested class for Asset details
    @Data
    public static class AssetDetails {
        private String itemType;
        private Integer numberOfItems;
        private String purity; // Gold Carat in K format
        private BigDecimal netWeight;
        private Double qualityIndex; // Result of the evaluation (Step 3)
    }

    // Static nested class for Bank details
    @Data
    public static class FinancialDetails {
        private String bankName;
        private String accountHolderName;
        private String accountNumber;
        private String ifscCode;
    }
}