// src/app/login/login.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  activeTab: 'customer' | 'employee' = 'customer';
  passwordVisible = false;
  loginForm!: FormGroup;
  resetFormGroup!: FormGroup; 
  
  resetPasswordMode = false; 
  
  errorMessage: string | null = null;
  successMessage: string | null = null; 

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    this.resetFormGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: [''], 
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

    // Handle OAuth callback with synchronous storage
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        console.log('OAuth token received:', token.substring(0, 20) + '...');
        
        // UPDATED: Store synchronously and verify immediately
        this.authService.storeToken(token);
        console.log('Token after immediate storage:', sessionStorage.getItem('authToken') ? 'Stored' : 'Failed'); // NEW: Verification log
        
        // CRITICAL CHANGE: Pass the token directly to the profile fetch
        this.authService.getCustomerProfile(token).subscribe({ 
          next: (profile) => {
            console.log('OAuth profile fetched:', profile);
            this.authService.setCurrentProfile(profile);
            const targetPath = profile.kycStatus ? '/dashboard' : '/kyc';
            // UPDATED: Extended delay to 100ms for storage commitment during hydration
            setTimeout(() => {
              console.log('OAuth navigation deferred (100ms); proceeding to:', targetPath);
              this.router.navigate([targetPath], { replaceUrl: true });
            }, 100);
          },
          error: (err: HttpErrorResponse) => {
            console.error('Profile fetch after OAuth failed:', err);
            if (err.status === 401) {
              this.authService.logout(); 
              this.router.navigate(['/login']);
            } else {
              // Fallback navigation
              setTimeout(() => this.router.navigate(['/kyc'], { replaceUrl: true }), 100);
            }
          }
        });
      } else if (params['error']) {
        console.error('OAuth error:', params['error']);
        this.errorMessage = 'OAuth login failed. Please try again.';
      }
    });
  }
  
  // Custom validator to check if newPassword and confirmPassword match
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  toggleResetPasswordMode(mode: boolean): void {
    this.resetPasswordMode = mode;
    this.errorMessage = null;
    this.successMessage = null;
    
    if (mode) {
      this.resetFormGroup.reset({ email: this.loginForm.value.email || '' });
    } else {
      this.loginForm.reset();
    }
  }

  setActiveTab(tab: 'customer' | 'employee') {
    this.activeTab = tab;
    this.loginForm.reset();
    this.resetFormGroup.reset({ email: this.resetFormGroup.value.email || '' }); 
    
    if (tab === 'customer' && this.resetPasswordMode) {
      this.resetFormGroup.get('dateOfBirth')?.setValidators(Validators.required);
    } else {
      this.resetFormGroup.get('dateOfBirth')?.clearValidators();
    }
    this.resetFormGroup.get('dateOfBirth')?.updateValueAndValidity();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
  
  onResetPassword(): void {
    this.errorMessage = null;
    this.successMessage = null;
    
    this.resetFormGroup.get('dateOfBirth')?.updateValueAndValidity(); 
    this.resetFormGroup.updateValueAndValidity();
    
    if (this.resetFormGroup.valid) {
      const formData = this.resetFormGroup.value;
      const endpoint = this.activeTab === 'customer' 
        ? 'forgot-password/customer' 
        : 'forgot-password/employee';
      
      const payload = {
        email: formData.email,
        dateOfBirth: this.activeTab === 'customer' ? formData.dateOfBirth : undefined, 
        newPassword: formData.newPassword
      };

      this.authService.resetPassword(payload, endpoint).subscribe({ 
        next: () => {
          this.successMessage = 'Password successfully reset! You can now log in.';
          setTimeout(() => {
            this.toggleResetPasswordMode(false);
          }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Password reset failed:', err);
          const message = err.error?.message || 'Verification failed. Check your email and date of birth.';
          alert(message); 
          this.errorMessage = message;
        }
      });

    } else {
      console.log('Reset form is invalid');
      this.resetFormGroup.markAllAsTouched();
      this.errorMessage = 'Please fill all fields correctly, and ensure passwords match.';
    }
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      const endpoint = this.activeTab === 'customer' 
        ? 'login/customer/password' 
        : 'login/employee/password';

      this.authService.login({ email: formData.email, password: formData.password }, endpoint)
        .subscribe({
          next: (response) => {
            console.log('Login response:', response);
            
            const token = response.token;
            if (!token) {
              console.error('No token in login response');
              this.errorMessage = 'Login succeeded but token missing. Please try again.';
              return;
            }
            
            this.authService.storeToken(token);
            console.log('Token after API login storage:', sessionStorage.getItem('authToken') ? 'Stored' : 'Failed'); // NEW: Verification log
            
            console.log(`✅ Login successful. Authenticated role: ${this.activeTab}`);
            
            if (this.activeTab === 'employee') {
              setTimeout(() => this.router.navigate(['/employee/dashboard']), 100); // UPDATED: Extended delay
              return; 
            }

            this.authService.getCustomerProfile(token).subscribe({
              next: (profile) => {
                console.log('Login profile fetched:', profile);
                this.authService.setCurrentProfile(profile);
                const targetPath = profile.kycStatus ? '/dashboard' : '/kyc';
                setTimeout(() => {
                  console.log('API login navigation deferred (100ms); proceeding to:', targetPath);
                  this.router.navigate([targetPath], { replaceUrl: true });
                }, 100);
              },
              error: (err: HttpErrorResponse) => {
                console.error('Profile fetch after login failed:', err);
                if (err.status === 401) {
                  this.errorMessage = 'Session expired or invalid token. Please log in again.';
                } else {
                  setTimeout(() => this.router.navigate(['/kyc'], { replaceUrl: true }), 100);
                }
              }
            });
          },
          error: (err: HttpErrorResponse) => {
            console.error('Login failed:', err);
            const message = err.error?.message || 'Login failed. Please check your credentials.';
            alert(message);
            this.errorMessage = message;
          }
        });
    } else {
      console.log('Form is invalid');
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Please fill all fields correctly.';
    }
  }

  initiateGoogleOAuthLogin(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  initiateFacebookOAuthLogin(): void {
    window.location.href = 'http://localhost:8080/oauth2/authorization/facebook';
  }
}