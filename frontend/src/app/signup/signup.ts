import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';

// Custom validator for password matching (returns error for the form group, without modifying controls)
export const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };  // Return error for Angular to apply
  }
  return null;  // No error if matching
};

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  passwordFocused = false;
  passwordVisible = false;
  confirmPasswordVisible = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  passwordValidation = { minLength: false, hasUpperCase: false, hasLowerCase: false, hasNumber: false, hasSpecialChar: false };

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService  // Inject for backend registration call
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatchValidator });  // Apply group-level validator

    const passwordControl = this.signupForm.get('password');
    if (passwordControl) {
      passwordControl.valueChanges.subscribe(value => {
        this.validatePassword(value);
      });
    }
  }

  togglePasswordVisibility(): void { this.passwordVisible = !this.passwordVisible; }
  toggleConfirmPasswordVisibility(): void { this.confirmPasswordVisible = !this.confirmPasswordVisible; }

  private validatePassword(password: string): void {
    const REGEX = { UPPERCASE: /[A-Z]/, LOWERCASE: /[a-z]/, NUMBER: /[0-9]/, SPECIAL_CHAR: /[!@#$%^&*(),.?":{}|<>]/ };
    this.passwordValidation.minLength = password.length >= 8;
    this.passwordValidation.hasUpperCase = REGEX.UPPERCASE.test(password);
    this.passwordValidation.hasLowerCase = REGEX.LOWERCASE.test(password);
    this.passwordValidation.hasNumber = REGEX.NUMBER.test(password);
    this.passwordValidation.hasSpecialChar = REGEX.SPECIAL_CHAR.test(password);
  }
  
  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;
    if (this.signupForm.valid) {
      const formData = this.signupForm.value;
      // Call backend registration API with form data
      this.authService.register({ name: formData.fullName, email: formData.email, password: formData.password })
        .subscribe({
          next: (response) => {
            console.log('Registration successful:', response);
            this.successMessage = 'Signup successful! Redirecting to login...';
            this.cdr.markForCheck();
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          },
          error: (err: HttpErrorResponse) => {
            console.error('Registration failed:', err);
            this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
            this.cdr.markForCheck();
          }
        });
    } else {
      this.signupForm.markAllAsTouched();
      this.errorMessage = 'Please fill all fields correctly.';
      this.cdr.markForCheck();
    }
  }

  // OAuth initiation for social signup
  initiateGoogleOAuthSignup(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  initiateFacebookOAuthSignup(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/facebook';
  }

  get f() {
    return this.signupForm.controls;
  }
}