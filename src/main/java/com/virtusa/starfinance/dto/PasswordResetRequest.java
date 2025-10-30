// V:\Virtusa Capstone Project\starfinance\src\main\java\com\virtusa\starfinance\dto\PasswordResetRequest.java

package com.virtusa.starfinance.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class PasswordResetRequest {

    @NotBlank(message = "Email is required.")
    @Email(message = "Invalid email format.")
    private String email;

    // Used for customer verification
    private String dateOfBirth;

    @NotBlank(message = "New password is required.")
    @Size(min = 8, message = "Password must be at least 8 characters.")
    private String newPassword;
}