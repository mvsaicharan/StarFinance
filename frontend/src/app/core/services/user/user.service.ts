// src/app/core/services/user/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs'; 
import { map } from 'rxjs/operators';

// ----------------------------------------------------------------------
// --- 1. INTERFACE DEFINITIONS ---
// ----------------------------------------------------------------------

// 1. DTO for pre-filling the Loan Application form
export interface CustomerDetailsResponse {
    id: number;
    fullName: string;
    knNumber: string;
    gender: string;
    mobileNumber: string;
    emailId: string;
    kycVerified: boolean;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
}

// 2. Payload DTO for submitting the loan application
export interface LoanApplicationPayload {
    customerId: number | null;
    amountSeeking: number;
    itemType: string;
    numberOfItems: number;
    purity: string;
    netWeight: number;
    photos: File | null;
    acknowledgement: boolean;
}

// 3. Response DTO for a successful loan submission
export interface LoanSubmitResponse {
    message: string;
    rid: string;
}

// 4. Loan Interface (Used for Dashboard tables - Customer & Employee)
export interface Loan {
    id: string;      // maps to loanapplication.rid
    type: string;    // maps to asset.type
    date: string;    // maps to loanapplication.created_at
    
    // FIELDS FOR EMPLOYEE DASHBOARD
    kn: string;      // Customer KN Number
    name: string;    // Customer Full Name
    
    // FIX: Final approved amount (nullable until Step 3 is complete)
    finalValue: number | null; 

    rejectionReason: string | null;

    // EXPANDED Statuses for the full workflow
    status: 'PENDING' | 'VERIFIED' | 'EVALUATED' | 'REJECTED' | 'REJECTED_FOR_REVIEW' | 'DISBURSED' | 'GOLD_SUBMITTED' | 'ACCEPTED' 
            | 'Pending' | 'Verified' | 'Evaluated' | 'Accepted' | 'Rejected' | 'Disbursed'
            | 'Offer Rejected'    
            | 'Offer Made'        
            | 'Offer Accepted'    
            | 'OFFER_MADE' 
            | 'OFFER_ACCEPTED' 
            | 'OFFER_REJECTED'
            | 'PAID_FINE'             // <-- FIX: Added missing status
            | 'GOLD_COLLECTED';
}

// 5. Loan Details Response (Used for Employee Loan Details Page)
export interface LoanDetailsResponse {
    rid: string;
    date: string;
    status: Loan['status'];
    amount: number; 
    finalValue: number | null; 
    rejectionReason: string | null;
    
    applicant: { fullName: string; knNumber: string; mobileNumber: string; emailId: string; };
    asset: { itemType: string; numberOfItems: number; purity: string; netWeight: string; qualityIndex: number | null; };
    financial: { bankName: string; accountHolderName: string; accountNumber: string; ifscCode: string; };
}

// 6. Customer Profile (Used by Auth Guard and Customer Dashboard)
export interface CustomerProfile {
    name: string;
  email: string;
  mobileNumber: string;
  
  kycStatus: boolean; 
  kycVerified: boolean; 

  knNumber: string | null;
  aadhaar: string | null;
  panCard: string | null;
}

// ----------------------------------------------------------------------
// --- 2. SERVICE IMPLEMENTATION ---
// ----------------------------------------------------------------------

