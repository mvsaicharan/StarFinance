import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

import { MatDialog, MatDialogModule } from '@angular/material/dialog'; 
import { ChangePasswordDialogComponent } from '../../core/dialogs/change-password-dialog'; // <-- Corrected path

// 💡 NEW IMPORTS: BehaviorSubject and Observable
import { BehaviorSubject, Observable } from 'rxjs'; 

// Interface for customer data (or import it if defined elsewhere)
interface Customer {
  name: string;
  // ... other properties
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit {
  userName: string = 'Guest'; 
  isDropdownOpen = false;
  
  // 💡 CRITICAL FIX: Use a BehaviorSubject for the initial state
  private userInitialSubject = new BehaviorSubject<string>('G');
  public userInitial$: Observable<string> = this.userInitialSubject.asObservable(); // Expose as Observable

  constructor(
    private router: Router,
    private authService: AuthService, 
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    
    if (this.authService.getToken()) {
      this.authService.getCustomerProfile().subscribe({
        next: (profile: Customer) => {
            // No setTimeout(0) needed here!
            this.userName = profile.name || 'User'; 
            this.updateUserInitials(this.userName); // Use the new update method
            // cdr.detectChanges() is now handled by the async pipe
        },
        error: (err: HttpErrorResponse) => {
            // Set error fallback state
            if (err.status === 401) {
                this.userName = 'Guest';
                this.authService.logout();
                this.router.navigate(['/login']);
            } else {
                console.error('Error fetching header profile:', err);
                this.userName = 'User'; 
            }
            this.updateUserInitials(this.userName); // Update initials for fallback name
        }
      });
    } 
    // If no token, the BehaviorSubject stays at its default value 'G', solving the conflict.
  }

  /**
   * Extracts the first letter and updates the Subject.
   */
  updateUserInitials(name: string): void {
    const parts = name.trim().split(/\s+/);
    let initials = '';

    if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].charAt(0).toUpperCase();
    } else if (parts.length >= 2) {
      initials = parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    } else {
      initials = 'G'; 
    }
    // Push the new value to the Subject
    this.userInitialSubject.next(initials);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  openChangePasswordDialog(): void {
    this.isDropdownOpen = false; 

    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '450px',
      disableClose: true,
      data: { userRole: 'customer' }
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
             console.log('Password change succeeded.');
        }
    });
  }

  logout(): void {
    this.authService.logout(); 
    this.isDropdownOpen = false;
    this.router.navigate(['/login']);
  }
}