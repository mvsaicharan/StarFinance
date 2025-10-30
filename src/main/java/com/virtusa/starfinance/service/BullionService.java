package com.virtusa.starfinance.service;

import com.virtusa.starfinance.dto.GoldRateResponse;
import com.virtusa.starfinance.entity.GoldRate;
import com.virtusa.starfinance.repository.GoldRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BullionService {

    private final GoldRateRepository goldRateRepository;

    public List<GoldRateResponse> getAllRates() {
        // 1. Fetch all data from the database
        List<GoldRate> entities = goldRateRepository.findAll();

        // 2. Map GoldRate entities to GoldRateResponse DTOs
        return entities.stream()
                .map(entity -> new GoldRateResponse(
                        entity.getKaratLabel(),
                        // Convert BigDecimal to Double for the DTO (required by Angular frontend)
                        entity.getRatePerGram().doubleValue()
                ))
                .toList();
    }
}