@Injectable({
  providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://localhost:8080/api'; 
    private customerUrl = `${this.apiUrl}/customer`; 

    private _knNumber = new BehaviorSubject<string | null>(null);
    public knNumber$ = this._knNumber.asObservable();
    
    private initialLoans: Loan[] = [];
    private _loans = new BehaviorSubject<Loan[]>(this.initialLoans);
    public loans$ = this._loans.asObservable();

    constructor(private http: HttpClient) { }

    // ----------------------------------------------------------------------
    // CORE/EXISTING METHODS
    // ----------------------------------------------------------------------

    getUserProfile(): Observable<CustomerProfile> {
        const profileUrl = `${this.customerUrl}/profile`; 
        return this.http.get<CustomerProfile>(profileUrl);
    }

    setKnNumber(kn: string | null): void {
        this._knNumber.next(kn);
    }

    // Maps to: POST /api/customer/employee/loan/{rid}/status
    updateLoanStatus(rid: string, newStatus: Loan['status'], rejectionReason?: string | null): Observable<any> {
        const updateUrl = `${this.customerUrl}/employee/loan/${rid}/status`; 
        
        const payload = { 
            newStatus: newStatus,
            rejectionReason: rejectionReason || null
        };

        // 💡 CRITICAL FIX: Direct update of the local list, ensuring the rejectionReason is set/cleared correctly.
        this._loans.next(this._loans.getValue().map(loan => {
             if (loan.id === rid) {
                 return { 
                     ...loan, 
                     status: newStatus,
                     // Set the new reason if it's a rejection, otherwise clear it.
                     rejectionReason: newStatus === 'REJECTED_FOR_REVIEW' ? (rejectionReason || null) : null
                 };
             }
             return loan;
         }));

        return this.http.post(updateUrl, payload);
    }
        
    /**
     * Maps to POST /api/customer/loan/submit-gold/{rid} (Customer Action)
     */
    submitGold(rid: string): Observable<any> {
        const submitUrl = `${this.customerUrl}/loan/submit-gold/${rid}`;
        
        // Target status is GOLD_SUBMITTED
        const newStatus: Loan['status'] = 'GOLD_SUBMITTED';

        // Optimistic UI Update: Update status to GOLD_SUBMITTED immediately
        this._loans.next(this.getUpdatedLoanList(rid, newStatus));

        // The backend handler updateLoanStatusByCustomer does the validation (VERIFIED -> GOLD_SUBMITTED)
        return this.http.post(submitUrl, {}, { responseType: 'text' as 'json' });
    }

    // Helper function for local state update
    private getUpdatedLoanList(rid: string, newStatus: Loan['status']): Loan[] {
        return this._loans.getValue().map(loan => 
            loan.id === rid ? { ...loan, status: newStatus } : loan
        );
    }

    // ----------------------------------------------------------------------
    // LOAN APPLICATION & EMPLOYEE WORKFLOW METHODS
    // ----------------------------------------------------------------------
    
    getPrefillDetails(): Observable<CustomerDetailsResponse> {
        const prefillUrl = `${this.customerUrl}/loan-details-prefill`;
        return this.http.get<CustomerDetailsResponse>(prefillUrl);
    }

    // src/app/core/services/user/user.service.ts (Corrected addLoan method)

// ... existing imports ...

    addLoan(payload: LoanApplicationPayload): Observable<LoanSubmitResponse> {
        const loanUrl = `${this.customerUrl}/loan-application`;
        
        // CRITICAL FIX 1: The responseType is correctly set to 'text' to handle the backend's plain string response.
        return this.http.post(loanUrl, payload, { responseType: 'text' as 'json' }).pipe(
            map(response => {
                const message = response as unknown as string;
                
                // CRITICAL FIX 2: Use regex to extract the Reference ID (RID) from the success message string.
                // It searches for "Reference ID: GLN-XXXXXX" or just the "GLN-XXXXXX" pattern.
                const ridMatch = message.match(/RID:\s*([A-Z0-9-]+)|(GLN-[A-Z0-9-]+)$/i);
                
                const extractedRid = ridMatch ? (ridMatch[1] || ridMatch[2]) : 'N/A';

                const loanSubmitResponse: LoanSubmitResponse = {
                    message: message,
                    rid: extractedRid
                };
                
                // CRITICAL FIX 3: Optimistic UI update using the NOW-DEFINED extractedRid.
                const newLoan: Loan = {
                    id: loanSubmitResponse.rid, // Use the extracted RID
                    type: 'Gold Loan (New)',
                    date: new Date().toISOString().split('T')[0],
                    status: 'PENDING',
                    kn: 'KN_NewApp', 
                    name: 'New Applicant',
                    finalValue: null,
                    rejectionReason: null
                };
                
                // Update the local state BehaviorSubject
                this._loans.next([...this._loans.getValue(), newLoan]);
                
                // Return the structured response DTO with the extracted RID
                return loanSubmitResponse;
            })
        );
    }

    // Maps to: GET /api/customer/loans (Fetches all loans for the authenticated user)
    getCustomerLoans(): Observable<Loan[]> {
        const loansUrl = `${this.customerUrl}/loans`;
        
        return this.http.get<Loan[]>(loansUrl).pipe(
            tap((realLoans: Loan[]) => {
                this._loans.next(realLoans);
            })
        );
    }

    // Maps to: GET /api/customer/employee/loans
    getAllLoanApplications(): Observable<Loan[]> {
        const loansUrl = `${this.customerUrl}/employee/loans`; 
        
        return this.http.get<Loan[]>(loansUrl).pipe(
            tap((allLoans: Loan[]) => {
                this._loans.next(allLoans);
            })
        );
    }
    
    // Maps to: GET /api/customer/employee/loan/{rid}
    getLoanDetailsById(rid: string): Observable<LoanDetailsResponse> {
        const detailUrl = `${this.customerUrl}/employee/loan/${rid}`;
console.log('Fetching Loan Details URL:', detailUrl);
        return this.http.get<LoanDetailsResponse>(detailUrl);
    }

    getCustomerLoanDetailsById(rid: string): Observable<LoanDetailsResponse> {
        // Assume the backend has a customer-secured endpoint for their own loan details
        const detailUrl = `${this.customerUrl}/loan/${rid}`; 
        return this.http.get<LoanDetailsResponse>(detailUrl);
    }

    // Maps to: POST /api/customer/employee/loan/{rid}/disburse (Step 6)
    disburseLoan(rid: string): Observable<any> {
        const disburseUrl = `${this.customerUrl}/employee/loan/${rid}/disburse`;
        
        // Optimistic UI Update
        this._loans.next(this.getUpdatedLoanList(rid, 'DISBURSED'));
        
        return this.http.post(disburseUrl, {});
    }

    // Maps to: POST /api/customer/employee/loan/{rid}/evaluate
    submitEvaluationData(rid: string, finalValue: number, qualityIndex: number): Observable<any> {
        const evaluateUrl = `${this.customerUrl}/employee/loan/${rid}/evaluate`;
        const payload = {
            finalValue: finalValue,
            qualityIndex: qualityIndex
        };
        return this.http.post(evaluateUrl, payload).pipe(
            tap(() => {
                // Optimistic update to EVALUATED
                this._loans.next(this.getUpdatedLoanList(rid, 'EVALUATED'));
            })
        );
    }

    recordOfferDecision(rid: string, newStatus: Loan['status']): Observable<any> {
        const updateUrl = `${this.customerUrl}/loan/offer-decision/${rid}`; 
        const payload = { newStatus: newStatus };

        // Optimistic UI Update (for immediate feedback)
        this._loans.next(this.getUpdatedLoanList(rid, newStatus)); 
        
        return this.http.post(updateUrl, payload, { responseType: 'text' as 'json' });
    }

    payFine(rid: string, fineAmount: number): Observable<any> {
        const fineUrl = `${this.customerUrl}/loan/pay-fine/${rid}`;
        const payload = { fineAmount: fineAmount }; 
        
        // Optimistic UI Update to PAID_FINE
        this._loans.next(this.getUpdatedLoanList(rid, 'PAID_FINE')); 
        
        return this.http.post(fineUrl, payload, { responseType: 'text' as 'json' });
    }
    
    // 💡 NEW METHOD: Maps to POST /api/customer/employee/loan/{rid}/collect-gold
    collectGold(rid: string): Observable<any> {
        // NOTE: Assume this uses the employee-only endpoint defined elsewhere, e.g., EmployeeActionsController
        const collectUrl = `${this.customerUrl}/employee/loan/${rid}/collect-gold`; 
        
        // Optimistic UI Update to GOLD_COLLECTED (or final state)
        this._loans.next(this.getUpdatedLoanList(rid, 'GOLD_COLLECTED'));

        return this.http.post(collectUrl, {});
    }

    reApplyLoan(rid: string, newStatus: Loan['status']): Observable<any> {
        // 💡 FIX: Use the customer-specific loan update URL
        const reApplyUrl = `${this.customerUrl}/loan/${rid}/status`; 
        
        const payload = { 
            newStatus: newStatus 
        };

        // 💡 CRITICAL FIX: Explicitly set status to PENDING and clear rejectionReason
        this._loans.next(this._loans.getValue().map(loan => 
            loan.id === rid ? { 
                ...loan, 
                status: newStatus, 
                rejectionReason: null 
            } : loan
        ));
        
        return this.http.post(reApplyUrl, payload, { responseType: 'text' as 'json' });
    }
}