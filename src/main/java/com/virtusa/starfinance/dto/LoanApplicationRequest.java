package com.virtusa.starfinance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoanApplicationRequest {

    // Note: customerId is typically derived from the JWT/SecurityContext,
    // but included here for a full data map from the frontend.
    @NotNull
    private Long customerId;

    // Gold Details (for Asset Entity)
    @NotBlank(message = "Item type is required")
    private String itemType;

    @NotNull(message = "Number of items must be at least 1")
    @Min(value = 1, message = "Number of items must be at least 1")
    private Integer numberOfItems;

    @NotBlank(message = "Purity is required")
    private String purity; // Maps to Asset.type (e.g., "22K")

    @NotNull(message = "Net weight is required")
    @DecimalMin(value = "0.1", message = "Net weight must be greater than 0")
    private Double netWeight; // Maps to Asset.weight

    private String photos; // Simplified to String for file path/URL

    // Financial Details (for LoanApplication Entity)
    @NotNull(message = "Amount seeking is required")
    @DecimalMin(value = "1000.0", message = "Minimum loan amount is 1000")
    private Double amountSeeking; // Maps to LoanApplication.amount

    // The rest of the fields (customer/bank) are included in the form's raw value,
    // but the backend will use the Customer entity for these verified details.

    @NotNull(message = "Acknowledgement is required")
    private Boolean acknowledgement;

    // Optional fields not strictly required for validation but can be stored
    // in the Asset table later if provided.
    private String purchasePlace;
    private String jewelerName;
}