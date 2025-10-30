package com.virtusa.starfinance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GoldRateResponse {
    private String karat;       // Maps to karat_label
    private Double ratePerGram; // Maps to rate_per_gram (converted to Double)
}