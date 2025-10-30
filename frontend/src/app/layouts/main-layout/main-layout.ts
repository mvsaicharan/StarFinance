import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

// --- CHANGE: Using your class names 'Header' and 'Footer' ---
import { Header } from '../../core/header/header';
import { Footer } from '../../core/footer/footer';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  // --- CHANGE: Using your class names 'Header' and 'Footer' here too ---
  imports: [CommonModule, RouterOutlet, Header, Footer],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent {

}