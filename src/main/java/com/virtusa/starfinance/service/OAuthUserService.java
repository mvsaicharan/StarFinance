package com.virtusa.starfinance.service;

import com.virtusa.starfinance.entity.Customer;
import com.virtusa.starfinance.repository.CustomerRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OAuthUserService {

    private final CustomerRepository customerRepository;

    public OAuthUserService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional
    public Customer createOrGetCustomer(OAuth2User oAuth2User, String userId, String registrationId) {
        return customerRepository.findByOauthIdAndOauthProvider(userId, registrationId)
                .orElseGet(() -> {
                    Customer newCustomer = new Customer();
                    newCustomer.setEmail(oAuth2User.getAttribute("email"));
                    newCustomer.setName(oAuth2User.getAttribute("name"));
                    newCustomer.setOauthId(userId);
                    newCustomer.setOauthProvider(registrationId);
                    newCustomer.setPassword("");  // No password for OAuth
                    newCustomer.setKycStatus(false);  // False for KYC routing
                    return customerRepository.save(newCustomer);
                });
    }
}