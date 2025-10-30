package com.virtusa.starfinance.controller;

import com.virtusa.starfinance.dto.EvaluationDataRequest;
import com.virtusa.starfinance.dto.LoanStatusUpdateRequest;
import com.virtusa.starfinance.dto.NewEmployeeRequest;
import com.virtusa.starfinance.entity.Employee;
import com.virtusa.starfinance.repository.EmployeeRepository;
import com.virtusa.starfinance.service.EmployeeCreationService;
import com.virtusa.starfinance.service.LoanApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

// Use MockitoExtension only, no Spring annotations needed
@ExtendWith(MockitoExtension.class)
class EmployeeActionsControllerTest {

    @Mock
    private LoanApplicationService loanApplicationService;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private EmployeeCreationService employeeCreationService;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private EmployeeActionsController controller;

    private final String testRid = "GLN-123456";

    @BeforeEach
    void setUp() {
        // Mockito setup is already done by @ExtendWith(MockitoExtension.class)
    }

    // --- updateLoanStatus Tests ---

    @Test
    void updateLoanStatus_Success_Returns204NoContent() {
        // ARRANGE
        LoanStatusUpdateRequest request = new LoanStatusUpdateRequest("VERIFIED", "");
        doNothing().when(loanApplicationService).updateLoanStatus(testRid, "VERIFIED", "");

        // ACT
        ResponseEntity<Void> response = controller.updateLoanStatus(testRid, request, authentication);

        // ASSERT
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(loanApplicationService, times(1)).updateLoanStatus(testRid, "VERIFIED", "");
    }

    @Test
    void updateLoanStatus_LoanNotFound_Throws404() {
        // ARRANGE
        LoanStatusUpdateRequest request = new LoanStatusUpdateRequest("VERIFIED", "");
        doThrow(new NoSuchElementException("Not found")).when(loanApplicationService).updateLoanStatus(eq(testRid), anyString(), anyString());

        // ACT & ASSERT
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                controller.updateLoanStatus(testRid, request, authentication));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void updateLoanStatus_InvalidStatus_Throws400BadRequest() {
        // ARRANGE
        LoanStatusUpdateRequest request = new LoanStatusUpdateRequest("INVALID", "");
        doThrow(new IllegalArgumentException("Invalid status")).when(loanApplicationService).updateLoanStatus(eq(testRid), anyString(), anyString());

        // ACT & ASSERT
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                controller.updateLoanStatus(testRid, request, authentication));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    // --- submitEvaluationData Tests ---

    @Test
    void submitEvaluationData_Success_Returns204NoContent() {
        // ARRANGE
        EvaluationDataRequest request = new EvaluationDataRequest();
        doNothing().when(loanApplicationService).completeGoldEvaluation(eq(testRid), any());

        // ACT
        ResponseEntity<String> response = controller.submitEvaluationData(testRid, request);

        // ASSERT
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    }

    // --- disburseLoan Tests ---

    @Test
    void disburseLoan_InvalidState_Throws400BadRequest() {
        // ARRANGE
        doThrow(new IllegalStateException("Wrong status")).when(loanApplicationService).disburseLoan(testRid);

        // ACT & ASSERT
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
                controller.disburseLoan(testRid));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
    }

    // --- createNewEmployee Tests (Logic verification only) ---

    @Test
    void createNewEmployee_Success_Returns201Created() {
        // ARRANGE
        NewEmployeeRequest request = new NewEmployeeRequest();
        Employee mockEmployee = new Employee();
        when(employeeCreationService.createEmployee(request)).thenReturn(mockEmployee);

        // ACT
        ResponseEntity<Employee> response = controller.createNewEmployee(request);

        // ASSERT
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(mockEmployee, response.getBody());
    }

    // --- getEmployeeProfile Tests ---

    @Test
    void getEmployeeProfile_Success_ReturnsEmployee() {
        // ARRANGE
        Employee mockEmployee = new Employee();
        when(authentication.getName()).thenReturn("staff@bank.com");
        when(employeeRepository.findByUsername("staff@bank.com")).thenReturn(Optional.of(mockEmployee));

        // ACT
        ResponseEntity<Employee> response = controller.getEmployeeProfile(authentication);

        // ASSERT
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockEmployee, response.getBody());
    }

    @Test
    void getEmployeeProfile_EmployeeNotFound_ThrowsRuntimeException() {
        // ARRANGE
        when(authentication.getName()).thenReturn("missing@bank.com");
        when(employeeRepository.findByUsername("missing@bank.com")).thenReturn(Optional.empty());

        // ACT & ASSERT
        assertThrows(RuntimeException.class, () -> controller.getEmployeeProfile(authentication));
    }
}