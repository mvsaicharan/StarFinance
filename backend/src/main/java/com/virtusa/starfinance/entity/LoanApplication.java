package com.virtusa.starfinance.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loanapplication")
@Data
public class LoanApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String rid; // Reference ID

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status = LoanStatus.PENDING;

    private BigDecimal amount; // Requested Amount

    // 💡 FIX 1: Add field for final approved loan amount
    private BigDecimal finalValue;

    // Foreign Keys
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    // bank_account_id is nullable in DB, but required for disbursement
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    public enum LoanStatus {
       PENDING,
        VERIFIED,
        EVALUATED,
        OFFER_MADE,
        OFFER_ACCEPTED,
        OFFER_REJECTED,
        REJECTED_FOR_REVIEW,
        REJECTED,
        GOLD_SUBMITTED,
        DISBURSED,
        PAID_FINE,
        GOLD_COLLECTED,
        LOAN_NOT_APPROVED
    }
}