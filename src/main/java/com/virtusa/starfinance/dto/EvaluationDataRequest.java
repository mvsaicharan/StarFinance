// com.virtusa.starfinance.dto.EvaluationDataRequest.java

package com.virtusa.starfinance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class EvaluationDataRequest {
    @NotNull(message = "Final loan value is required.")
    @DecimalMin(value = "0.01", message = "Final loan value must be positive.")
    private BigDecimal finalValue;

    @NotNull(message = "Gold Quality Index is required.")
    @DecimalMin(value = "0.01", message = "Quality Index must be positive.")
    private Double qualityIndex;
}