import { Component, Input, Output, EventEmitter, signal, ElementRef, HostListener, inject, ContentChild, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-dropdown-menu',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="relative inline-block text-left" #container>
      <div (click)="toggle()">
        <ng-content select="[app-dropdown-trigger]"></ng-content>
      </div>

      <div *ngIf="isOpen()" 
           @menuAnimation
           [class]="computedContentClass"
           (click)="$event.stopPropagation()">
        <ng-content></ng-content>
      </div>
    </div>
  `,
    animations: [
        trigger('menuAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95)' }),
                animate('100ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
            ]),
            transition(':leave', [
                animate('75ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
            ])
        ])
    ]
})
export class DropdownMenuComponent {
    readonly isOpen = signal(false);
    @Input() align: 'start' | 'end' = 'end';
    @Input() contentClass: ClassValue = '';

    private el = inject(ElementRef);

    toggle() {
        this.isOpen.set(!this.isOpen());
    }

    close() {
        this.isOpen.set(false);
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (!this.el.nativeElement.contains(event.target)) {
            this.close();
        }
    }

    get computedContentClass() {
        return cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md mt-2",
            this.align === 'end' ? 'right-0' : 'left-0',
            this.contentClass
        );
    }
}

@Component({
    selector: 'app-dropdown-menu-item',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      [class]="computedClass"
      (click)="onItemClick($event)"
    >
      <ng-content></ng-content>
    </div>
  `
})
export class DropdownMenuItemComponent {
    @Input() class: ClassValue = '';
    @Input() destructive = false;
    @Output() click = new EventEmitter<Event>();

    private parent = inject(DropdownMenuComponent);

    get computedClass() {
        return cn(
            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            this.destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive",
            this.class
        );
    }

    onItemClick(event: Event) {
        this.click.emit(event);
        this.parent.close();
    }
}

@Component({
    selector: 'app-dropdown-menu-separator',
    standalone: true,
    template: `<div class="-mx-1 my-1 h-px bg-muted"></div>`
})
export class DropdownMenuSeparatorComponent { }

export const DROPDOWN_MENU_COMPONENTS = [
    DropdownMenuComponent,
    DropdownMenuItemComponent,
    DropdownMenuSeparatorComponent
] as const;
