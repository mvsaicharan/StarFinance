import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
// Import the base Loan type to extend it locally
import { Loan } from '../../core/services/user'; 

// 💡 FIX: Create a local interface that extends Loan and adds the needed property.
// This guarantees the compiler knows 'finalValue' exists on the injected data.
interface LoanWithFinalValue extends Loan {
    finalValue: number | null;
}

@Component({
  selector: 'app-offer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './offer-dialog.html',
  styleUrls: ['./offer-dialog.css']
})
export class OfferDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<OfferDialogComponent>,
    // 💡 FIX: Inject data using the asserted type
    @Inject(MAT_DIALOG_DATA) public data: LoanWithFinalValue
  ) {}

  acceptOffer(): void {
    // Closes the dialog and passes 'accepted' to the DashboardComponent
    this.dialogRef.close('accepted');
  }

  rejectOffer(): void {
    // Closes the dialog and passes 'rejected' to the DashboardComponent
    this.dialogRef.close('rejected');
  }
}