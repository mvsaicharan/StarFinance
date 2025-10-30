// src/app/core/interceptors/auth.interceptor.ts (Updated alternative; use only if preferred over JwtInterceptor)
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; 
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!isPlatformBrowser(this.platformId)) {
      return next.handle(request);
    }

    if (request.url.includes('/api/auth/') || request.url.includes('/api/bullion/')) {
      return next.handle(request);
    }

    const token = this.authService.getToken();
    if (!token) {
      console.warn('AuthInterceptor: No valid token available for request:', request.url);
      return next.handle(request);
    }

    const cloned = request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });

    console.log('AuthInterceptor: Added Bearer token to request:', request.url); // Optional
    return next.handle(cloned);
  }
}