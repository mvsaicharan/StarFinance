import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { EmployeeHeader } from '../../core/employee-header/employee-header'; // Import new header
import { Footer } from '../../core/footer/footer'; // Import existing footer

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, EmployeeHeader, Footer], // Add components here
  templateUrl: './employee-layout.html',
  styleUrls: ['./employee-layout.css']
})
export class EmployeeLayout {

}