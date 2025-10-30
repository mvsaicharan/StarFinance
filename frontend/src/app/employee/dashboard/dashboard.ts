// src/app/employee/dashboard/dashboard.ts

import { Component, OnInit, signal, computed, effect, Inject, PLATFORM_ID } from '@angular/core'; // <-- Add Inject, PLATFORM_ID
import { CommonModule, NgClass, isPlatformBrowser } from '@angular/common'; // <-- Add isPlatformBrowser
import { RouterLink } from '@angular/router';
import { UserService, Loan } from '../../core/services/user/user.service'; 
import { HttpErrorResponse } from '@angular/common/http'; 
import { AuthService, EmployeeProfile } from '../../core/services/auth.service';

interface StatCard {
  title: string;
  count: number;
  active: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit { 
  // Signals for reactive state
  userName = signal<string>('Employee');
  private loansSignal = signal<Loan[]>([]);

  // Computed signal for sorted loans (non-mutating sort)
  sortedLoans = computed(() => {
    return [...this.loansSignal()].sort((a, b) => {
      if (b.date > a.date) return 1;
      if (b.date < a.date) return -1;
      return 0;
    });
  });

  // Computed signal for stat cards (derived from loans) - Updated to UPPERCASE status checks
  statCards = computed(() => {
    const loans = this.loansSignal();
    return [
      { title: 'Total Requests', count: loans.length, active: true },
      { title: 'Pending/Review', count: loans.filter(l => 
        l.status === 'PENDING' || l.status === 'REJECTED_FOR_REVIEW'
      ).length, active: false }, 
      { title: 'Ready for Eval', count: loans.filter(l => 
        l.status === 'VERIFIED' || l.status === 'EVALUATED'
      ).length, active: false }, 
      { title: 'Offer/Disbursed', count: loans.filter(l => 
        l.status === 'OFFER_MADE' || 
        l.status === 'OFFER_ACCEPTED' || 
        l.status === 'DISBURSED'
      ).length, active: false },
      { title: 'Rejected', count: loans.filter(l => 
        l.status === 'REJECTED' || 
        l.status === 'OFFER_REJECTED'
      ).length, active: false }
    ] as StatCard[];
  });

  constructor(
    private userService: UserService, 
    private authService: AuthService,
    // 🛑 CRITICAL INJECTION: Add PLATFORM_ID
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Effect to reactively update loans signal from service Observable
    effect(() => {
      // Note: In zoneless, use takeUntilDestroyed() if needed for cleanup
      this.userService.loans$.subscribe(loans => {
        // Filter out invalid loans (id check)
        this.loansSignal.set(loans.filter(l => l.id));
      });
    });
  } 

  ngOnInit(): void {
    // 🛑 CRITICAL FIX: Gate all protected API calls
    if (isPlatformBrowser(this.platformId)) {
    // Fetch and update profile (signal set triggers CD automatically)
    this.authService.getEmployeeProfile().subscribe({
      next: (profile: EmployeeProfile) => {
        this.userName.set(profile.fullName || profile.username || 'Employee'); 
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to fetch employee profile for dashboard:', err);
        if (err.status === 401) {
          this.authService.logout();
          this.userName.set('Guest'); 
        }
      }
    });

    // Fetch loans (service handles push to BehaviorSubject; effect above reacts)
    this.userService.getAllLoanApplications().subscribe({
      next: () => {
        console.log('Loan applications successfully fetched and loaded for Employee Dashboard.');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to fetch loan applications for dashboard:', err);
      }
    });
  } else {
        // Log skip during SSR
        console.log('Skipping protected API calls during initial SSR render.');
    }
  }
}