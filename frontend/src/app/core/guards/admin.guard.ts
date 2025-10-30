// src/app/core/guards/admin.guard.ts (NEW FILE)

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 1. Get the profile. This Observable is guaranteed to be valid if the token exists
    // (the general authGuard already confirmed the token exists).
    return authService.getEmployeeProfile().pipe(
        take(1),
        map(profile => {
            const userRole = profile.role;
            
            if (userRole === 'BANK_ADMIN') {
                console.log('AdminGuard: BANK_ADMIN access granted for /create.');
                return true;
            } else {
                console.warn('AdminGuard: Role mismatch. Redirecting unauthorized staff to /dashboard.');
                // Redirect staff to the dashboard, not /login
                return router.createUrlTree(['/employee/dashboard']); 
            }
        }),
        catchError(err => {
            // This catch should only trigger if the profile API fails.
            console.error('AdminGuard: Profile fetch failed (Expired Token/Backend Error). Redirecting to login.', err);
            authService.logout();
            return of(router.createUrlTree(['/login']));
        })
    );
};