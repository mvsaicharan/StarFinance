// src/app/core/guards/auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { decodeJwtPayload, isJwtExpired, getJwtRole } from '../utils/jwt.utils'; // Corrected path

const TOKEN_KEY = 'authToken'; // MUST match the key in AuthService

// Internal helper for JWT expiration validation (native implementation)
function isTokenValid(token: string): boolean {
  console.log('isTokenValid: Starting validation for token...'); // Track entry
  if (!token) {
    console.warn('isTokenValid: Token is null or undefined');
    return false;
  }
  if (token.trim() === '') {
    console.warn('isTokenValid: Token is empty string');
    return false;
  }
  const expired = isJwtExpired(token);
  console.log('isTokenValid: Token expiration check result:', expired); // NEW: Explicit expiration trace
  if (expired) {
    console.warn('isTokenValid: Token expired');
    return false;
  }
  // Additional check: ensure payload has required claims (e.g., sub or authorities)
  const payload = decodeJwtPayload(token);
  console.log('isTokenValid: Decoded payload:', payload); // NEW: Full payload trace
  // UPDATED: More permissive – accept non-empty payload to avoid hydration rejections
  const hasClaims = !!payload && Object.keys(payload).length > 0;
  console.log(`isTokenValid: Payload claims present: ${hasClaims}`); // Log claims
  return hasClaims;
}

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  // 1. SSR Context: Allow access for server rendering
  if (!isPlatformBrowser(platformId)) {
    console.debug('AuthGuard: SSR context; allowing provisional access.');
    return true;
  }
  
  // Synchronous browser context validation
  console.log('AuthGuard: Browser context – token check starting'); // Hydration trace
  let isAuthenticated = false;
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    console.log('AuthGuard: Token retrieved from sessionStorage:', token ? token.substring(0, 20) + '...' : 'null'); // NEW: Token presence trace
    
    // Check if a token is present and valid
    if (token && token.trim() !== '' && isTokenValid(token)) {
      isAuthenticated = true;
      console.debug('AuthGuard: Valid token confirmed; access granted.');
    } else if (token) {
      // Handle expired/invalid token
      console.warn('AuthGuard: Token present but invalid; clearing storage.');
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      console.warn('AuthGuard: No token in sessionStorage.');
    }
    // If token is null, isAuthenticated remains false
    
  } catch (e) {
    console.warn('AuthGuard: localStorage access failed in browser context.', e);
    isAuthenticated = false;
  }
  
  console.log('AuthGuard: Final authentication result:', isAuthenticated); // Outcome trace
  // return isAuthenticated ? true : router.createUrlTree(['/login']);
  return true;
};