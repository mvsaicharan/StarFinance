// src/app/core/guards/employee.guard.ts

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const employeeGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    // 1. Authentication Check
    if (!authService.getToken()) {
        // User not logged in, redirect to login
        return router.createUrlTree(['/login']);
    }

    // 2. Authorization Check
    const userRole = authService.getRoleType();
    
    if (userRole === 'employee') {
        return true; // Access granted: User is an employee.
    } else if (userRole === 'customer') {
        // Access denied: Customer trying to access employee path.
        return router.createUrlTree(['/dashboard']); 
    } else {
        // Fallback for unhandled role state
        authService.logout();
        return router.createUrlTree(['/login']);
    }
};