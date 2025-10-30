package com.virtusa.starfinance.repository;// LoanApplicationRepository.java (Add this to your repository)
// V:\Virtusa Capstone Project\starfinance\src\main\java\com\virtusa\starfinance\repository\LoanApplicationRepository.java
import com.virtusa.starfinance.entity.LoanApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    // Find all loan applications associated with a customer ID
    List<LoanApplication> findByCustomerId(Long customerId);
    Optional<LoanApplication> findByRid(String rid);

}