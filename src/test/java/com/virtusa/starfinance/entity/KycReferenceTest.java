package com.virtusa.starfinance.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class KycReferenceTest {

    @Test
    void testKycReferenceProperties() {
        // ARRANGE
        Long testId = 1L;
        String testAadhaar = "123456789012";
        String testPan = "ABCDE1234F";
        String testFullName = "Jane Doe";

        KycReference entity = new KycReference();

        // ACT: Test Setters
        entity.setId(testId);
        entity.setAadhaarNumber(testAadhaar);
        entity.setPanNumber(testPan);
        entity.setFullName(testFullName);

        // ASSERT: Test Getters
        assertNotNull(entity, "The entity object should not be null.");

        // 1. ID
        assertEquals(testId, entity.getId(), "ID getter should match the set value.");

        // 2. Aadhaar Number
        assertEquals(testAadhaar, entity.getAadhaarNumber(), "Aadhaar getter should match the set value.");

        // 3. PAN Number
        assertEquals(testPan, entity.getPanNumber(), "PAN getter should match the set value.");

        // 4. Full Name
        assertEquals(testFullName, entity.getFullName(), "Full Name getter should match the set value.");
    }

    @Test
    void defaultConstructor_exists() {
        // ARRANGE & ACT
        KycReference entity = new KycReference();

        // ASSERT
        assertNotNull(entity, "The default constructor must exist and initialize the object (required by JPA).");
    }
}