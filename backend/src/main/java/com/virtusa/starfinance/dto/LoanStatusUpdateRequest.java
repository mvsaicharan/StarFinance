package com.virtusa.starfinance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanStatusUpdateRequest {
    // This string must match one of the valid statuses in the Loan entity/enum
    @NotBlank(message = "New status is required.")
    private String newStatus;
    private String rejectionReason;

    public String getNewStatus() { return newStatus; }
    public String getRejectionReason() { return rejectionReason; }
}