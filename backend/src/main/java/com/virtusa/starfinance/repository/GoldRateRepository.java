package com.virtusa.starfinance.repository;

import com.virtusa.starfinance.entity.GoldRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;



@Repository
public interface GoldRateRepository extends JpaRepository<GoldRate, Integer> {

}