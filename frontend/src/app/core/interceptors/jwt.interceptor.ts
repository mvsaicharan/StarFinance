// src/app/core/interceptors/jwt.interceptor.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; 
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // Inject AuthService for getToken()

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService // Use AuthService for consistent token retrieval
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // SSR Safety: Skip token addition on server-side
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(request);
    }

    // Skip public endpoints to avoid unnecessary headers
    if (request.url.includes('/api/auth/') || request.url.includes('/api/bullion/')) {
      return next.handle(request);
    }

    // Retrieve token using AuthService (handles sessionStorage and validation)
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('JwtInterceptor: No valid token available for request:', request.url);
      return next.handle(request);
    }

    // Clone request and add Authorization header
    const authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('JwtInterceptor: Added Bearer token to request:', request.url); // Optional: For verification
    return next.handle(authRequest);
  }
}