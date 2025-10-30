// src/app/employee/loan-details/loan-details.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService, LoanDetailsResponse, Loan } from '../../core/services/user/user.service'; 
import { HttpErrorResponse } from '@angular/common/http'; 

@Component({
  selector: 'app-loan-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './loan-details.html',
  styleUrls: ['./loan-details.css']
})
export class LoanDetails implements OnInit {
  loanId: string | null = null;
  
  public userService: UserService; 
  
  loanDetails: LoanDetailsResponse | null = null; 
  
  loadingInitialData: boolean = true; 
  errorMessage: string | null = null; 

  constructor(
    private route: ActivatedRoute,
    userService: UserService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
      this.userService = userService; 
  }

  ngOnInit(): void {
    this.loanId = this.route.snapshot.paramMap.get('id');
    if (this.loanId) {
      this.fetchLoanDetails(this.loanId);
    } else {
      this.router.navigate(['/employee/dashboard']);
    }
  }

  fetchLoanDetails(rid: string): void {
    this.loadingInitialData = true; 
    this.errorMessage = null;      

    this.userService.getLoanDetailsById(rid).subscribe({
      next: (data: LoanDetailsResponse) => {
        this.loanDetails = data;
        this.loadingInitialData = false;
        this.cdr.detectChanges(); 
      },
      error: (err: HttpErrorResponse) => { 
        console.error('Failed to fetch loan details:', err);
        this.loadingInitialData = false; 
        this.loanDetails = null; 

        this.errorMessage = err.status === 404 
                          ? 'Loan Application not found.'
                          : 'Failed to load details. Please check server logs.';
        this.cdr.detectChanges(); 
      }
    });
  }
  
  /**
   * 💡 CORRECTED: Handles both Accept and Reject actions for Step 3 GOLD_SUBMITTED.
   */
  handleGoldReceipt(isAccept: boolean): void {
      if (!this.loanId || this.loanDetails?.status.toUpperCase() !== 'GOLD_SUBMITTED') return;

      if (isAccept) {
          // If ACCEPTED, proceed to data capture (Evaluation)
          this.triggerEvaluationProcess(); 
      } else {
          // If REJECTED, immediately update status to REJECTED
          const newStatus: Loan['status'] = 'REJECTED'; 
          
          this.userService.updateLoanStatus(this.loanId, newStatus).subscribe({
              next: () => {
                  alert('❌ Loan permanently rejected after gold inspection. Status updated.'); // Added Alert
                  this.fetchLoanDetails(this.loanId!); // Refresh data
                  this.errorMessage = 'Loan permanently rejected after gold inspection.';
              },
              error: (err: any) => {
                  console.error('Rejection failed', err);
                  this.errorMessage = 'Rejection failed. Please try again.';
              }
          });
      }
  }

  /**
   * 💡 Step 3 Data Capture & Submission (Called only by handleGoldReceipt(true)).
   */
  triggerEvaluationProcess(): void {
        if (!this.loanId || this.loanDetails?.status.toUpperCase() !== 'GOLD_SUBMITTED') return;

        // 1. Simulate data capture using prompt()
        const requestedAmount = this.loanDetails.amount || 0;
        const defaultOffer = requestedAmount * 0.90; // Suggest 90%
        
        const qualityIndexStr = prompt("Enter Gold Quality Index (e.g., 95):", "95");
        const finalOfferStr = prompt(`Enter Final Loan Offer Amount (Suggested: ${defaultOffer.toFixed(2)}):`, defaultOffer.toFixed(2));

        const qualityIndex = qualityIndexStr ? parseFloat(qualityIndexStr) : null;
        const finalOffer = finalOfferStr ? parseFloat(finalOfferStr) : null;

        if (finalOffer === null || qualityIndex === null || isNaN(finalOffer) || isNaN(qualityIndex) || finalOffer <= 0 || qualityIndex <= 0) {
             this.errorMessage = "Evaluation aborted. Invalid inputs provided.";
             this.cdr.detectChanges();
             return;
        }
        
        // 2. Call the dedicated evaluation service method
        // NOTE: We assume submitEvaluationData exists on the service now
        this.userService.submitEvaluationData(this.loanId, finalOffer, qualityIndex).subscribe({
            next: () => {
                this.errorMessage = null;
                alert('✅ Evaluation complete. Status updated to EVALUATED.'); // Updated Alert
                this.fetchLoanDetails(this.loanId!); // Refresh data (status should now be EVALUATED)
            },
            error: (err: any) => {
                console.error('Evaluation failed:', err);
                this.errorMessage = err.error?.message || 'Failed to complete evaluation. Check inputs/server.';
            }
        });
  }

