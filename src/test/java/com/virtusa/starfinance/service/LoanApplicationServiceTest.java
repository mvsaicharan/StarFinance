package com.virtusa.starfinance.service;

import com.virtusa.starfinance.dto.EvaluationDataRequest;
import com.virtusa.starfinance.dto.FinePaymentRequest;
import com.virtusa.starfinance.dto.LoanApplicationRequest;
import com.virtusa.starfinance.dto.LoanResponse;
import com.virtusa.starfinance.entity.Asset;
import com.virtusa.starfinance.entity.Customer;
import com.virtusa.starfinance.entity.LoanApplication;
import com.virtusa.starfinance.repository.AssetRepository;
import com.virtusa.starfinance.repository.CustomerRepository;
import com.virtusa.starfinance.repository.LoanApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanApplicationServiceTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private AssetRepository assetRepository;
    @Mock
    private LoanApplicationRepository loanApplicationRepository;

    @InjectMocks
    private LoanApplicationService loanApplicationService;

    private Customer verifiedCustomer;
    private Customer unverifiedCustomer;
    private LoanApplication mockLoan;
    private LoanApplicationRequest validRequest;
    private final String testRid = "RID-TEST";
    private final String testEmail = "test@example.com";

    @BeforeEach
    void setUp() {
        verifiedCustomer = new Customer();
        verifiedCustomer.setId(1L);
        verifiedCustomer.setKycVerified(true);
        verifiedCustomer.setEmail(testEmail);
        verifiedCustomer.setName("Test Customer");
        verifiedCustomer.setKnNumber("KN123");

        unverifiedCustomer = new Customer();
        unverifiedCustomer.setId(2L);
        unverifiedCustomer.setKycVerified(false);

        validRequest = new LoanApplicationRequest();
        validRequest.setCustomerId(1L);
        validRequest.setPurity("22K");
        validRequest.setNetWeight(10.0);
        validRequest.setAmountSeeking(50000.0);

        Asset mockAsset = new Asset();
        mockAsset.setId(10L);
        mockAsset.setType(Asset.AssetType.TWENTY_TWO_CARAT);

        mockLoan = new LoanApplication();
        mockLoan.setRid(testRid);
        mockLoan.setStatus(LoanApplication.LoanStatus.PENDING);
        mockLoan.setCustomer(verifiedCustomer);
        mockLoan.setAsset(mockAsset);
    }

    // ====================================================================================
    // 1. createLoanApplication(LoanApplicationRequest)
    // ====================================================================================

    @Test
    void createLoanApplication_Success() {
        // ARRANGE
        LoanApplication mockSavedLoan = new LoanApplication();
        mockSavedLoan.setRid("GLN-1234ABCD");

        when(customerRepository.findById(anyLong())).thenReturn(Optional.of(verifiedCustomer));
        when(assetRepository.save(any(Asset.class))).thenReturn(new Asset());
        when(loanApplicationRepository.save(any(LoanApplication.class))).thenReturn(mockSavedLoan);

        // ACT
        String rid = loanApplicationService.createLoanApplication(validRequest);

        // ASSERT
        assertNotNull(rid);
        verify(loanApplicationRepository, times(1)).save(any(LoanApplication.class));
    }

    @Test
    void createLoanApplication_KycNotVerified_ThrowsIllegalStateException() {
        // ARRANGE
        when(customerRepository.findById(anyLong())).thenReturn(Optional.of(unverifiedCustomer));

        // ACT & ASSERT
        assertThrows(IllegalStateException.class, () -> loanApplicationService.createLoanApplication(validRequest));

        verify(assetRepository, never()).save(any());
    }

    @Test
    void createLoanApplication_CustomerNotFound_ThrowsNoSuchElementException() {
        // ARRANGE
        when(customerRepository.findById(anyLong())).thenReturn(Optional.empty());

        // ACT & ASSERT
        assertThrows(NoSuchElementException.class, () ->
                loanApplicationService.createLoanApplication(validRequest));
    }

    // ====================================================================================
    // 2. getLoansByCustomerId(Long)
    // ====================================================================================

    @Test
    void getLoansByCustomerId_Success_ReturnsMappedResponses() {
        // ARRANGE
        mockLoan.setCreatedAt(LocalDateTime.now());
        when(loanApplicationRepository.findByCustomerId(anyLong())).thenReturn(Collections.singletonList(mockLoan));

        // ACT
        List<LoanResponse> results = loanApplicationService.getLoansByCustomerId(1L);

        // ASSERT
        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals(mockLoan.getRid(), results.get(0).getId());
        assertEquals(verifiedCustomer.getName(), results.get(0).getName());
        assertTrue(results.get(0).getType().contains("22 Carat"));
    }

    @Test
    void getLoansByCustomerId_EmptyResult_ReturnsEmptyList() {
        // ARRANGE
        when(loanApplicationRepository.findByCustomerId(anyLong())).thenReturn(Collections.emptyList());

        // ACT
        List<LoanResponse> results = loanApplicationService.getLoansByCustomerId(1L);

        // ASSERT
        assertTrue(results.isEmpty());
    }

    // ====================================================================================
    // 3. getAllLoanApplications()
    // ====================================================================================

    @Test
    void getAllLoanApplications_Success_ReturnsAllLoans() {
        // ARRANGE
        mockLoan.setCreatedAt(LocalDateTime.now());
        when(loanApplicationRepository.findAll()).thenReturn(Collections.singletonList(mockLoan));

        // ACT
        List<LoanResponse> results = loanApplicationService.getAllLoanApplications();

        // ASSERT
        assertFalse(results.isEmpty());
        assertEquals("Gold Loan", results.get(0).getType());
        assertEquals("KN123", results.get(0).getKn());
    }

    // ====================================================================================
    // 4. updateLoanStatus(String, String, String)
    // ====================================================================================

    @Test
    void updateLoanStatus_Success_ToVerified() {
        // ARRANGE
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.updateLoanStatus(testRid, "VERIFIED", null);

        // ASSERT
        ArgumentCaptor<LoanApplication> captor = ArgumentCaptor.forClass(LoanApplication.class);
        verify(loanApplicationRepository).save(captor.capture());
        assertEquals(LoanApplication.LoanStatus.VERIFIED, captor.getValue().getStatus());
        assertNull(captor.getValue().getRejectionReason()); // Should be clear
    }

    @Test
    void updateLoanStatus_Success_ToRejectedForReviewAndSavesReason() {
        // ARRANGE
        mockLoan.setRejectionReason("Old reason");
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.updateLoanStatus(testRid, "REJECTED_FOR_REVIEW", "New documentation needed");

        // ASSERT
        ArgumentCaptor<LoanApplication> captor = ArgumentCaptor.forClass(LoanApplication.class);
        verify(loanApplicationRepository).save(captor.capture());
        assertEquals(LoanApplication.LoanStatus.REJECTED_FOR_REVIEW, captor.getValue().getStatus());
        assertEquals("New documentation needed", captor.getValue().getRejectionReason()); // Reason saved
    }

    @Test
    void updateLoanStatus_InvalidStatusTransition_ThrowsIllegalStateException() {
        // ARRANGE: Attempting to accept offer when status is PENDING (not OFFER_MADE)
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT & ASSERT
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> loanApplicationService.updateLoanStatus(testRid, "OFFER_ACCEPTED", null));

        assertTrue(e.getMessage().contains("Must be Offer Made"));
    }

    @Test
    void updateLoanStatus_InvalidStatusName_ThrowsIllegalArgumentException() {
        // ARRANGE
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT & ASSERT
        assertThrows(IllegalArgumentException.class, () ->
                loanApplicationService.updateLoanStatus(testRid, "BOGUS_STATUS", null));
    }

    // ====================================================================================
    // 5. updateLoanStatusByCustomer(String, String, String)
    // ====================================================================================

    @Test
    void updateLoanStatusByCustomer_Success_GoldSubmitted() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.VERIFIED);
        when(customerRepository.findByEmail(testEmail)).thenReturn(Optional.of(verifiedCustomer));
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.updateLoanStatusByCustomer(testRid, testEmail, "GOLD_SUBMITTED");

        // ASSERT
        ArgumentCaptor<LoanApplication> captor = ArgumentCaptor.forClass(LoanApplication.class);
        verify(loanApplicationRepository).save(captor.capture());
        assertEquals(LoanApplication.LoanStatus.GOLD_SUBMITTED, captor.getValue().getStatus());
    }

    @Test
    void updateLoanStatusByCustomer_OwnershipMismatch_ThrowsSecurityException() {
        // ARRANGE
        Customer otherCustomer = new Customer();
        otherCustomer.setId(99L);
        when(customerRepository.findByEmail(testEmail)).thenReturn(Optional.of(otherCustomer));
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan)); // Loan customer ID is 1L

        // ACT & ASSERT
        assertThrows(SecurityException.class, () ->
                loanApplicationService.updateLoanStatusByCustomer(testRid, testEmail, "GOLD_SUBMITTED"));
    }

    // ====================================================================================
    // 6. getLoanDetailsByRid(String) - Smoke Test only (Logic is verbose mapping)
    // ====================================================================================

    @Test
    void getLoanDetailsByRid_Success_ReturnsMappedDetails() {
        // ARRANGE
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.getLoanDetailsByRid(testRid);

        // ASSERT (Just verify execution without exception)
        verify(loanApplicationRepository, times(1)).findByRid(testRid);
    }

    @Test
    void getLoanDetailsByRid_NotFound_ThrowsNoSuchElementException() {
        // ARRANGE
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.empty());

        // ACT & ASSERT
        assertThrows(NoSuchElementException.class, () ->
                loanApplicationService.getLoanDetailsByRid(testRid));
    }


    // ====================================================================================
    // 7. completeGoldEvaluation(String, EvaluationDataRequest)
    // ====================================================================================

    @Test
    void completeGoldEvaluation_Success_UpdatesStatusAndValues() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.GOLD_SUBMITTED);
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));
        when(loanApplicationRepository.save(any())).thenReturn(mockLoan); // Mock save return

        EvaluationDataRequest request = new EvaluationDataRequest();
        request.setFinalValue(BigDecimal.valueOf(45000.00));
        request.setQualityIndex(9.5);

        // ACT
        loanApplicationService.completeGoldEvaluation(testRid, request);

        // ASSERT
        verify(loanApplicationRepository).save(any(LoanApplication.class));
        verify(assetRepository).save(any(Asset.class));
        assertEquals(LoanApplication.LoanStatus.EVALUATED, mockLoan.getStatus());
    }

    @Test
    void completeGoldEvaluation_WrongState_ThrowsIllegalStateException() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.PENDING); // Wrong state
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT & ASSERT
        assertThrows(IllegalStateException.class, () -> loanApplicationService.completeGoldEvaluation(testRid, new EvaluationDataRequest()));
    }

    // ====================================================================================
    // 8. updateOfferDecision(String, String, String)
    // ====================================================================================

    @Test
    void updateOfferDecision_Success_AcceptsOffer() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.OFFER_MADE);
        when(customerRepository.findByEmail(testEmail)).thenReturn(Optional.of(verifiedCustomer));
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.updateOfferDecision(testRid, testEmail, "OFFER_ACCEPTED");

        // ASSERT
        ArgumentCaptor<LoanApplication> captor = ArgumentCaptor.forClass(LoanApplication.class);
        verify(loanApplicationRepository).save(captor.capture());
        assertEquals(LoanApplication.LoanStatus.OFFER_ACCEPTED, captor.getValue().getStatus());
    }

    @Test
    void updateOfferDecision_InvalidStatusTransition_ThrowsIllegalStateException() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.PENDING); // Wrong state
        when(customerRepository.findByEmail(testEmail)).thenReturn(Optional.of(verifiedCustomer));
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // Arrange arguments outside the call (already done, but confirming context)
        final String statusToAttempt = "OFFER_REJECTED";

        // ACT & ASSERT: Sonar Fix applied by ensuring the call is on a single line
        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> loanApplicationService.updateOfferDecision(testRid, testEmail, statusToAttempt));

        assertTrue(e.getMessage().contains("Offer not active"));
    }

    // ====================================================================================
    // 9. disburseLoan(String)
    // ====================================================================================

    @Test
    void disburseLoan_Success() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.OFFER_ACCEPTED);
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.disburseLoan(testRid);

        // ASSERT
        ArgumentCaptor<LoanApplication> captor = ArgumentCaptor.forClass(LoanApplication.class);
        verify(loanApplicationRepository).save(captor.capture());
        assertEquals(LoanApplication.LoanStatus.DISBURSED, captor.getValue().getStatus());
    }

    // ====================================================================================
    // 10. payRejectionFine(String, String, FinePaymentRequest)
    // ====================================================================================

    @Test
    void payRejectionFine_Success_ToPaidFine() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.OFFER_REJECTED);
        when(customerRepository.findByEmail(testEmail)).thenReturn(Optional.of(verifiedCustomer));
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.payRejectionFine(testRid, testEmail, new FinePaymentRequest());

        // ASSERT
        ArgumentCaptor<LoanApplication> captor = ArgumentCaptor.forClass(LoanApplication.class);
        verify(loanApplicationRepository).save(captor.capture());
        assertEquals(LoanApplication.LoanStatus.PAID_FINE, captor.getValue().getStatus());
    }

    @Test
    void payRejectionFine_WrongState_ThrowsIllegalStateException() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.PENDING);
        when(customerRepository.findByEmail(testEmail)).thenReturn(Optional.of(verifiedCustomer));
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT & ASSERT
        assertThrows(IllegalStateException.class, () -> loanApplicationService.payRejectionFine(testRid, testEmail, new FinePaymentRequest()));
    }


    // ====================================================================================
    // 11. collectGold(String)
    // ====================================================================================

    @Test
    void collectGold_Success_UpdatesStatusToGoldCollected() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.PAID_FINE);
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.collectGold(testRid);

        // ASSERT
        ArgumentCaptor<LoanApplication> captor = ArgumentCaptor.forClass(LoanApplication.class);
        verify(loanApplicationRepository).save(captor.capture());
        assertEquals(LoanApplication.LoanStatus.GOLD_COLLECTED, captor.getValue().getStatus());
    }

    @Test
    void collectGold_WrongState_ThrowsIllegalStateException() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.DISBURSED);
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT & ASSERT
        assertThrows(IllegalStateException.class, () -> loanApplicationService.collectGold(testRid));
    }


    // ====================================================================================
    // 12. reApplyLoan(String, String)
    // ====================================================================================

    @Test
    void reApplyLoan_Success_ToPendingAndClearsReason() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.REJECTED_FOR_REVIEW);
        mockLoan.setRejectionReason("Documentation incomplete");
        when(customerRepository.findByEmail(testEmail)).thenReturn(Optional.of(verifiedCustomer));
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // ACT
        loanApplicationService.reApplyLoan(testRid, testEmail);

        // ASSERT
        ArgumentCaptor<LoanApplication> captor = ArgumentCaptor.forClass(LoanApplication.class);
        verify(loanApplicationRepository).save(captor.capture());
        assertEquals(LoanApplication.LoanStatus.PENDING, captor.getValue().getStatus());
        assertNull(captor.getValue().getRejectionReason()); // Reason must be cleared
    }

    @Test
    void reApplyLoan_WrongState_ThrowsIllegalStateException() {
        // ARRANGE
        mockLoan.setStatus(LoanApplication.LoanStatus.DISBURSED);
        when(customerRepository.findByEmail(testEmail)).thenReturn(Optional.of(verifiedCustomer));
        when(loanApplicationRepository.findByRid(testRid)).thenReturn(Optional.of(mockLoan));

        // Arrange arguments outside the call (already done, but confirming context)
        final String customer = testEmail;

        // ACT & ASSERT: Sonar Fix applied by ensuring the call is on a single line
        assertThrows(IllegalStateException.class, () -> {
            loanApplicationService.reApplyLoan(testRid, customer);
        });
    }
}