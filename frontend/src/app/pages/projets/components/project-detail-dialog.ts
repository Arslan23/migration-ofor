import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Users, MapPin, Target, Layout, Download, CheckCircle, Clock, AlertTriangle, X } from 'lucide-angular';
import { Project, ProjectStatus, STATUS_LABELS } from '../../../models/project.model';
import { DIALOG_COMPONENTS } from '../../../shared/ui/dialog';
import { TABS_COMPONENTS } from '../../../shared/ui/tabs';
import { BADGE_COMPONENTS } from '../../../shared/ui/badge';
import { BUTTON_COMPONENTS } from '../../../shared/ui/button';
import { CARD_COMPONENTS } from '../../../shared/ui/card';
import { ACCORDION_COMPONENTS } from '../../../shared/ui/accordion';
import { PersonnelService } from '../../../services/personnel';
import { ROLE_LABELS } from '../../../models/personnel.model';

@Component({
    selector: 'app-project-detail-dialog',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule,
        ...DIALOG_COMPONENTS,
        ...TABS_COMPONENTS,
        ...BADGE_COMPONENTS,
        ...BUTTON_COMPONENTS,
        ...CARD_COMPONENTS,
        ...ACCORDION_COMPONENTS
    ],
    template: `
    <app-dialog [open]="open" (openChange)="onClose()" class="max-w-5xl h-[90vh]">
      <div class="flex flex-col h-full overflow-hidden">
        <app-dialog-header class="border-b pb-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <lucide-icon [img]="LayoutIcon" class="w-6 h-6"></lucide-icon>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono text-xs text-muted-foreground">{{ project?.code }}</span>
                  <app-badge [class]="getStatusClass(project?.status)">
                    {{ getStatusLabel(project?.status) }}
                  </app-badge>
                </div>
                <app-dialog-title class="text-xl font-bold">{{ project?.name }}</app-dialog-title>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <app-button variant="outline" size="sm" (click)="onExportPDF()" class="gap-2">
                <lucide-icon [img]="DownloadIcon" class="w-4 h-4"></lucide-icon>
                Fiche PDF
              </app-button>
            </div>
          </div>
        </app-dialog-header>

        <div class="flex-1 overflow-hidden">
          <app-tabs defaultValue="general" class="h-full flex flex-col">
            <app-tabs-list class="px-6 border-b bg-transparent h-12 w-full justify-start gap-6 rounded-none">
              <app-tabs-trigger value="general" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full gap-2">
                <lucide-icon [img]="FileTextIcon" class="w-4 h-4"></lucide-icon>
                Général
              </app-tabs-trigger>
              <app-tabs-trigger value="team" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full gap-2">
                <lucide-icon [img]="UsersIcon" class="w-4 h-4"></lucide-icon>
                Équipe
              </app-tabs-trigger>
              <app-tabs-trigger value="zones" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full gap-2">
                <lucide-icon [img]="MapPinIcon" class="w-4 h-4"></lucide-icon>
                Zones
              </app-tabs-trigger>
              <app-tabs-trigger value="activities" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full gap-2">
                <lucide-icon [img]="TargetIcon" class="w-4 h-4"></lucide-icon>
                Activités
              </app-tabs-trigger>
              <app-tabs-trigger value="indicators" class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full gap-2">
                <lucide-icon [img]="TargetIcon" class="w-4 h-4"></lucide-icon>
                Indicateurs
              </app-tabs-trigger>
            </app-tabs-list>

            <div class="flex-1 overflow-y-auto p-6">
              <app-tabs-content value="general" class="mt-0 space-y-6">
                <!-- Overview Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <app-card class="p-4 bg-muted/30 border-none">
                    <p class="text-sm text-muted-foreground mb-1">Budget Total</p>
                    <p class="text-2xl font-bold">{{ formatAmount(project?.budget) }} FCFA</p>
                  </app-card>
                  <app-card class="p-4 bg-muted/30 border-none">
                    <p class="text-sm text-muted-foreground mb-1">Avancement Global</p>
                    <div class="flex items-center gap-3">
                      <div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div class="h-full bg-secondary" [style.width.%]="project?.progress"></div>
                      </div>
                      <span class="font-bold text-secondary">{{ project?.progress }}%</span>
                    </div>
                  </app-card>
                  <app-card class="p-4 bg-muted/30 border-none">
                    <p class="text-sm text-muted-foreground mb-1">Durée</p>
                    <p class="text-lg font-medium">{{ project?.startDate | date:'dd/MM/yyyy' }} - {{ project?.endDate | date:'dd/MM/yyyy' }}</p>
                  </app-card>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div class="space-y-4">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                      <div class="w-1.5 h-6 bg-primary rounded-full"></div>
                      Description
                    </h3>
                    <p class="text-muted-foreground leading-relaxed">
                      {{ project?.description }}
                    </p>
                  </div>
                  <div class="space-y-4">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                      <div class="w-1.5 h-6 bg-primary rounded-full"></div>
                      Informations Clés
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bailleur</p>
                        <p class="font-medium">{{ project?.bailleur }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Région Principale</p>
                        <p class="font-medium">{{ project?.region }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Responsable</p>
                        <p class="font-medium">{{ project?.responsible }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email Responsable</p>
                        <p class="font-medium text-sm">{{ project?.responsibleEmail }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </app-tabs-content>

              <app-tabs-content value="team" class="mt-0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <app-card *ngFor="let member of project?.equipeProjet" class="p-4">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <lucide-icon [img]="UsersIcon" class="w-5 h-5"></lucide-icon>
                      </div>
                      <div>
                        <p class="font-bold">{{ getPersonnelName(member.personnelId) }}</p>
                        <p class="text-xs text-primary">{{ getRoleLabel(member.role) }}</p>
                      </div>
                    </div>
                  </app-card>
                  <div *ngIf="!project?.equipeProjet?.length" class="col-span-2 py-12 text-center text-muted-foreground">
                    Aucun membre d'équipe assigné.
                  </div>
                </div>
              </app-tabs-content>

              <app-tabs-content value="zones" class="mt-0">
                <div class="space-y-3">
                  <app-card *ngFor="let zone of project?.zonesIntervention" class="p-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <app-badge variant="outline" class="text-[10px] uppercase font-bold">{{ zone.type }}</app-badge>
                        <span class="font-medium">
                          {{ zone.communeName || zone.departementName || zone.regionName }}
                        </span>
                      </div>
                      <span class="text-xs text-muted-foreground">{{ zone.regionName }}</span>
                    </div>
                  </app-card>
                  <div *ngIf="!project?.zonesIntervention?.length" class="py-12 text-center text-muted-foreground">
                    Aucune zone d'intervention spécifiée.
                  </div>
                </div>
              </app-tabs-content>

              <app-tabs-content value="activities" class="mt-0 space-y-4">
                <app-accordion type="single" collapsible>
                  <app-accordion-item *ngFor="let activity of project?.activities; let i = index" [value]="'item-' + i">
                    <app-accordion-trigger>
                       <div class="flex items-center gap-3 text-left">
                        <app-badge [class]="getActivityStatusClass(activity.status)">
                          {{ activity.status | titlecase }}
                        </app-badge>
                        <span class="font-medium">{{ activity.name }}</span>
                      </div>
                    </app-accordion-trigger>
                    <app-accordion-content>
                      <div class="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p class="text-xs text-muted-foreground">Budget</p>
                          <p class="font-bold">{{ formatAmount(activity.budget) }} FCFA</p>
                        </div>
                        <div>
                          <p class="text-xs text-muted-foreground">Responsable</p>
                          <p>{{ activity.responsible }}</p>
                        </div>
                        <div class="col-span-2">
                          <p class="text-xs text-muted-foreground">Période</p>
                          <p>{{ activity.startDate | date:'dd/MM/yyyy' }} - {{ activity.endDate | date:'dd/MM/yyyy' }}</p>
                        </div>
                      </div>
                    </app-accordion-content>
                  </app-accordion-item>
                </app-accordion>
                <div *ngIf="!project?.activities?.length" class="py-12 text-center text-muted-foreground">
                  Aucune activité définie.
                </div>
              </app-tabs-content>

              <app-tabs-content value="indicators" class="mt-0 space-y-4">
                <div *ngFor="let indicator of project?.indicators" class="p-4 border rounded-lg bg-card">
                   <div class="flex justify-between items-start mb-3">
                    <div>
                      <p class="text-xs font-mono text-muted-foreground">{{ indicator.code }}</p>
                      <h4 class="font-bold">{{ indicator.name }}</h4>
                    </div>
                    <app-badge variant="outline">{{ indicator.type | titlecase }}</app-badge>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-4 mb-3">
                     <div class="text-center p-2 bg-muted/30 rounded">
                      <p class="text-[10px] text-muted-foreground uppercase">Référence</p>
                      <p class="font-bold">{{ indicator.baselineValue }}</p>
                    </div>
                    <div class="text-center p-2 bg-primary/5 rounded border border-primary/10">
                      <p class="text-[10px] text-primary uppercase">Actuel</p>
                      <p class="font-bold text-primary">{{ indicator.currentValue }}</p>
                    </div>
                    <div class="text-center p-2 bg-muted/30 rounded">
                      <p class="text-[10px] text-muted-foreground uppercase">Cible</p>
                      <p class="font-bold">{{ indicator.targetValue }}</p>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-muted-foreground">Progression</span>
                      <span class="font-bold">{{ getIndicatorProgress(indicator) }}%</span>
                    </div>
                    <div class="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div class="h-full bg-primary" [style.width.%]="getIndicatorProgress(indicator)"></div>
                    </div>
                  </div>
                </div>
                <div *ngIf="!project?.indicators?.length" class="py-12 text-center text-muted-foreground">
                  Aucun indicateur défini.
                </div>
              </app-tabs-content>
            </div>
          </app-tabs>
        </div>
      </div>
    </app-dialog>
  `,
    styles: [`
    :host { display: contents; }
  `]
})
export class ProjectDetailDialogComponent {
    @Input() open = false;
    @Input() project: Project | null = null;
    @Output() openChange = new EventEmitter<boolean>();

