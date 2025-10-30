package com.virtusa.starfinance.controller;

import com.virtusa.starfinance.dto.GoldRateResponse;
import com.virtusa.starfinance.service.BullionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bullion")
@RequiredArgsConstructor
public class BullionController {

    private final BullionService bullionService;

    /**
     * Endpoint to fetch live gold rates from the database.
     * GET /api/bullion/rates
     */
    @GetMapping("/rates")
    public ResponseEntity<List<GoldRateResponse>> getLiveGoldRates() {
        List<GoldRateResponse> rates = bullionService.getAllRates();
        return ResponseEntity.ok(rates);
    }
}