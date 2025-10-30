package com.virtusa.starfinance.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;

@Entity
public class KycReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aadhaar_number", length = 12, unique = true, nullable = false)
    private String aadhaarNumber;

    @Column(name = "pan_number", length = 10, unique = true, nullable = false)
    private String panNumber;

    @Column(name = "full_name", length = 100, nullable = false)
    private String fullName;

    // Default constructor
    public KycReference() {
        // Required by JPA specification (JPA 2.1, 2.2, etc.) for entity instantiation via reflection.
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAadhaarNumber() { return aadhaarNumber; }
    public void setAadhaarNumber(String aadhaarNumber) { this.aadhaarNumber = aadhaarNumber; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}