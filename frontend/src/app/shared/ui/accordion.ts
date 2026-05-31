import { Component, Input, signal, inject, ElementRef, HostBinding, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-accordion',
    standalone: true,
    imports: [CommonModule],
    template: `<ng-content></ng-content>`,
    host: {
        '[class]': 'computedClass'
    },
    styles: [`:host { display: block; }`]
})
export class AccordionComponent {
    @Input() class: ClassValue = '';
    @Input() type: 'single' | 'multiple' = 'multiple';

    readonly openItems = signal<Set<string>>(new Set());

    get computedClass() {
        return cn('w-full', this.class);
    }

    toggleItem(value: string) {
        const current = new Set(this.openItems());
        if (current.has(value)) {
            current.delete(value);
        } else {
            if (this.type === 'single') {
                current.clear();
            }
            current.add(value);
        }
        this.openItems.set(current);
    }

    isItemOpen(value: string): boolean {
        return this.openItems().has(value);
    }
}

@Component({
    selector: 'app-accordion-item',
    standalone: true,
    imports: [CommonModule],
    template: `<ng-content></ng-content>`,
    host: {
        '[class]': 'computedClass'
    },
    styles: [`:host { display: block; }`]
})
export class AccordionItemComponent {
    @Input({ required: true }) value!: string;
    @Input() class: ClassValue = '';

    private parent = inject(AccordionComponent);

    get computedClass() {
        return cn('border-b w-full', this.class);
    }

    get isOpen() {
        return this.parent.isItemOpen(this.value);
    }

    toggle() {
        this.parent.toggleItem(this.value);
    }
}

@Component({
    selector: 'app-accordion-trigger',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <button
      type="button"
      [class]="computedButtonClass"
      (click)="onClick()"
    >
      <ng-content></ng-content>
      <lucide-icon
        *ngIf="!hideIcon"
        [img]="ChevronDownIcon"
        class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
        [style.transform]="isOpen() ? 'rotate(180deg)' : 'rotate(0deg)'"
      ></lucide-icon>
    </button>
  `,
    host: {
        '[class]': 'computedClass'
    },
    styles: [`:host { display: block; }`]
})
export class AccordionTriggerComponent {
    @Input() class: ClassValue = '';
    @Input() buttonClass: ClassValue = 'py-4';
    @Input() hideIcon: boolean = false;

    readonly ChevronDownIcon = ChevronDown;
    private item = inject(AccordionItemComponent);

    isOpen = computed(() => this.item.isOpen);

    get computedClass() {
        return cn('flex w-full', this.class);
    }

    get computedButtonClass() {
        return cn(
            'flex flex-1 items-center justify-between text-sm font-medium transition-all',
            this.buttonClass
        );
    }

    onClick() {
        this.item.toggle();
    }
}

@Component({
    selector: 'app-accordion-content',
    standalone: true,
    imports: [CommonModule],
    animations: [
        trigger('expandCollapse', [
            state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
            state('expanded', style({ height: '*', opacity: 1 })),
            transition('collapsed <=> expanded', [
                animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
            ]),
        ]),
    ],
    template: `
    <div
      [@expandCollapse]="isOpen() ? 'expanded' : 'collapsed'"
      class="overflow-hidden text-sm"
    >
      <div [class]="innerClass">
        <ng-content></ng-content>
      </div>
    </div>
  `,
    host: {
        '[class]': 'computedClass'
    },
    styles: [`:host { display: block; }`]
})
export class AccordionContentComponent {
    @Input() class: ClassValue = '';
    @Input() innerClass: ClassValue = 'pb-4 pt-0';

    private item = inject(AccordionItemComponent);

    isOpen = computed(() => this.item.isOpen);

    get computedClass() {
        return cn('', this.class);
    }
}

export const ACCORDION_COMPONENTS = [
    AccordionComponent,
    AccordionItemComponent,
    AccordionTriggerComponent,
    AccordionContentComponent
] as const;
