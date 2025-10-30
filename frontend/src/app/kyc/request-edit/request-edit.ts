import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
// Assume UserService now holds the profile data/KN number
import { AuthService } from '../../core/services/auth.service'; 
// Define CustomerProfile interface if needed, or import from kyc-form.ts
interface CustomerProfile {
  name: string;
  email: string;
  mobileNumber: string;
  knNumber: string | null;
  // ... other fields
}

@Component({
  selector: 'app-request-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-edit.html',
  styleUrls: ['./request-edit.css']
})
export class RequestEditComponent implements OnInit {
  requestForm!: FormGroup;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  
  // Use profile data from the service
  customerProfile: CustomerProfile | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService, // Use AuthService to fetch profile
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Fetch current profile data to pre-fill read-only fields
    this.authService.getCustomerProfile().subscribe({
        next: (profile: any) => {
            this.customerProfile = profile;
            this.initializeForm(profile);
        },
        error: () => {
             this.errorMessage = 'Failed to load profile data.';
             this.initializeForm(null); // Initialize with nulls on error
        }
    });
  }
  
  private initializeForm(profile: any | null): void {
      const name = profile?.name || 'Loading...';
      const phoneNumber = profile?.mobileNumber || 'Loading...';
      const knNumber = profile?.knNumber || 'N/A';
      
      this.requestForm = this.fb.group({
          // These fields are read-only and pre-filled
          name: [{ value: name, disabled: true }],
          phoneNumber: [{ value: phoneNumber, disabled: true }],
          knNumber: [{ value: knNumber, disabled: true }],
          reason: ['', Validators.required]
      });
  }

  onSubmit(): void {
    if (this.requestForm.valid) {
      // getRawValue() includes disabled fields (Name, Phone, KN)
      const submissionData = this.requestForm.getRawValue();
      
      // 💡 In a real app, this would call a separate API endpoint 
      // (e.g., POST /api/kyc/request-edit) to log the request for manual review.
      console.log('Core Edit Request Submitted:', submissionData);
      
      this.successMessage = 'Your request for core KYC update has been submitted for manual review.';
      this.errorMessage = null;
      
      setTimeout(() => {
          this.router.navigate(['/dashboard']);
      }, 3000); 
    } else {
        this.requestForm.markAllAsTouched();
        this.errorMessage = 'Please provide a reason for the edit.';
    }
  }
}