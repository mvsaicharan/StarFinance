package com.virtusa.starfinance.repository;

import com.virtusa.starfinance.entity.KycReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KycReferenceRepository extends JpaRepository<KycReference, Long> {

    /**
     * Finds a valid KYC record by the given Aadhaar number.
     * @param aadhaarNumber The Aadhaar number to search for.
     * @return An Optional containing the KycReference if found.
     */
    Optional<KycReference> findByAadhaarNumber(String aadhaarNumber);

    /**
     * Finds a valid KYC record by the given PAN number.
     * @param panNumber The PAN number to search for.
     * @return An Optional containing the KycReference if found.
     */
    Optional<KycReference> findByPanNumber(String panNumber);

    /**
     * Finds a valid KYC record by the given Aadhaar AND PAN number,
     * ensuring they are a valid pair in the reference database.
     * @param aadhaarNumber The Aadhaar number.
     * @param panNumber The PAN number.
     * @return An Optional containing the KycReference if both match.
     */
    Optional<KycReference> findByAadhaarNumberAndPanNumber(String aadhaarNumber, String panNumber);
}