import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { customerGuard } from './core/guards/customer.guard';
import { employeeGuard } from './core/guards/employee.guard';
import { authResolver } from './core/resolvers/auth.resolver'; // NEW: Import resolver

import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { DashboardComponent as CustomerDashboard } from './customer/dashboard/dashboard';
import { KycFormComponent } from './kyc/kyc-form/kyc-form';
import { RequestEditComponent } from './kyc/request-edit/request-edit';
import { LoanApplication } from './loan/loan-application/loan-application';
import { AboutUs } from './info/about-us/about-us';
import { ContactUs } from './info/contact-us/contact-us';
import { TermsOfService } from './legal/terms-of-service/terms-of-service';
import { PrivacyPolicy } from './legal/privacy-policy/privacy-policy';
import { LoanAgreement } from './legal/loan-agreement/loan-agreement';
import { EmployeeLayout } from './layouts/employee-layout/employee-layout';
import { DashboardComponent as EmployeeDashboard } from './employee/dashboard/dashboard'; 
import { LoanDetails } from './employee/loan-details/loan-details';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./login/login').then(c => c.LoginComponent) },
    { path: 'signup', loadComponent: () => import('./signup/signup').then(c => c.SignupComponent) },
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: 'dashboard', component: CustomerDashboard, canActivate: [authGuard, customerGuard], resolve: { auth: authResolver } }, // UPDATED: Added resolver
            { path: 'kyc', component: KycFormComponent, data: { isProfileView: true }, canActivate: [authGuard, customerGuard], resolve: { auth: authResolver } }, // UPDATED: Added resolver
            { path: 'loan-application', component: LoanApplication, canActivate: [authGuard, customerGuard], resolve: { auth: authResolver } }, // UPDATED: Added resolver
            { path: 'request-kyc-edit', component: RequestEditComponent, canActivate: [authGuard, customerGuard], resolve: { auth: authResolver } }, // UPDATED: Added resolver
            { path: 'about-us', component: AboutUs },
            { path: 'contact-us', component: ContactUs },
            { path: 'terms-of-service', component: TermsOfService },
            { path: 'privacy-policy', component: PrivacyPolicy },
            { path: 'loan-agreement', component: LoanAgreement },
        ]
    },
    {
        path: 'employee',
        component: EmployeeLayout,
        canActivate: [authGuard], 
        loadChildren: () => import('./employee/employee-routing.module').then(m => m.employeeRoutes)
    },
    { path: '**', redirectTo: '/login', pathMatch: 'full' }
];