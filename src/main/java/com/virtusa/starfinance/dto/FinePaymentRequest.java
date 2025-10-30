// com.virtusa.starfinance.dto.FinePaymentRequest.java (Conceptual)
package com.virtusa.starfinance.dto;

import lombok.Data;

@Data
public class FinePaymentRequest {
    // Placeholder, as payment details are complex. We only need the amount/RID.
    private String paymentMethod;
    private Double fineAmount;
}