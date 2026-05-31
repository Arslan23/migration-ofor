import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, TrendingDown, Minus } from 'lucide-angular';
import { cn } from '../../../lib/utils';
import { ClassValue } from 'clsx';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss'
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() iconName: any; // Lucide icon
  @Input() trend?: { value: number; label: string };
  @Input() variant: 'default' | 'primary' | 'secondary' = 'default';
  @Input() size: 'default' | 'sm' = 'default';
  @Input() class: ClassValue = '';

  readonly icons = {
    TrendingUp,
    TrendingDown,
    Minus
  };

  get computedClass() {
    return cn(
      "stat-card relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
      this.size === 'sm' ? "p-3" : "p-6",
      this.variant === "primary" && "bg-primary text-primary-foreground border-0",
      this.variant === "secondary" && "bg-secondary text-secondary-foreground border-0",
      this.class
    );
  }

  get trendColor() {
    if (!this.trend) return "";
    if (this.trend.value > 0) return "text-emerald-500";
    if (this.trend.value < 0) return "text-destructive";
    return "text-muted-foreground";
  }

  get absTrendValue() {
    return this.trend ? Math.abs(this.trend.value) : 0;
  }
}
