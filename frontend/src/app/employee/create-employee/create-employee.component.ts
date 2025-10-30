// V:\Virtusa Capstone Project\starfinance\src\app\employee\pages\create-employee\create-employee.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service'; // Assuming AuthService for API base URL or token

// Import Angular Material components (adjust imports based on your existing setup)
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css']
})
export class CreateEmployeeComponent implements OnInit {
  createEmployeeForm!: FormGroup;
  isLoading: boolean = false;
  
  // Roles must match the backend Enum: BANK_ADMIN, BANK_STAFF
  employeeRoles: string[] = ['BANK_STAFF', 'BANK_ADMIN'];
  
  // NOTE: In a real app, branch names would be fetched from the server.
  branchNames: string[] = ['Main Branch - NYC', 'Midtown Branch - LA', 'Virtual Banking'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService // Used here for getting base URL or similar setup
  ) {}

  ngOnInit(): void {
    this.createEmployeeForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      fullName: ['', Validators.required],
      role: ['', Validators.required],
      branchName: ['', Validators.required]
    });
  }

  onSubmit(): void {
  if (this.createEmployeeForm.invalid) {
    this.createEmployeeForm.markAllAsTouched();
    this.snackBar.open('Please correct all validation errors.', 'Dismiss', { duration: 3000 });
    return;
  }

  setTimeout(() => {
    this.isLoading = true;
  }, 0);

  const formValue = this.createEmployeeForm.value;
  const apiUrl = 'http://localhost:8080/api/customer/employee/create';

  // Retrieve and validate token upfront
  const token = this.authService.getToken();
  if (!token) {
    this.isLoading = false;
    this.snackBar.open('Authentication token missing or expired. Please log in again.', 'Dismiss', { duration: 5000 });
    this.router.navigate(['/login']);
    return;
  }

  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  this.http.post(apiUrl, formValue, { headers: headers }).subscribe({
    next: (response) => {
      console.log('SUCCESS: Employee Creation Request Accepted by Server.', response);
      this.isLoading = false;
      this.snackBar.open('Employee created successfully!', 'Close', { duration: 5000 });
      this.createEmployeeForm.reset();
    },
    error: (error: HttpErrorResponse) => {
      this.isLoading = false;

      let errorMessage = 'Failed to create employee.';

      if (error.status === 401 || (error.status === 200 && !error.ok && error.url?.includes('/login'))) {
        errorMessage = 'Authentication required. Please log in as BANK_ADMIN.';
        this.authService.logout();
        this.router.navigate(['/login']);
      } else if (error.status === 403) {
        errorMessage = error.error?.message || 'Access denied: BANK_ADMIN role required.';
      } else if (error.status === 400 && error.error?.message) {
        errorMessage = `Validation error: ${error.error.message}`;
      } else if (error.status >= 500) {
        errorMessage = 'Server error occurred. Please check backend logs.';
      } else if (error.status === 0) {
        errorMessage = 'Connection failed. Verify backend is running on port 8080.';
      } else {
        errorMessage = `Request failed: ${error.message}`;
        console.error('API Error Details:', error);
      }

      console.warn(`EMPLOYEE CREATE ERROR: Status ${error.status} - ${errorMessage}`);
      this.snackBar.open(errorMessage, 'Dismiss', { duration: 7000, panelClass: ['snackbar-error'] });
    }
  });
}
}