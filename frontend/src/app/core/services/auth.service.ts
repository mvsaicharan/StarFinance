// src/app/core/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID, OnInit } from '@angular/core'; // Added OnInit if needed for lifecycle
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError, BehaviorSubject } from 'rxjs'; // Added BehaviorSubject
import { decodeJwtPayload, isJwtExpired, getJwtRole } from '../utils/jwt.utils'; // Corrected path

// Interface for customer data
interface Customer {
  id?: number;
  name: string;
  email: string;
  password?: string;
  oauthProvider?: string;
  oauthId?: string;
  kycStatus?: boolean;
  knNumber?: string;
  aadhaar?: string;
  panCard?: string;
  gender?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  occupation?: string;
  income?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  existingLoans?: string;
}

export interface EmployeeProfile { // 💡 CRITICAL FIX: Define the missing interface
    id: number;
    username: string;
    fullName: string;
    role: 'BANK_ADMIN' | 'BANK_STAFF'; // Matches the Java enum
    branchName: string;
    // Add other properties that the employee profile API returns
}

export interface PasswordResetPayload {
    email: string;
    dateOfBirth?: string; // Required for Customer, optional/omitted for Employee
    newPassword: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

// Interface for KYC response
interface KycResponse {
  message: string;
  knNumber: string;
}

// Interface for login response
interface LoginResponse {
  token: string;
}

interface JwtPayload {
    sub?: string;
    exp?: number;
    // Spring typically uses 'authorities' for an array of roles/permissions
    authorities?: string[]; 
    // Fallback if Spring config uses a direct 'role' string (less common but possible)
    role?: string | string[]; 
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';      // Base for auth endpoints
  private customerUrl = 'http://localhost:8080/api/customer'; // Correct base for customer profile
  private kycUrl = 'http://localhost:8080/api/kyc';      // Base for KYC endpoints
  private tokenKey = 'authToken';                      // Key for sessionStorage token storage
  private employeeUrl = 'http://localhost:8080/api/customer/employee';

  // NEW: Reactive token state for hydration resilience
  private _tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this._tokenSubject.asObservable();

  // NEW: Cache for current profile to avoid redundant fetches during OAuth/hydration
  private _currentProfile = new BehaviorSubject<Customer | null>(null);
  public currentProfile$ = this._currentProfile.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // NEW: Initialize token from storage on service instantiation (runs on app bootstrap/hydration)
    if (isPlatformBrowser(this.platformId)) {
      const storedToken = sessionStorage.getItem(this.tokenKey);
      if (storedToken) {
        console.log('AuthService init: Loaded token from sessionStorage');
        this._tokenSubject.next(storedToken);
      }
    }
  }

  // NEW: Set the cached profile
  setCurrentProfile(profile: Customer): void {
    this._currentProfile.next(profile);
  }

