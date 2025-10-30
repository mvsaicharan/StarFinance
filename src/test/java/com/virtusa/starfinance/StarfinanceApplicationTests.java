package com.virtusa.starfinance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

@SpringBootTest
class StarfinanceApplicationTests {

	// Inject the context to verify it loaded
	@Autowired
	private ApplicationContext context;

	@Test
	void contextLoads() {
		assertNotNull(context, "The Spring ApplicationContext should be loaded and not null.");
	}

	// --- CRITICAL FIX: Inject the missing OAuth2 dependency using a nested Test Configuration ---

	/**
	 * Provides a mock implementation of ClientRegistrationRepository, which is
	 * required by the SecurityConfig's .oauth2Login() method, allowing the
	 * Spring context to initialize without needing real OAuth properties.
	 */
	@Configuration
	static class TestSecurityConfig {

		@Bean
		@Primary
		// Mockito is managed externally, so we can use standard Mockito.mock()
		public ClientRegistrationRepository clientRegistrationRepository() {
			return mock(ClientRegistrationRepository.class);
		}
	}
}