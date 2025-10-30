package com.virtusa.starfinance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

// Assumes 'BANK_ADMIN' and 'BANK_STAFF' are valid string representations for the role
@Data
public class NewEmployeeRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Role is required")
    // Note: Validation should ensure it's either 'BANK_ADMIN' or 'BANK_STAFF'
    private String role;

    @NotBlank(message = "Branch name is required")
    private String branchName;
}