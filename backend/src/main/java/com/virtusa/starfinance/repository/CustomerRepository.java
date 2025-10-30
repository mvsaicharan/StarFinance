package com.virtusa.starfinance.repository;

import com.virtusa.starfinance.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByOauthIdAndOauthProvider(String oauthId, String provider);

    Optional<Customer> findByAadhaar(String aadhaar);
    Optional<Customer> findByPanCard(String panCard);

}