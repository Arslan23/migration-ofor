import { Component, Input, Output, EventEmitter, Directive, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClass'
  }
})
export class TabsComponent {
  @Input() class: ClassValue = '';
  @Input() set value(v: string) {
    this.value$.next(v);
  }
  @Input() set defaultValue(v: string) {
    if (!this.value$.value) this.value$.next(v);
  }
  @Output() valueChange = new EventEmitter<string>();

  readonly value$ = new BehaviorSubject<string>('');

  get computedClass() {
    return cn('', this.class);
  }

  setValue(v: string) {
    this.value$.next(v);
    this.valueChange.emit(v);
  }
}

@Component({
  selector: 'app-tabs-list',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClass'
  }
})
export class TabsListComponent {
  @Input() class: ClassValue = '';
  get computedClass() {
    return cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      this.class
    );
  }
}

@Component({
  selector: 'app-tabs-trigger',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  host: {
    '[class]': 'computedClass',
    '(click)': 'onClick()',
    '[attr.data-state]': 'isActive ? "active" : "inactive"'
  }
})
export class TabsTriggerComponent {
  @Input() value: string = '';
  @Input() class: ClassValue = '';

  private parent = inject(TabsComponent);
  isActive = false;

  constructor() {
    this.parent.value$.pipe(takeUntilDestroyed()).subscribe(v => {
      this.isActive = v === this.value;
    });
  }

  get computedClass() {
    return cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      this.class
    );
  }

  onClick() {
    this.parent.setValue(this.value);
  }
}

@Component({
  selector: 'app-tabs-content',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content *ngIf="isActive"></ng-content>`,
  host: {
    '[class]': 'computedClass'
  }
})
export class TabsContentComponent {
  @Input() value: string = '';
  @Input() class: ClassValue = '';

  private parent = inject(TabsComponent);
  isActive = false;

  constructor() {
    this.parent.value$.pipe(takeUntilDestroyed()).subscribe(v => {
      this.isActive = v === this.value;
    });
  }

  get computedClass() {
    return cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      this.class
    );
  }
}

export const TABS_COMPONENTS = [
  TabsComponent,
  TabsListComponent,
  TabsTriggerComponent,
  TabsContentComponent
] as const;
