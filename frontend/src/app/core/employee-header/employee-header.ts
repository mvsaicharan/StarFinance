import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, EmployeeProfile } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../../core/dialogs/change-password-dialog'; // <-- Corrected path

// 💡 NEW IMPORTS: BehaviorSubject and Observable
import { BehaviorSubject, Observable } from 'rxjs'; 

// Interface for employee data (We assume the profile call returns this)


@Component({
  selector: 'app-employee-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-header.html',
  styleUrls: ['./employee-header.css']
})
export class EmployeeHeader implements OnInit {
  userName: string = 'Employee'; 
  isDropdownOpen = false;
  employeeRole: string = 'BANK_STAFF';
  
  // 💡 FIX 1: Use BehaviorSubject for the initial state, starting with 'E'
  private employeeInitialSubject = new BehaviorSubject<string>('E');
  public employeeInitial$: Observable<string> = this.employeeInitialSubject.asObservable(); // Expose as Observable

  constructor(
    private router: Router,
    private authService: AuthService, 
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    
    if (this.authService.getToken()) {
        // 💡 FIX 2: Call the correct employee profile service method (assuming it exists)
        this.authService.getEmployeeProfile().subscribe({
            next: (profile: EmployeeProfile) => {
                this.userName = profile.fullName || profile.username || 'Employee'; 
                this.employeeRole = profile.role; // 💡 MODIFIED: Store the role
                this.updateEmployeeInitials(this.userName); // Use the new update method
            },
            error: (err: HttpErrorResponse) => {
                // Set error fallback state
                if (err.status === 401) {
                    this.userName = 'Employee';
                    this.employeeRole = 'BANK_STAFF'; // 💡 MODIFIED: Set fallback role
                    this.authService.logout();
                    this.router.navigate(['/login']);
                } else {
                    console.error('Error fetching employee profile:', err);
                    this.userName = 'Staff'; 
                    this.employeeRole = 'BANK_STAFF'; // 💡 MODIFIED: Set fallback role
                }
                this.updateEmployeeInitials(this.userName); // Update initials for fallback name
            }
        });
    } 
    // If no token, the BehaviorSubject stays at its default value 'E', solving the conflict.
  }

  /**
   * 💡 FIX 3: Extracts the first letter and updates the Subject.
   */
  updateEmployeeInitials(name: string): void {
    const parts = name.trim().split(/\s+/);
    let initials = '';

    if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].charAt(0).toUpperCase();
    } else if (parts.length >= 2) {
      initials = parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    } else {
      initials = 'E'; 
    }
    // Push the new value to the Subject
    this.employeeInitialSubject.next(initials);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

isAdmin(): boolean {
      return this.employeeRole === 'BANK_ADMIN';
  }

navigateToCreateEmployee(): void {
      if (this.isAdmin()) {
          this.router.navigate(['/employee/create']); // Define this route in your routing module
      }
  }

  openChangePasswordDialog(): void {
    this.isDropdownOpen = false; 

    // Open the dialog, passing the employee role data
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '450px',
      disableClose: true,
      data: { userRole: 'employee' } // Pass data to identify employee role
    });
  }

  logout(): void {
    this.authService.logout(); 
    this.isDropdownOpen = false;
    this.router.navigate(['/login']);
  }
}