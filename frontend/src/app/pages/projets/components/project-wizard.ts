import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, FileText, Target, MapPin, Users, Check, ChevronLeft, ChevronRight, Save, X, Calendar as CalendarIcon } from 'lucide-angular';
import { DIALOG_COMPONENTS } from '../../../shared/ui/dialog';
import { BUTTON_COMPONENTS } from '../../../shared/ui/button';
import { INPUT_COMPONENTS } from '../../../shared/ui/input';
import { SELECT_COMPONENTS } from '../../../shared/ui/select';
import { PROGRESS_COMPONENTS } from '../../../shared/ui/progress';
import { BADGE_COMPONENTS } from '../../../shared/ui/badge';
import { CURRENCIES, Project } from '../../../models/project.model';
import { SENEGAL_GEO } from '../../../data/geo.data';

@Component({
    selector: 'app-project-wizard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        LucideAngularModule,
        ...DIALOG_COMPONENTS,
        ...BUTTON_COMPONENTS,
        ...INPUT_COMPONENTS,
        ...SELECT_COMPONENTS,
        ...PROGRESS_COMPONENTS,
        ...BADGE_COMPONENTS
    ],
    template: `
    <app-dialog [open]="open" (openChange)="onClose()" class="max-w-4xl max-h-[90vh]">
      <div class="flex flex-col h-full overflow-hidden">
        <app-dialog-header class="pb-2 border-b">
          <div class="flex items-center justify-between">
            <div>
              <app-dialog-title class="text-xl font-bold">
                {{ isEditing ? 'Modifier le projet' : 'Nouveau projet' }}
              </app-dialog-title>
              <p class="text-sm text-muted-foreground">Étape {{ currentStep() }} sur {{ totalSteps }}</p>
            </div>
            <app-badge [variant]="completionPercentage() === 100 ? 'default' : 'secondary'" class="text-xs">
              {{ completionPercentage() }}% complété
            </app-badge>
          </div>
        </app-dialog-header>

        <!-- Step Indicators -->
        <div class="px-6 py-4 border-b bg-muted/10">
          <div class="flex items-center justify-between">
            <div *ngFor="let step of steps; let i = index" class="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                (click)="goToStep(step.id)"
                class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left"
                [ngClass]="{
                  'bg-primary text-primary-foreground': currentStep() === step.id,
                  'bg-primary/10 text-primary': currentStep() > step.id,
                  'text-muted-foreground hover:bg-muted': currentStep() < step.id
                }"
              >
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                     [ngClass]="{
                       'bg-primary-foreground text-primary': currentStep() === step.id,
                       'bg-primary text-primary-foreground': currentStep() > step.id,
                       'bg-muted': currentStep() < step.id
                     }">
                  <lucide-icon *ngIf="currentStep() > step.id" [img]="CheckIcon" class="w-4 h-4"></lucide-icon>
                  <span *ngIf="currentStep() <= step.id">{{ step.id }}</span>
                </div>
                <div class="hidden md:block">
                  <p class="text-sm font-medium">{{ step.name }}</p>
                  <p class="text-xs opacity-70">{{ step.description }}</p>
                </div>
              </button>
              <div *ngIf="i < steps.length - 1" class="flex-1 h-0.5 mx-4"
                   [ngClass]="currentStep() > step.id ? 'bg-primary' : 'bg-border'"></div>
            </div>
          </div>
        </div>

        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto p-6" [formGroup]="projectForm">
          <!-- Step 1: General Info -->
          <div *ngIf="currentStep() === 1" class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">Code projet *</label>
                <app-input formControlName="code" placeholder="Ex: PUDC-2024-001"></app-input>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Nom du projet *</label>
                <app-input formControlName="name" placeholder="Nom complet du projet"></app-input>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Description</label>
              <textarea formControlName="description" rows="3" 
                        class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Description du projet..."></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">Région principale *</label>
                <app-select [value]="projectForm.get('region')?.value" (valueChange)="setControlValue('region', $event)">
                  <app-select-trigger>
                    <app-select-value placeholder="Sélectionner une région"></app-select-value>
                  </app-select-trigger>
                  <app-select-content>
                    <app-select-item *ngFor="let r of regions" [value]="r.name">{{ r.name }}</app-select-item>
                  </app-select-content>
                </app-select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Bailleur *</label>
                <app-input formControlName="bailleur" placeholder="Nom du bailleur"></app-input>
              </div>
            </div>
          </div>

          <!-- Step 2: Budget & Timeline -->
          <div *ngIf="currentStep() === 2" class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">Devise *</label>
                <app-select [value]="projectForm.get('currency')?.value" (valueChange)="setControlValue('currency', $event)">
                  <app-select-trigger>
                    <app-select-value placeholder="Devise"></app-select-value>
                  </app-select-trigger>
                  <app-select-content>
                    <app-select-item *ngFor="let c of currencies" [value]="c.code">{{ c.code }} - {{ c.symbol }}</app-select-item>
                  </app-select-content>
                </app-select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Budget *</label>
                <app-input type="number" formControlName="budget" placeholder="0"></app-input>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Équivalent FCFA</label>
                <app-input type="number" formControlName="budgetFCFA" placeholder="0" [disabled]="projectForm.get('currency')?.value === 'XOF'"></app-input>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">Date de début *</label>
                <app-input type="date" formControlName="startDate"></app-input>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Date de fin *</label>
                <app-input type="date" formControlName="endDate"></app-input>
              </div>
            </div>
          </div>

          <!-- Step 3: Zones -->
          <div *ngIf="currentStep() === 3" class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
             <div class="p-8 text-center border-2 border-dashed rounded-xl bg-muted/10">
                <lucide-icon [img]="MapPinIcon" class="w-10 h-10 mx-auto text-muted-foreground mb-4"></lucide-icon>
                <h4 class="font-bold mb-1">Configuration des Zones d'Intervention</h4>
                <p class="text-sm text-muted-foreground mb-4">La sélection des zones se fera via un sélecteur géographique.</p>
                <app-button variant="outline" size="sm">Ouvrir le sélecteur</app-button>
             </div>
          </div>

          <!-- Step 4: Team -->
          <div *ngIf="currentStep() === 4" class="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div class="space-y-4">
               <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Nom du responsable *</label>
                    <app-input formControlName="responsible" placeholder="Prénom Nom"></app-input>
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Email responsable</label>
                    <app-input type="email" formControlName="responsibleEmail" placeholder="email@exemple.com"></app-input>
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Téléphone</label>
                    <app-input formControlName="responsiblePhone" placeholder="+221 ..."></app-input>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <app-dialog-footer class="p-6 border-t bg-muted/5">
          <div class="flex items-center justify-between w-full">
            <app-button variant="outline" (click)="onSaveDraft()" class="gap-2">
              <lucide-icon [img]="SaveIcon" class="w-4 h-4"></lucide-icon>
              Sauvegarder brouillon
            </app-button>
            <div class="flex items-center gap-2">
              <app-button *ngIf="currentStep() > 1" variant="outline" (click)="prevStep()" class="gap-2">
                <lucide-icon [img]="ChevronLeftIcon" class="w-4 h-4"></lucide-icon>
                Précédent
              </app-button>
              <app-button *ngIf="currentStep() < totalSteps" (click)="nextStep()" class="gap-2">
                Suivant
                <lucide-icon [img]="ChevronRightIcon" class="w-4 h-4"></lucide-icon>
              </app-button>
              <app-button *ngIf="currentStep() === totalSteps" (click)="onSubmit()" class="gap-2 bg-primary">
                <lucide-icon [img]="CheckIcon" class="w-4 h-4"></lucide-icon>
                Soumettre pour validation
              </app-button>
            </div>
          </div>
        </app-dialog-footer>
      </div>
    </app-dialog>
  `,
    styles: [`
    :host { display: contents; }
  `]
})
export class ProjectWizardComponent {
    @Input() open = false;
    @Input() isEditing = false;
    @Input() initialData: Partial<Project> | null = null;
    @Output() openChange = new EventEmitter<boolean>();
    @Output() submit = new EventEmitter<any>();