  // Register a new customer
  register(data: { name: string; email: string; password: string }): Observable<Customer> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Customer>(`${this.apiUrl}/register/customer`, data, { headers });
  }

  // Login with role-specific endpoint
  login(credentials: { email: string; password: string }, endpoint: string): Observable<LoginResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<LoginResponse>(`${this.apiUrl}/${endpoint}`, credentials, { headers });
  }

  // CHANGE: Accept an optional token parameter
  getCustomerProfile(oauthToken: string | null = null): Observable<Customer> {
      // Prioritize the token passed into the method (the newly received OAuth token)
      // Fall back to the reactive token state (for all other normal profile fetches)
      const token = oauthToken || this.getToken(); // CRITICAL CHANGE
      
      if (!token) {
          console.warn('getCustomerProfile: No token available'); // Enhanced logging
          return throwError(() => new Error('Authentication required (No Token)')); 
      }
      
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      return this.http.get<Customer>(`${this.customerUrl}/profile`, { headers });
  }

  // Submit KYC data for verification and update customer record
  submitKyc(data: any): Observable<KycResponse> {
    const token = this.getToken();
    if (!token) {
        // FIX: Use RxJS throwError for consistency
        return throwError(() => new Error('Authentication required'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<KycResponse>(`${this.kycUrl}/verify`, data, { headers });
  }

  // UPDATED: Store JWT token in sessionStorage and sync to reactive state (client-side only)
  storeToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.tokenKey, token);
      this._tokenSubject.next(token); // NEW: Update in-memory state immediately
      console.log('storeToken: Token stored in sessionStorage and reactive state');
    }
  }

  // UPDATED: Retrieve JWT token from reactive state (fallback to sessionStorage), with expiration validation
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      let token = this._tokenSubject.value; // NEW: Prioritize in-memory state
      if (!token) {
        // Fallback to storage and sync if missing
        token = sessionStorage.getItem(this.tokenKey);
        if (token) {
          console.log('getToken: Fallback load from sessionStorage to reactive state');
          this._tokenSubject.next(token);
        } else {
          console.warn('getToken: No token in sessionStorage or reactive state');
          return null;
        }
      }
      console.log('getToken: Token from reactive state; validating...'); // Track flow
      if (this.isTokenExpired(token)) {
        console.warn('getToken: Token expired; clearing state and storage');
        decodeJwtPayload(token); // Force log to inspect exp
        this.logout();
        return null;
      }
      console.log('getToken: Valid token from reactive state');
      return token;
    }
    return null;
  }

  /**
   * Checks if the provided JWT token is expired.
   * @param token The JWT token string.
   * @returns True if expired or invalid; false otherwise.
   */
  private isTokenExpired(token: string): boolean {
    return isJwtExpired(token);
  }

  // UPDATED: Clear token on logout (client-side only)
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.tokenKey);
      this._tokenSubject.next(null); // NEW: Clear in-memory state
      console.log('logout: Token cleared from sessionStorage and reactive state');
      this._currentProfile.next(null); // Clear cached profile on logout
    }
  }

  resetPassword(payload: PasswordResetPayload, endpoint: string): Observable<any> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        const resetUrl = `${this.apiUrl}/${endpoint}`; 
        
        // NOTE: We do not expect a body back, so we use responseType: 'text' to prevent JSON parsing errors.
        return this.http.post(resetUrl, payload, { headers, responseType: 'text' as 'json' }); 
  }

  changePassword(payload: ChangePasswordPayload, endpoint: string): Observable<any> {
        const token = this.getToken();
        if (!token) {
            return throwError(() => new Error('Authentication required for password change.'));
        }
        
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        // The endpoint should be '/customer/change-password' or '/employee/change-password'
        const changeUrl = `http://localhost:8080/api/${endpoint}`; 
        
        // Use responseType: 'text' to handle simple string responses (e.g., "Password updated successfully")
        return this.http.post(changeUrl, payload, { headers, responseType: 'text' as 'json' });
  }

  getEmployeeProfile(): Observable<EmployeeProfile> { // Use the interface defined in employee-header.ts
        const token = this.getToken();
        
        if (!token) {
            return throwError(() => new Error('Authentication required (No Token)')); 
        }
        
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
        
        // Assume backend endpoint is /api/customer/employee/profile or similar
        // Adjust the URL if your employee profile endpoint is different
        return this.http.get<EmployeeProfile>(`${this.employeeUrl}/profile`, { headers });
    }

    getRoleType(): string {
      const token = this.getToken();
      if (!token) {
        console.warn('getRoleType: No token; defaulting to customer');
        return 'customer'; // Default fallback
      }
      const role = getJwtRole(token);
      console.log(`getRoleType: Raw role=${role}, mapped to ${role === 'BANK_STAFF' || role === 'BANK_ADMIN' ? 'employee' : 'customer'}`); // NEW: Log mapping
      return role === 'BANK_STAFF' || role === 'BANK_ADMIN' ? 'employee' : 'customer';
    }
}