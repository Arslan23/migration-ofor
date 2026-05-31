import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full w-full flex-1 bg-primary transition-all" [style.transform]="'translateX(-' + (100 - (value || 0)) + '%)'"></div>
  `,
  host: {
    '[class]': 'computedClass',
    '[attr.role]': '"progressbar"',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'value'
  }
})
export class ProgressComponent {
  @Input() value: number = 0;
  @Input() class: ClassValue = '';

  get computedClass() {
    return cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      this.class
    );
  }
}

export const PROGRESS_COMPONENTS = [ProgressComponent] as const;