  // --- Step 1 Action: Verify Details ---
  verifyDetails(isCorrect: boolean): void {
    if (!this.loanId || !this.loanDetails) return;
    
    const newStatus: Loan['status'] = isCorrect ? 'VERIFIED' : 'REJECTED_FOR_REVIEW';
    let rejectionReason: string | null = null; // Variable for the reason

    if (!isCorrect) {
        // 💡 NEW: Prompt the employee for the reason for rejection
        rejectionReason = prompt("Please enter the reason for rejecting the loan for review (e.g., 'Documents blurry'):");
        
        // Check if the employee cancelled or provided an empty reason
        if (!rejectionReason || rejectionReason.trim() === "") {
            this.errorMessage = "Action cancelled: A rejection reason is required.";
            this.cdr.detectChanges();
            return; // Abort the status update if no reason is provided
        }
    }

    // 💡 Note: The `updateLoanStatus` service method must be updated 
    // to optionally accept and transmit the reason string to the backend.
    this.userService.updateLoanStatus(this.loanId, newStatus, rejectionReason).subscribe({
        next: () => {
            const message = isCorrect ? '✅ Details verified. Status updated to VERIFIED.' : '⚠️ Loan rejected for review. Status updated.'; // Added Alert Logic
            alert(message);
            this.fetchLoanDetails(this.loanId!); // Refresh data
        },
        error: (err: any) => {
            console.error('Verification failed', err);
            this.errorMessage = 'Verification failed. Please try again.';
        }
    });
    }
  
  // --- Step 4 Action: Send Offer (MAPPED TO approveLoan) ---
  sendOffer(offerStatus: 'Offer Made' | 'REJECTED'): void {
    if (!this.loanId || this.loanDetails?.status.toUpperCase() !== 'EVALUATED') return;

    const newStatus: Loan['status'] = offerStatus === 'Offer Made' ? 'OFFER_MADE' : 'REJECTED';
    
    this.userService.updateLoanStatus(this.loanId, newStatus).subscribe({
        next: () => {
             const message = newStatus === 'OFFER_MADE' ? '💸 Loan offer sent to customer. Status updated to OFFER_MADE.' : '❌ Loan permanently rejected. Status updated to REJECTED.'; // Added Alert Logic
             alert(message);
             this.fetchLoanDetails(this.loanId!);
        },
        error: (err: any) => {
             console.error('Offer action failed', err);
             this.errorMessage = 'Offer action failed. Please try again.';
        }
    });
  }
  
  approveLoan(): void {
      this.sendOffer('Offer Made');
  }

  rejectLoan(): void {
      this.sendOffer('REJECTED');
  }
  
  // --- Step 6 Action: Disburse Loan ---
  disburseLoan(): void {
    if (!this.loanId || this.loanDetails?.status.toUpperCase() !== 'OFFER_ACCEPTED') return;

    this.userService.disburseLoan(this.loanId).subscribe({
      next: () => {
          alert('💰 Loan disbursed successfully! Status updated to DISBURSED.'); // Added Alert
        this.fetchLoanDetails(this.loanId!);
      },
      error: (err: any) => {
        console.error('Disbursement failed', err);
        this.errorMessage = 'Disbursement failed. Please try again.';
      }
    });
  }


    handleCollectGold(rid: string): void {
        if (this.loanDetails?.status.toUpperCase() !== 'PAID_FINE') return;
        
        this.userService.collectGold(rid).subscribe({
            next: () => {
                alert('✅ Gold returned to customer. Loan finalized as Not Approved. Status updated.'); // Updated Alert
                this.fetchLoanDetails(rid); // Refresh to show GOLD_COLLECTED
                // The original code already had a success alert, so this one is updated for consistency.
            },
            error: (err: any) => {
                console.error('Collection failed', err);
                this.errorMessage = 'Failed to record gold collection.';
            }
        });
    }
}