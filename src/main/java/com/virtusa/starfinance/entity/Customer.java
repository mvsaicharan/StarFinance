package com.virtusa.starfinance.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.DynamicUpdate;

@Entity
@Table(name = "Customer")
@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamicUpdate
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "kn_number", unique = true, nullable = true)
    private String knNumber;

    @Column(name = "aadhaar", unique = true, length = 12, nullable = true)
    private String aadhaar;

    @Column(name = "pan_card", unique = true, length = 10, nullable = true)
    private String panCard;

    @Column(name = "passport_number", length = 8, nullable = true)
    private String passportNumber;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "mobile_number", length = 10)
    private String mobileNumber;

    @Column(name = "date_of_birth")
    private String dateOfBirth;

    @Column(name = "full_address", length = 500)
    private String fullAddress;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pin_code", length = 6)
    private String pinCode;

    @Column(name = "occupation", length = 100)
    private String occupation;

    @Column(name = "income", length = 50)
    private String income;

    @Column(name = "bank_account_number", length = 20)
    private String bankAccountNumber;

    @Column(name = "ifsc_code", length = 11)
    private String ifscCode;

    @Column(name = "existing_loans", length = 50)
    private String existingLoans;

    @Column(name = "kyc_status")
    private Boolean kycStatus = false;

    @Column(name = "kyc_verified")  // Align with database column
    private Boolean kycVerified = false;

    @Column(name = "password")
    private String password;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_id", unique = true)
    private String oauthId;

    @Transient
    public String getRole() {
        return "ROLE_CUSTOMER";
    }
}