// V:\Virtusa Capstone Project\starfinance\src\main\java\com\virtusa\starfinance\dto\ChangePasswordRequest.java

package com.virtusa.starfinance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotBlank(message = "Current password is required.")
    private String currentPassword;

    @NotBlank(message = "New password is required.")
    @Size(min = 8, message = "New password must be at least 8 characters.")
    private String newPassword;
}