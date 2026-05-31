import { Component, Input, Directive } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';

@Directive({
  selector: 'card-header, [card-header]',
  standalone: true,
  host: {
    '[class]': 'computedClass'
  }
})
export class CardHeaderDirective {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn('flex flex-col space-y-1.5 p-6', this.class);
  }
}

@Directive({
  selector: 'card-title, [card-title]',
  standalone: true,
  host: {
    '[class]': 'computedClass'
  }
})
export class CardTitleDirective {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn('font-semibold leading-none tracking-tight', this.class);
  }
}

@Directive({
  selector: 'card-description, [card-description]',
  standalone: true,
  host: {
    '[class]': 'computedClass'
  }
})
export class CardDescriptionDirective {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn('text-sm text-muted-foreground', this.class);
  }
}

@Directive({
  selector: 'card-content, [card-content]',
  standalone: true,
  host: {
    '[class]': 'computedClass'
  }
})
export class CardContentDirective {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn('p-6 pt-0', this.class);
  }
}

@Directive({
  selector: 'card-footer, [card-footer]',
  standalone: true,
  host: {
    '[class]': 'computedClass'
  }
})
export class CardFooterDirective {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn('flex items-center p-6 pt-0', this.class);
  }
}

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClass'
  }
})
export class CardComponent {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn('rounded-xl border bg-card text-card-foreground shadow', this.class);
  }
}

export const CARD_COMPONENTS = [
  CardComponent,
  CardHeaderDirective,
  CardTitleDirective,
  CardDescriptionDirective,
  CardContentDirective,
  CardFooterDirective
] as const;
