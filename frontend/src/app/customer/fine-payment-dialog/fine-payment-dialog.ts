// src/app/customer/fine-payment-dialog/fine-payment-dialog.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Loan } from '../../core/services/user';

// Define the data structure expected by this dialog
interface FineDialogData {
  loan: Loan;
  fineAmount: number;
}

@Component({
  selector: 'app-fine-payment-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './fine-payment-dialog.html',
  styleUrls: ['./fine-payment-dialog.css']
})
export class FinePaymentDialogComponent {
  
  // Inject the dialog reference and the loan/fine data
  constructor(
    public dialogRef: MatDialogRef<FinePaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FineDialogData
  ) {}

  payFine(): void {
    // Closes the dialog and passes a 'paid' signal back to the dashboard component
    this.dialogRef.close('paid');
  }

  cancel(): void {
    this.dialogRef.close('cancelled');
  }
}