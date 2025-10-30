package com.virtusa.starfinance.dto;

public class KycResponse {
    private String message;
    private String knNumber;

    public KycResponse(String message, String knNumber) {
        this.message = message;
        this.knNumber = knNumber;
    }

    // Getters and setters
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getKnNumber() { return knNumber; }
    public void setKnNumber(String knNumber) { this.knNumber = knNumber; }
}