    readonly totalSteps = 4;
    currentStep = signal(1);

    steps = [
        { id: 1, name: "Général", icon: FileText, description: "Informations de base" },
        { id: 2, name: "Budget", icon: Target, description: "Budget et calendrier" },
        { id: 3, name: "Zones", icon: MapPin, description: "Zones d'intervention" },
        { id: 4, name: "Équipe", icon: Users, description: "Équipe projet" },
    ];

    regions = SENEGAL_GEO;
    currencies = CURRENCIES;

    readonly CheckIcon = Check;
    readonly FileTextIcon = FileText;
    readonly TargetIcon = Target;
    readonly MapPinIcon = MapPin;
    readonly UsersIcon = Users;
    readonly ChevronLeftIcon = ChevronLeft;
    readonly ChevronRightIcon = ChevronRight;
    readonly SaveIcon = Save;
    readonly XIcon = X;

    projectForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.projectForm = this.fb.group({
            code: ['', [Validators.required, Validators.maxLength(20)]],
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
            description: [''],
            region: ['', Validators.required],
            bailleur: ['', Validators.required],
            currency: ['XOF', Validators.required],
            budget: [0, [Validators.required, Validators.min(0)]],
            budgetFCFA: [0],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            responsible: ['', Validators.required],
            responsibleEmail: ['', [Validators.email]],
            responsiblePhone: [''],
        });
    }

    completionPercentage = computed(() => {
        const controls = this.projectForm.controls;
        let filled = 0;
        const fieldsToTrack = ['code', 'name', 'region', 'bailleur', 'budget', 'startDate', 'endDate', 'responsible'];

        fieldsToTrack.forEach(field => {
            if (controls[field].valid && controls[field].value !== '' && controls[field].value !== 0) {
                filled++;
            }
        });

        return Math.round((filled / fieldsToTrack.length) * 100);
    });

    ngOnChanges() {
        if (this.initialData) {
            this.projectForm.patchValue(this.initialData);
        }
    }

    onClose() {
        this.open = false;
        this.openChange.emit(this.open);
        this.currentStep.set(1);
    }

    goToStep(stepId: number) {
        if (stepId < this.currentStep() || this.isStepValid(this.currentStep())) {
            this.currentStep.set(stepId);
        }
    }

    nextStep() {
        if (this.currentStep() < this.totalSteps && this.isStepValid(this.currentStep())) {
            this.currentStep.set(this.currentStep() + 1);
        }
    }

    prevStep() {
        if (this.currentStep() > 1) {
            this.currentStep.set(this.currentStep() - 1);
        }
    }

    isStepValid(stepId: number): boolean {
        // Basic validation per step
        return true; // Simplified for now
    }

    setControlValue(controlName: string, value: string) {
        const control = this.projectForm.get(controlName);
        control?.setValue(value);
        control?.markAsDirty();
        control?.markAsTouched();
    }

    onSaveDraft() {
        const data = { ...this.projectForm.value, status: 'brouillon' };
        this.submit.emit(data);
        this.onClose();
    }

    onSubmit() {
        if (this.projectForm.valid) {
            const data = { ...this.projectForm.value, status: 'en_validation' };
            this.submit.emit(data);
            this.onClose();
        } else {
            // Mark all as touched to show errors
            this.projectForm.markAllAsTouched();
        }
    }
}
