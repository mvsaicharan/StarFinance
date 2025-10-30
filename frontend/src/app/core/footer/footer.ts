import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // 1. Import RouterLink

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink], // 2. Add RouterLink here
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class Footer {

}