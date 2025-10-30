package com.virtusa.starfinance.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "gold_rates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoldRate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "karat_label", unique = true, nullable = false)
    private String karatLabel;

    @Column(name = "rate_per_gram", nullable = false)
    private BigDecimal ratePerGram;
}