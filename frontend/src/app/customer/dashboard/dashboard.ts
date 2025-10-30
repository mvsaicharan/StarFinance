// src/app/dashboard/dashboard.ts
import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core'; // <-- Add Inject and PLATFORM_ID
import { CommonModule, NgClass, isPlatformBrowser } from '@angular/common'; // <-- Add isPlatformBrowser
import { UserService, Loan, CustomerProfile } from '../../core/services/user/user.service'; 
import { BullionService, GoldRate } from '../../core/services/bullion.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OfferDialogComponent } from '../offer-dialog/offer-dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { FinePaymentDialogComponent } from '../fine-payment-dialog/fine-payment-dialog'; 
import { RejectionReviewDialogComponent } from '../rejection-review-dialog/rejection-review-dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass, ReactiveFormsModule, MatDialogModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  // ... (existing properties) ...
  kycStatus: 'verified' | 'pending' | 'not-applied' = 'not-applied'; 
  userName: string = '';
  knNumber: string | null = null;
  loans: Loan[] = [];
  goldPrices: GoldRate[] = []; 
  calculatorForm!: FormGroup;
  estimatedValue: number = 0;
  private liveGoldRates: { [key: string]: number } = {}; 
  private LTV_RATIO = 0.75;
  isSubmittingGold: string | null = null; 

  constructor(
    private userService: UserService,
    private bullionService: BullionService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ... (existing sortLoans and ngOnInit methods) ...
  
  private sortLoans(loans: Loan[]): Loan[] {
    // Assuming loan.date is a comparable string format (e.g., "YYYY-MM-DDT HH:mm:ss")
    return loans.sort((a, b) => {
        if (b.date > a.date) return 1;
        if (b.date < a.date) return -1;
        return 0;
    });
  }

  ngOnInit(): void {
    // 1. Initialize the form
    this.calculatorForm = this.fb.group({
      weight: ['', [Validators.required, Validators.min(0.1)]],
      purity: ['', Validators.required]
    });
    
    // 2. Fetch gold rates 
    this.bullionService.getLiveGoldRates().subscribe(rates => {
      this.goldPrices = rates.filter(r => r.karat !== '8K'); 
      
      rates.forEach(item => {
        const key = item.karat.includes('Karat') ? item.karat.split(' ')[0] + 'K' : item.karat;
        this.liveGoldRates[key] = item.ratePerGram;
      });
      
      this.onCalculate(); 
      this.cdr.detectChanges();
    });
    
    this.userName = 'Loading...'; 
    
    // 3. Fetch user profile (omitted)
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => { // Introduce a small, necessary delay (e.g., 50ms to 100ms)
        // Ensure token is present before attempting to fetch
        const token = this.authService.getToken();
        console.log('Dashboard token present:', !!token); // Debug: Verify post-fix
        if (!token) {
          console.warn('Dashboard load skipped: Authentication token not available after delay.');
          this.userName = 'Guest (Not Logged In)';
          this.cdr.detectChanges();
          return;
        }

        // 3. Fetch user profile (Protected API Call)
        this.userService.getUserProfile().subscribe({
          next: (profile: CustomerProfile) => {
            this.userName = profile.name; 
            this.kycStatus = this.determineKycDisplayStatus(profile.kycVerified, profile.kycStatus);
            this.knNumber = profile.knNumber;
            this.cdr.detectChanges(); 
            
            if (profile.knNumber) {
              this.userService.setKnNumber(profile.knNumber);
            }
          },
          error: (err) => {
              this.userName = 'Guest'; 
              this.kycStatus = 'not-applied'; 
              this.knNumber = null;
              this.cdr.detectChanges(); 
              
              if (!(err instanceof HttpErrorResponse && err.status === 401) && !err.message.includes('Authentication required')) {
                   console.error('Failed to fetch user profile:', err);
              }
          }
        });

        // 4. Subscribe to state management (Moved inside for consistency)
        this.userService.knNumber$.subscribe((kn: string | null) => {
            if (!this.knNumber || kn) { 
                this.knNumber = kn;
            }
        });

        // 5. Fetch and Subscribe to actual loans from the backend 
        this.userService.getCustomerLoans().subscribe({
            next: (loans) => {
                this.loans = this.sortLoans([...loans]);
            },
            error: (err) => {
                console.error('Failed to fetch loans:', err);
                this.loans = []; 
            }
        });
      }, 200); // 200ms delay
    }
    // 6. Subscribe to loan updates
    this.userService.loans$.subscribe(updatedLoans => {
      this.loans = this.sortLoans([...updatedLoans]);
      this.cdr.detectChanges();
    });
  }

  /**
   * Step 2: Handle customer's gold submission action.
   */
  handleGoldSubmission(loanId: string): void {
    this.isSubmittingGold = loanId;
    
    this.userService.submitGold(loanId).subscribe({
        next: () => {
            this.isSubmittingGold = null;
            // 💡 ALERT FIX: Use emoji and clear messaging
            alert('✅ Gold submission confirmed! Status updated to GOLD_SUBMITTED.'); 
        },
        error: (err) => {
            this.isSubmittingGold = null;
            const message = err.error?.message || 'Failed to confirm submission. Please try again.';
            alert(`❌ Submission Failed: ${message}`);
            this.cdr.detectChanges();
        }
    });
  }

  determineKycDisplayStatus(kycVerified: boolean, kycStatus: boolean): 'verified' | 'pending' | 'not-applied' {
      if (kycVerified === true) {
          return 'verified';
      }
      if (kycStatus === true) {
          return 'pending'; 
      }
      return 'not-applied';
  }

  onCalculate(): void {
    if (Object.keys(this.liveGoldRates).length === 0 || !this.calculatorForm || this.calculatorForm.invalid) { 
      this.estimatedValue = 0;
      return;
    }
    
    const { purity, weight } = this.calculatorForm.value;
    
    if (purity && weight > 0) {
      const rate = this.liveGoldRates[purity as string];
      if (rate) {
        this.estimatedValue = (rate * weight) * this.LTV_RATIO;
      } else {
        this.estimatedValue = 0;
      }
    } else {
      this.estimatedValue = 0;
    }
  }

  /**
   * Step 4/5: Opens offer modal and handles customer decision.
   */
  viewOffer(loan: Loan): void {
    const dialogRef = this.dialog.open(OfferDialogComponent, {
      width: '500px',
      data: loan,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'accepted') {
        const newStatus: Loan['status'] = 'OFFER_ACCEPTED';
        this.userService.recordOfferDecision(loan.id, newStatus).subscribe({
          next: () => alert('💰 Offer accepted successfully! Status updated to OFFER_ACCEPTED.'), // 💡 ALERT FIX
          error: (err) => alert(`❌ Failed to accept offer: ${err.error?.message || 'Server error.'}`)
        }); 
      } else if (result === 'rejected') {
        const newStatus: Loan['status'] = 'OFFER_REJECTED';
        this.userService.recordOfferDecision(loan.id, newStatus).subscribe({
          next: () => alert('⚠️ Offer rejected. Status updated to OFFER_REJECTED.'), // 💡 ALERT FIX
          error: (err) => alert(`❌ Failed to reject offer: ${err.error?.message || 'Server error.'}`)
        });
      }
    });
  }

  /**
   * Step 5.5: Opens fine payment modal for rejected offer.
   */
  openFinePayment(loan: Loan): void {
    const fineAmount = 500; // Example fine amount (₹500)
    
    // Uses the new FinePaymentDialogComponent
    const dialogRef = this.dialog.open(FinePaymentDialogComponent, { 
      width: '400px',
      // Pass the structure the FinePaymentDialogComponent expects
      data: { loan: loan, fineAmount: fineAmount }, 
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result === 'paid') {
            // If the user clicks 'Pay Fine Now' in the dialog:
            this.userService.payFine(loan.id, fineAmount).subscribe({
                next: () => {
                     alert('✅ Fine payment submitted! Status updated to PAID_FINE.'); // 💡 ALERT FIX
                     // Service updates BehaviorSubject, refreshing the table automatically
                },
                error: (err) => {
                     alert(`❌ Payment failed: ${err.error?.message || 'Server error.'}`);
                }
            });
        }
    });
  }

  openRejectionReview(loan: Loan): void {
    
    // 💡 FIX: Removed the failing API call (getCustomerLoanDetailsById) 
    // and rely on the loan object already loaded from the dashboard list.
    
    // 1. Open the dialog with the loan object directly from the list
    const dialogRef = this.dialog.open(RejectionReviewDialogComponent, {
        width: '500px',
        data: { loan: loan }, // Pass the loan object directly (now correctly updated via the BehaviorSubject)
        disableClose: true
    });

    // 2. Handle the customer's decision from the dialog
    dialogRef.afterClosed().subscribe(result => {
        if (result === 're-apply') {
            const newStatus: Loan['status'] = 'PENDING';
            
            // Call the re-apply service method
            this.userService.reApplyLoan(loan.id, newStatus).subscribe({ 
                next: () => {
                    // 💡 ALERT FIX: Use emoji and clear messaging
                    alert('✅ Loan application reset. Status updated to PENDING.'); 
                },
                error: (err) => {
                    console.error('Re-application failed:', err);
                    alert(`❌ Re-application failed: ${err.error?.message || 'Server error.'}`);
                }
            }); 
        }
    });
  }
}