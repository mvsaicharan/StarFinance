// src/app/rejection-review-dialog/rejection-review-dialog.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'; // Added MatDialogModule
import { Loan } from '../../core/services/user/user.service';

/**
 * Interface for the data passed into the dialog.
 */
interface RejectionReviewData {
  loan: Loan; // Assuming the reason is attached to the loan object
}

@Component({
  selector: 'app-rejection-review-dialog',
  standalone: true,
  // Added MatDialogModule for completeness
  imports: [CommonModule, MatDialogModule], 
  template: `
    <div class="p-8 text-center">
      <div class="inline-block bg-red-100 p-4 rounded-full mb-4">
        <svg class="w-10 h-10 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.021 3.373 1.859 3.373h13.184c1.838 0 2.724-1.873 1.859-3.376L12.182 4.436a1.25 1.25 0 0 0-2.364 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-red-700">Loan Rejected for Review</h1>
      <p class="text-gray-500 mt-2">
        Your loan application (ID: {{ data.loan.id }}) requires correction before re-submission.
      </p>

      <div class="my-6 bg-red-50 p-6 rounded-lg border border-red-200">
        <p class="text-lg text-red-700">Employee Rejection Reason:</p>
        <p class="text-xl font-semibold text-red-800 mt-2 italic">
            {{ data.loan.rejectionReason || 'No specific reason provided.' }}
        </p> 
      </div>

      <p class="text-gray-600 mb-6">
        Please correct your application details based on the reason above. Do you wish to re-apply now?
      </p>

      <div class="flex space-x-4 mt-6">
        <button 
          (click)="dialogRef.close('cancel')" 
          class="flex-1 bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300">
          Cancel
        </button>
        <button 
          (click)="dialogRef.close('re-apply')" 
          class="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700">
          Confirm Re-apply
        </button>
      </div>
    </div>
    `,
})
export class RejectionReviewDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<RejectionReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RejectionReviewData
  ) {}
}