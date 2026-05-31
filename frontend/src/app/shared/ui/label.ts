import { Directive, Input } from '@angular/core';
import { cn } from '../../lib/utils';
import { ClassValue } from 'clsx';
import { cva, type VariantProps } from 'class-variance-authority';

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

@Directive({
    selector: 'label[appLabel]',
    standalone: true,
    host: {
        '[class]': 'computedClass'
    }
})
export class LabelDirective {
    @Input() class: ClassValue = '';

    get computedClass() {
        return cn(labelVariants(), this.class);
    }
}
