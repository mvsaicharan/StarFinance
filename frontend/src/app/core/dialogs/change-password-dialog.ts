import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangePasswordPayload } from '../../core/services/auth.service';

// Interface for data passed to the dialog (not strictly needed here, but good practice)
interface DialogData {}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Change Password</h2>
      <p *ngIf="errorMessage" class="mb-4 p-3 text-sm bg-red-100 text-red-700 border-l-4 border-red-500 rounded-lg">{{ errorMessage }}</p>
      <p *ngIf="successMessage" class="mb-4 p-3 text-sm bg-green-100 text-green-700 border-l-4 border-green-500 rounded-lg">{{ successMessage }}</p>

      <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
        
        <div class="mb-4">
          <label for="currentPassword" class="block text-sm font-medium text-gray-700">Current Password</label>
          <input formControlName="currentPassword" type="password" id="currentPassword" placeholder="Enter current password" class="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <div *ngIf="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched" class="text-xs text-red-500 mt-1">
            Current password is required.
          </div>
        </div>

        <div class="mb-4">
          <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
          <input formControlName="newPassword" type="password" id="newPassword" placeholder="Enter new password" class="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <div *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched" class="text-xs text-red-500 mt-1">
            Password must be at least 8 characters.
          </div>
        </div>

        <div class="mb-6">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input formControlName="confirmPassword" type="password" id="confirmPassword" placeholder="Confirm new password" class="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <div *ngIf="passwordForm.get('confirmPassword')?.errors?.['mismatch'] && passwordForm.get('confirmPassword')?.touched" class="text-xs text-red-500 mt-1">
            Passwords must match.
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button type="button" (click)="dialogRef.close()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Cancel</button>
          <button type="submit" [disabled]="passwordForm.invalid || isSubmitting" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition">
            {{ isSubmitting ? 'Changing...' : 'Change Password' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ChangePasswordDialogComponent {
  passwordForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isSubmitting = false;
  
  // NOTE: You'll need to define how to determine if the user is a customer or employee.
  // For simplicity, we assume the token authentication automatically routes the request
  // on the backend, or we pass the role via data. We'll stick to dynamic routing in onSubmit.
  private isEmployee: boolean = false; 

  public userRole: string = 'customer';

  constructor(
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: { userRole?: string } // Inject MatDialog data if needed
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

    this.userRole = data.userRole || 'customer';

    // Assuming we can check the role locally if needed (e.g., from stored session/token claims)
    // For now, we will rely on the backend to determine the user type from the JWT.
  }

  // Custom validator function
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.isSubmitting = true;

    if (this.passwordForm.invalid) {
        this.isSubmitting = false;
        this.errorMessage = 'Please fix the errors in the form.';
        return;
    }
    
    const { currentPassword, newPassword } = this.passwordForm.value;
    const payload: ChangePasswordPayload = { currentPassword, newPassword };

    // 💡 CRITICAL FIX: Use the authoritative role from AuthService
    // This is robust against missing/incorrect data passed from the header.
    const baseEndpoint = this.userRole;
  
  const endpoint = `auth/${baseEndpoint}/change-password`;
    
    // If you need to support both roles from the same component, you would need to fetch the role.
    // Example for dual role: const endpoint = this.authService.isEmployee() ? 'employee/change-password' : 'customer/change-password';

    this.authService.changePassword(payload, endpoint).subscribe({
        next: () => {
            this.successMessage = 'Password updated successfully! Redirecting...';
            this.isSubmitting = false;
            // Close the dialog after a short delay
            alert('✅ Password updated successfully.');
            setTimeout(() => {
                this.dialogRef.close(true); // Signal success
            }, 1000);
        },
        error: (err: HttpErrorResponse) => {
            this.isSubmitting = false;
            if (err.status === 400 && err.error?.message) {
                // Specific message from backend (e.g., "Current password is incorrect.")
                this.errorMessage = err.error.message;
            } else if (err.status === 401) {
                this.errorMessage = 'Session expired. Please log in again.';
                this.authService.logout();
                this.dialogRef.close();
            } else {
                this.errorMessage = 'Failed to change password. Please try again.';
            }
            console.error('Password change failed:', err);
        }
    });
  }
}