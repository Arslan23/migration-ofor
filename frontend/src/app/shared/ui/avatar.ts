import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';

@Component({
  selector: 'avatar',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClass'
  }
})
export class AvatarComponent {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', this.class);
  }
}

@Component({
  selector: 'avatar-image',
  standalone: true,
  imports: [CommonModule],
  template: `<img [src]="src" [alt]="alt" class="aspect-square h-full w-full" />`,
  host: {
    '[class]': 'computedClass'
  }
})
export class AvatarImageComponent {
  @Input() src: string | undefined = '';
  @Input() alt: string = '';
  @Input() class: ClassValue = '';

  get computedClass() {
    return cn('', this.class);
  }
}

@Component({
  selector: 'avatar-fallback',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClass'
  }
})
export class AvatarFallbackComponent {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      this.class
    );
  }
}

export const AVATAR_COMPONENTS = [
  AvatarComponent,
  AvatarImageComponent,
  AvatarFallbackComponent
] as const;
