// src/app/core/guards/customer.guard.ts

import { CanActivateFn, Router } from '@angular/router';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const customerGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const platformId = inject(PLATFORM_ID);

    // SSR Context: Allow provisional access (defer role check to client)
    if (!isPlatformBrowser(platformId)) {
        console.debug('CustomerGuard: SSR context; allowing provisional access.');
        return true;
    }

    // Synchronous browser context validation
    console.log('CustomerGuard: Browser context – role check starting'); // Hydration trace

    // 1. Authentication Check (Browser-only) – Delegate to AuthService for consistency
    const token = authService.getToken();
    console.log('CustomerGuard: Token from AuthService:', token ? token.substring(0, 20) + '...' : 'null'); // NEW: Token trace via service
    if (!token) {
        console.warn('CustomerGuard: No token from AuthService; redirecting to login');
        return router.createUrlTree(['/login']);
    }

    // 2. Authorization Check (Browser-only)
    const userRole = authService.getRoleType();
    console.log('CustomerGuard: Extracted role from token:', userRole); // Enhanced debug
    if (userRole === 'customer') {
        console.debug('CustomerGuard: Customer role confirmed; access granted.');
        return true;
    } else if (userRole === 'employee') {
        console.warn('CustomerGuard: Employee role; redirecting to employee dashboard');
        return router.createUrlTree(['/employee/dashboard']); 
    } else {
        // Fallback for unhandled role state
        console.warn('CustomerGuard: Unhandled role (' + userRole + '); logging out and redirecting');
        authService.logout();
        return router.createUrlTree(['/login']);
    }
};