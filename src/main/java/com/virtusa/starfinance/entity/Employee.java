// V:\Virtusa Capstone Project\starfinance\src\main\java\com\virtusa\starfinance\entity\Employee.java

package com.virtusa.starfinance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "employee")
@Getter
@Setter
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Use username for email/login ID as per standard practice
    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    // Enum mapping for roles
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, columnDefinition = "ENUM('BANK_ADMIN','BANK_STAFF') DEFAULT 'BANK_STAFF'")
    private Role role = Role.BANK_STAFF;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    public enum Role {
        BANK_ADMIN, BANK_STAFF
    }
}