// src/app/core/services/bullion.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface matching the backend GoldRateResponse DTO
export interface GoldRate {
  karat: string;     // e.g., '24 Karat'
  ratePerGram: number; // e.g., 7180.00
  price?: string;    // Formatted string for template display (e.g., '₹ 7,180 /gm')
}

@Injectable({
  providedIn: 'root'
})
export class BullionService {
  private apiUrl = 'http://localhost:8080/api/bullion/rates'; 

  constructor(private http: HttpClient) { }

  getLiveGoldRates(): Observable<GoldRate[]> {
    // Fetches data from the database via the Spring Boot endpoint
    return this.http.get<GoldRate[]>(this.apiUrl).pipe(
        map(rates => rates.map(rate => ({
            ...rate,
            // Format the rate for display purposes in the template
            price: `₹ ${rate.ratePerGram.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /gm` 
        })))
        // Note: Added comma formatting (e.g., 7180 -> 7,180) for better display
    );
  }
}