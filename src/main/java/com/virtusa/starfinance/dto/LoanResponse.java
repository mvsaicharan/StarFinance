// V:\Virtusa Capstone Project\starfinance\src\main\java\com\virtusa\starfinance\dto\LoanResponse.java

package com.virtusa.starfinance.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;

@Data
public class LoanResponse {
    private String id; // maps to loanapplication.rid
    private String type; // maps to asset.type (e.g., 'Gold Loan')
    private String date; // maps to loanapplication.created_at (formatted)
    private String status; // maps to loanapplication.status (e.g., 'PENDING')
    // FIX: ADD THESE FIELDS TO RESOLVE COMPILATION ERRORS
    private String kn;   // Customer KN Number
    private String name; // Customer Full Name

    private BigDecimal finalValue;

    private String rejectionReason;

    // Helper method for mapping (optional, but convenient)
    public void setCreatedAt(LocalDateTime createdAt) {
        // Formats LocalDateTime to 'YYYY-MM-DD' string for the frontend
        this.date = createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}