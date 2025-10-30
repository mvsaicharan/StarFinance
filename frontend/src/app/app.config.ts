// V:\Virtusa Capstone Project\starfinance\src\app\app.config.ts

import { 
    ApplicationConfig, 
    provideBrowserGlobalErrorListeners, 
    provideZonelessChangeDetection,
    importProvidersFrom // <--- CRITICAL FIX: Add this import
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, withFetch } from '@angular/common/http'; 
import { JwtInterceptor } from './core/interceptors//jwt.interceptor';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi(), withFetch()), 
    // 2. Register the Interceptor
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    // CRITICAL FIX: Explicitly import the MatDialogModule at the root.
    importProvidersFrom(MatDialogModule)
  ]
};