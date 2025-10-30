// V:\Virtusa Capstone Project\starfinance\src\app\employee\employee-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { authGuard } from '../core/guards/auth.guard'; 
import { adminGuard } from '../core/guards/admin.guard';

// Import the missing component
import { LoanDetails } from './loan-details/loan-details'; // <-- Ensure this path is correct
import { DashboardComponent as EmployeeDashboardComponent } from './dashboard/dashboard';
import { CreateEmployeeComponent } from './create-employee/create-employee.component'; 


export const employeeRoutes: Routes = [
    {
        path: '',
        canActivate: [authGuard], 
        children: [
            // Path: /employee/dashboard
            { 
                path: 'dashboard', 
                component: EmployeeDashboardComponent 
            },
            
            // Path: /employee/loan-details/:id  <-- MISSING ROUTE ADDED HERE
            { 
                path: 'loan-details/:id', 
                component: LoanDetails // The component imported from './loan-details/loan-details'
            },
            
            // Path: /employee/create
            { 
                path: 'create', 
                component: CreateEmployeeComponent,
                canActivate: [adminGuard] 
            },
            
            // Path: /employee - Redirects to /employee/dashboard
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(employeeRoutes)],
    exports: [RouterModule]
})
export class EmployeeRoutingModule { }