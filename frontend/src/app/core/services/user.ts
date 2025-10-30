import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Loan {
  id: string;
  type: string;
  date: string;
  status: string;
  name?: string; 
  kn?: string;
  offerAmount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private knNumberSubject = new BehaviorSubject<string | null>(null);
  public knNumber$ = this.knNumberSubject.asObservable();
  private loansSubject = new BehaviorSubject<Loan[]>([]);
  public loans$ = this.loansSubject.asObservable();

  constructor() { }

  generateAndStoreKnNumber(): void {
    // ... generation logic ...
  }

  addLoan(loanData: any): void {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;

    const newLoan: Loan = {
      id: `RID${Date.now()}`, // More unique ID
      type: loanData.itemType,
      date: formattedDate,
      status: 'PENDING',
      name: loanData.fullName, // Add name
      kn: loanData.knNumber   // Add KN number
    };

    const currentLoans = this.loansSubject.getValue();
    this.loansSubject.next([...currentLoans, newLoan]);
  }

  updateLoanStatus(loanId: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING' | 'Offer Made' | 'Offer Accepted' | 'Offer Rejected'): void {
  const currentLoans = this.loansSubject.getValue();
  const updatedLoans = currentLoans.map(loan => {
    if (loan.id === loanId) {
      const updatedLoan = { ...loan, status: newStatus };
      // If the offer is being made, add a mock offer amount
      if (newStatus === 'Offer Made') {
        updatedLoan.offerAmount = 45000; // Example final offer amount
      }
      return updatedLoan;
    }
    return loan;
  });
  this.loansSubject.next(updatedLoans);
  console.log(`UserService: Updated loan ${loanId} to status ${newStatus}`);
}
}

