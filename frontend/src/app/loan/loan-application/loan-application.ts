// src/app/loan/loan-application/loan-application.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
// Assuming UserService is now UserService (class name) and file is user.service.ts
import { UserService } from '../../core/services/user/user.service'; // Adjust path/name if necessary
import { debounceTime } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs'; // Import Observable for type safety

// --- NEW/UPDATED INTERFACES (defined in user.service.ts, copied here for context) ---
interface CustomerDetailsResponse {
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

interface LoanApplicationPayload {
    customerId: number | null;
    amountSeeking: number;
    itemType: string;
    numberOfItems: number;
    purity: string;
    netWeight: number;
    photos: File | null;
    acknowledgement: boolean;
}

interface LoanSubmitResponse {
    message: string;
    rid: string;
}
// ----------------------------------------------------------------------------------

@Component({
  selector: 'app-loan-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './loan-application.html',
  styleUrls: ['./loan-application.css']
})
export class LoanApplication implements OnInit {
  loanForm!: FormGroup;
  estimatedLoanAmount: number = 0;
  
  // FIX TS2339: Property 'kycVerified' does not exist on type 'LoanApplication'
  kycVerified: boolean = false; 
  customerId: number | null = null; 

  private liveGoldRates = { '8K': 2385, '16K': 4771, '18K': 5367, '22K': 6560, '24K': 7157 };
  private LTV_RATIO = 0.75;

  // Constructor adjusted to use UserService (assuming class name)
  constructor(
    private fb: FormBuilder,
    private userService: UserService, 
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loanForm = this.fb.group({
      // Customer Details (Set to disabled for read-only)
      fullName: [{ value: '', disabled: true }, Validators.required],
      knNumber: [{ value: '', disabled: true }, Validators.required],
      gender: [{ value: '', disabled: true }, Validators.required],
      mobileNumber: [{ value: '', disabled: true }, [Validators.required, Validators.pattern("^[0-9]{10}$")]],
      emailId: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      
      // Gold Details (Editable)
      itemType: ['', Validators.required],
      numberOfItems: [1, [Validators.required, Validators.min(1)]],
      purity: ['', Validators.required],
      netWeight: ['', [Validators.required, Validators.min(0.1)]],
      photos: [null], 

      // Financial & Bank Details (Only amountSeeking is editable)
      amountSeeking: ['', [Validators.required, Validators.min(1000)]],
      bankName: [{ value: '', disabled: true }, Validators.required],
      accountHolderName: [{ value: '', disabled: true }, Validators.required],
      accountNumber: [{ value: '', disabled: true }, [Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(9), Validators.maxLength(18)]],
      ifscCode: [{ value: '', disabled: true }, [Validators.required, Validators.pattern("^[A-Z]{4}0[A-Z0-9]{6}$")]],
      branchName: [{ value: '', disabled: true }, Validators.required],

      acknowledgement: [false, Validators.requiredTrue]
    });

    this.fetchCustomerPrefillDetails();

    this.loanForm.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(values => {
      this.calculateEstimate(this.f['purity'].value, this.f['netWeight'].value);
    });
  }

  // NEW METHOD: Fetches customer details for pre-filling and checks KYC status
  private fetchCustomerPrefillDetails(): void {
    // FIX TS2339: Property 'getPrefillDetails' does not exist on type 'UserService' 
    // This is fixed by defining getPrefillDetails() in the UserService.
    this.userService.getPrefillDetails().subscribe({
      next: (data: CustomerDetailsResponse) => {
        this.customerId = data.id;
        this.kycVerified = data.kycVerified;

        if (this.kycVerified) {
          this.loanForm.patchValue({
            fullName: data.fullName,
            knNumber: data.knNumber,
            gender: data.gender,
            mobileNumber: data.mobileNumber,
            emailId: data.emailId,
            bankName: data.bankName,
            accountHolderName: data.accountHolderName,
            accountNumber: data.accountNumber,
            ifscCode: data.ifscCode,
            branchName: data.branchName
          });
          //this.snackBar.open('KYC Verified. Your details have been pre-filled.', 'Dismiss', { duration: 5000, verticalPosition: 'top' });
        } else {
          //this.snackBar.open('KYC NOT Verified. Cannot submit loan application.', 'Error', { duration: 0, verticalPosition: 'top' });
        }
      },
      // FIX TS7006: Parameter 'err' implicitly has an 'any' type.
      error: (err: any) => { 
        this.kycVerified = false;
        //this.snackBar.open('Error fetching details. Is KYC verified?', 'Error', { duration: 5000, verticalPosition: 'top' });
        console.error('API Error:', err);
      }
    });
  }

  private calculateEstimate(purity: string, netWeight: number): void {
    if (purity && netWeight > 0) {
      const rate = this.liveGoldRates[purity as keyof typeof this.liveGoldRates];
      const totalValue = rate * netWeight;
      this.estimatedLoanAmount = totalValue * this.LTV_RATIO;
    } else {
      this.estimatedLoanAmount = 0;
    }
  }

  onSubmit(): void {
    if (!this.kycVerified || !this.customerId) {
        alert('❌ Application failed. KYC is not verified or Customer ID is missing.');
        return;
    }
    
    if (this.loanForm.valid) {
      const rawData = this.loanForm.getRawValue();

      // Construct the payload matching the LoanApplicationPayload interface
      const payload: LoanApplicationPayload = {
        customerId: this.customerId, // Pass the fetched ID
        amountSeeking: rawData.amountSeeking,
        itemType: rawData.itemType,
        numberOfItems: rawData.numberOfItems,
        purity: rawData.purity,
        netWeight: rawData.netWeight,
        photos: rawData.photos,
        acknowledgement: rawData.acknowledgement
      };
      
      // FIX TS2339: Property 'subscribe' does not exist on type 'void' 
      // This is fixed by ensuring addLoan returns an Observable.
      this.userService.addLoan(payload).subscribe({
        // FIX TS7006: Parameter 'response' implicitly has an 'any' type.
        next: (response: LoanSubmitResponse) => { 
          alert('✅ Loan application submitted successfully! Reference ID: ' + response.rid);
          this.router.navigate(['/dashboard']);
        },
        // FIX TS7006: Parameter 'err' implicitly has an 'any' type.
        error: (err: any) => { 
          alert('❌ Submission failed: ' + (err.error?.message || 'Server error'));
        }
      });
    } else {
      this.loanForm.markAllAsTouched();
    }
  }

  get f() { return this.loanForm.controls; }
}