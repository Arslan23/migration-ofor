import { Component, Input, Output, EventEmitter, Directive, inject, ElementRef, HostListener, ViewChild, ContentChild, TemplateRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, ChevronDown, Check } from 'lucide-angular';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClass',
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class SelectComponent implements ControlValueAccessor {
  @Input() class: ClassValue = '';
  @Input() set value(v: string) {
    this.value$.next(v);
  }
  @Output() valueChange = new EventEmitter<string>();

  readonly value$ = new BehaviorSubject<string>('');
  readonly open$ = new BehaviorSubject<boolean>(false);
  readonly selectedLabel$ = new BehaviorSubject<string>('');
  disabled = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  private elementRef = inject(ElementRef);

  get computedClass() {
    return cn('relative inline-block', this.class);
  }

  setValue(v: string, label?: string) {
    if (this.disabled) return;
    this.value$.next(v);
    if (label) this.selectedLabel$.next(label);
    this.valueChange.emit(v);
    this.onChange(v);
    this.onTouched();
    this.open$.next(false);
  }

  toggle() {
    if (this.disabled) return;
    this.open$.next(!this.open$.value);
  }

  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.open$.next(false);
    }
  }

  writeValue(value: string | null): void {
    this.value$.next(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.open$.next(false);
  }
}

@Component({
  selector: 'app-select-trigger',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <ng-content></ng-content>
    <lucide-icon [img]="ChevronDownIcon" class="h-4 w-4 opacity-50"></lucide-icon>
  `,
  host: {
    '[class]': 'computedClass',
    '(click)': 'onClick()'
  }
})
export class SelectTriggerComponent {
  @Input() class: ClassValue = '';

  readonly ChevronDownIcon = ChevronDown;
  private parent = inject(SelectComponent);

  get computedClass() {
    return cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      this.class
    );
  }

  onClick() {
    this.parent.toggle();
  }
}

@Component({
  selector: 'app-select-value',
  standalone: true,
  imports: [CommonModule],
  template: `{{ (label$ | async) || placeholder }}`,
  host: {
    '[class]': 'computedClass'
  }
})
export class SelectValueComponent {
  @Input() placeholder: string = '';
  @Input() class: ClassValue = '';

  private parent = inject(SelectComponent);
  label$ = this.parent.selectedLabel$;

  get computedClass() {
    return cn('block truncate', this.class);
  }
}

@Component({
  selector: 'app-select-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen$ | async" class="min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
      <div class="p-1">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  host: {
    '[class]': 'computedClass'
  }
})
export class SelectContentComponent {
  @Input() class: ClassValue = '';

  private parent = inject(SelectComponent);
  isOpen$ = this.parent.open$;

  get computedClass() {
    return cn(
      'absolute top-full left-0 z-50 mt-1 w-full min-w-[var(--radix-select-trigger-width)]',
      this.class
    );
  }
}

@Component({
  selector: 'app-select-item',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center" *ngIf="isSelected">
      <lucide-icon [img]="CheckIcon" class="h-4 w-4"></lucide-icon>
    </span>
    <ng-content></ng-content>
  `,
  host: {
    '[class]': 'computedClass',
    '(click)': 'onClick()'
  }
})
export class SelectItemComponent {
  @Input() value: string = '';
  @Input() class: ClassValue = '';

  readonly CheckIcon = Check;
  private parent = inject(SelectComponent);
  private elementRef = inject(ElementRef);
  isSelected = false;

  constructor() {
    this.parent.value$.pipe(takeUntilDestroyed()).subscribe(v => {
      this.isSelected = v === this.value;
      if (this.isSelected) {
        // Update label on parent if selected initially or programmatically
        // Note: Content projection text content access is tricky in Angular universal way, assumes simple text
        this.parent.selectedLabel$.next(this.elementRef.nativeElement.textContent?.trim() || '');
      }
    });
  }

  get computedClass() {
    return cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
      this.class
    );
  }

  onClick() {
    this.parent.setValue(this.value, this.elementRef.nativeElement.textContent?.trim());
  }
}

export const SELECT_COMPONENTS = [
  SelectComponent,
  SelectTriggerComponent,
  SelectValueComponent,
  SelectContentComponent,
  SelectItemComponent
] as const;
