import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, Search, Menu } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Output() menuClick = new EventEmitter<void>();

  readonly icons = {
    Bell,
    Search,
    Menu
  };
}
