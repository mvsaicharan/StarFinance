package com.virtusa.starfinance.dto;

import lombok.Data;

@Data
public class CustomerDetailsResponse {
    private Long id;
    private String fullName;
    private String knNumber;
    private String gender;
    private String mobileNumber;
    private String emailId;
    private Boolean kycVerified;

    // Bank Details fetched from Customer or BankAccount entity
    private String bankName;
    private String accountHolderName;
    private String accountNumber;
    private String ifscCode;
    private String branchName;
}