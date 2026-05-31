import { Component, Input, Output, EventEmitter, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';
import { animate, style, transition, trigger, state } from '@angular/animations';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  animations: [
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('contentAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate(-50%, -48%) scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translate(-50%, -48%) scale(0.95)' }))
      ])
    ])
  ],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Overlay -->
      <div 
        @overlayAnimation
        class="fixed inset-0 bg-black/80 backdrop-blur-sm"
        (click)="onClose()"
      ></div>
      
      <!-- Content -->
      <div 
        @contentAnimation
        [class]="computedClass"
        role="dialog"
      >
        <ng-content></ng-content>
        
        <button
          (click)="onClose()"
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <lucide-icon [img]="XIcon" class="h-4 w-4"></lucide-icon>
          <span class="sr-only">Close</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `]
})
export class DialogComponent {
  @Input() open = false;
  @Input() class: ClassValue = '';
  @Output() openChange = new EventEmitter<boolean>();

  readonly XIcon = X;

  get computedClass() {
    return cn(
      "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
      this.class
    );
  }

  onClose() {
    this.open = false;
    this.openChange.emit(this.open);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: any) {
    if (this.open) {
      this.onClose();
    }
  }
}

@Component({
  selector: 'app-dialog-header',
  standalone: true,
  template: `
    <div [class]="computedClass">
      <ng-content></ng-content>
    </div>
  `
})
export class DialogHeaderComponent {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn("flex flex-col space-y-1.5 text-center sm:text-left", this.class);
  }
}

@Component({
  selector: 'app-dialog-title',
  standalone: true,
  template: `
    <h2 [class]="computedClass">
      <ng-content></ng-content>
    </h2>
  `
})
export class DialogTitleComponent {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn("text-lg font-semibold leading-none tracking-tight", this.class);
  }
}

@Component({
  selector: 'app-dialog-footer',
  standalone: true,
  template: `
    <div [class]="computedClass">
      <ng-content></ng-content>
    </div>
  `
})
export class DialogFooterComponent {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", this.class);
  }
}

export const DIALOG_COMPONENTS = [
  DialogComponent,
  DialogHeaderComponent,
  DialogTitleComponent,
  DialogFooterComponent
] as const;