    private personnelService = inject(PersonnelService);

    readonly LayoutIcon = Layout;
    readonly DownloadIcon = Download;
    readonly FileTextIcon = FileText;
    readonly UsersIcon = Users;
    readonly MapPinIcon = MapPin;
    readonly TargetIcon = Target;

    onClose() {
        this.open = false;
        this.openChange.emit(this.open);
    }

    getStatusLabel(status: ProjectStatus | undefined): string {
        return status ? STATUS_LABELS[status] : '';
    }

    getStatusClass(status: ProjectStatus | undefined): string {
        if (!status) return '';
        const styles: Record<ProjectStatus, string> = {
            en_cours: "bg-blue-100 text-blue-800 border-blue-200",
            termine: "bg-green-100 text-green-800 border-green-200",
            retard: "bg-red-100 text-red-800 border-red-200",
            planifie: "bg-muted text-muted-foreground",
            suspendu: "bg-amber-100 text-amber-800 border-amber-200",
        };
        return styles[status] || "";
    }

    getActivityStatusClass(status: string): string {
        const styles: Record<string, string> = {
            'en_cours': "bg-blue-100 text-blue-800",
            'termine': "bg-green-100 text-green-800",
            'planifie': "bg-muted text-muted-foreground",
            'annule': "bg-red-100 text-red-800",
        };
        return styles[status] || "";
    }

    formatAmount(amount: number | undefined): string {
        if (amount === undefined) return '0';
        return new Intl.NumberFormat('fr-FR').format(amount);
    }

    getPersonnelName(id: string): string {
        // This is a simplified mock lookup. In a real app, we'd use a signal or observable.
        return 'Membre de l\'équipe';
    }

    getRoleLabel(role: string): string {
        return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
    }

    getIndicatorProgress(indicator: any): number {
        if (!indicator.targetValue) return 0;
        return Math.min(100, Math.round((indicator.currentValue / indicator.targetValue) * 100));
    }

    onExportPDF() {
        console.log('Exporting PDF for:', this.project?.name);
        // Integrate with existing export logic if possible
    }
}
