import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';

@Component({
    selector: 'app-input',
    standalone: true,
    imports: [CommonModule],
    template: `
    <input
      [type]="type"
      [class]="computedClass"
      [placeholder]="placeholder"
      [value]="value"
      [disabled]="disabled"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
  `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true
        }
    ]
})
export class InputComponent implements ControlValueAccessor {
    @Input() type = 'text';
    @Input() placeholder = '';
    @Input() class: ClassValue = '';
    @Input() disabled = false;
    @Input() value: any = '';

    onChange: any = () => { };
    onTouched: any = () => { };

    get computedClass() {
        return cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            this.class
        );
    }

    onInput(event: Event) {
        const target = event.target as HTMLInputElement;
        this.value = target.value;
        this.onChange(this.value);
    }

    onBlur() {
        this.onTouched();
    }

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}

export const INPUT_COMPONENTS = [InputComponent] as const;
