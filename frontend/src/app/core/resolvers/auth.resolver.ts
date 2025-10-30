// src/app/core/resolvers/auth.resolver.ts
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, of } from 'rxjs';
import { Router } from '@angular/router';

export const authResolver: ResolveFn<boolean> = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getToken() ? of(true) : of(false).pipe(
    catchError(() => {
      console.warn('AuthResolver: Token validation failed; redirecting to login');
      router.navigate(['/login']);
      return of(false);
    })
  );
};