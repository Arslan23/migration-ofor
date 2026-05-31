import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FolderKanban, Timer, Wallet, Activity, Package, Target, Clock, AlertTriangle, CheckCircle2 } from 'lucide-angular';
import { Project } from '../../../models/project.model';
import { BadgeComponent } from '../../../shared/ui/badge';
import { ProgressComponent } from '../../../shared/ui/progress';
import { AccordionComponent, AccordionItemComponent, AccordionTriggerComponent, AccordionContentComponent } from '../../../shared/ui/accordion';

@Component({
  selector: 'app-project-details-table',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BadgeComponent,
    ProgressComponent,
    AccordionComponent,
    AccordionItemComponent,
    AccordionTriggerComponent,
    AccordionContentComponent
  ],
  template: `
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div class="p-3 border-b">
        <h3 class="text-sm font-semibold flex items-center gap-2">
          <lucide-icon [img]="FolderKanbanIcon" class="w-4 h-4"></lucide-icon>
          Situation détaillée par projet
        </h3>
      </div>
      <div class="p-2">
        <app-accordion type="multiple" class="space-y-2">
          <app-accordion-item *ngFor="let project of projectsAnalysis()" [value]="project.id" class="border rounded-lg px-2">
            <app-accordion-trigger buttonClass="py-2 hover:no-underline">
              <div class="flex items-center gap-3 flex-1 pr-4 text-left min-w-0">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="font-semibold text-sm truncate">
                      {{ project.name }}
                    </span>
                    <app-badge [variant]="getStatusVariant(project.status)" class="text-[10px] px-1.5 py-0 h-4 shrink-0">
                      {{ project.status }}
                    </app-badge>
                  </div>
                  <div class="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{{ project.region }}</span>
                    <span>•</span>
                    <span>{{ project.activitiesCount }} activités</span>
                    <span>•</span>
                    <span>{{ project.indicatorsCount }} indicateurs</span>
                  </div>
                </div>
                
                <div class="hidden md:flex items-center gap-4 text-xs whitespace-nowrap ml-auto">
                  <div class="text-center">
                    <p class="text-muted-foreground">Délai</p>
                    <p class="font-bold text-amber-600">{{ project.timeProgress }}%</p>
                  </div>
                  <div class="text-center">
                    <p class="text-muted-foreground">Budget</p>
                    <p class="font-bold text-blue-600">{{ project.budgetExecutionRate }}%</p>
                  </div>
                  <div class="text-center">
                    <p class="text-muted-foreground">Opérationnel</p>
                    <p class="font-bold" [ngClass]="getOperationalColor(project.operationalRate)">
                      {{ project.operationalRate }}%
                    </p>
                  </div>
                </div>
              </div>
            </app-accordion-trigger>
            
            <app-accordion-content class="pb-3">
              <!-- Summary KPIs -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
                <div class="flex items-center gap-2">
                  <lucide-icon [img]="TimerIcon" class="w-3.5 h-3.5 text-amber-600"></lucide-icon>
                  <div>
                    <p class="text-[9px] text-muted-foreground">Délai consommé</p>
                    <p class="text-xs font-bold text-amber-600">{{ project.timeProgress }}%</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <lucide-icon [img]="WalletIcon" class="w-3.5 h-3.5 text-blue-600"></lucide-icon>
                  <div>
                    <p class="text-[9px] text-muted-foreground">Exéc. budgétaire</p>
                    <p class="text-xs font-bold text-blue-600">{{ project.budgetExecutionRate }}%</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <lucide-icon [img]="ActivityIcon" class="w-3.5 h-3.5 text-green-600"></lucide-icon>
                  <div>
                    <p class="text-[9px] text-muted-foreground">Avancement activités</p>
                    <p class="text-xs font-bold text-green-600">{{ project.activityProgress }}%</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <lucide-icon [img]="PackageIcon" class="w-3.5 h-3.5 text-purple-600"></lucide-icon>
                  <div>
                    <p class="text-[9px] text-muted-foreground">Avancement livrables</p>
                    <p class="text-xs font-bold text-purple-600">{{ project.deliverableProgress }}%</p>
                  </div>
                </div>
              </div>

              <!-- Activities Table -->
              <div class="mb-4" *ngIf="project.activities.length > 0">
                <h4 class="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5 px-1">
                  <lucide-icon [img]="ClockIcon" class="w-3.5 h-3.5"></lucide-icon> Activités
                </h4>
                <div class="overflow-x-auto border rounded-md">
                  <table class="w-full text-[10px]">
                    <thead>
                      <tr class="bg-muted/50 border-b">
                        <th class="text-left py-1.5 px-2 font-medium">Activité</th>
                        <th class="text-center py-1.5 px-1 font-medium">Statut</th>
                        <th class="text-center py-1.5 px-1 font-medium">Délai</th>
                        <th class="text-center py-1.5 px-1 font-medium">Avancement</th>
                        <th class="text-right py-1.5 px-1 font-medium">Budget</th>
                        <th class="text-center py-1.5 px-1 font-medium">Exéc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let act of project.activities" class="border-b last:border-0 hover:bg-muted/30">
                        <td class="py-1.5 px-2">
                          <span class="font-medium text-primary">{{ act.code }}</span>
                          <span class="text-muted-foreground ml-1">{{ act.name }}</span>
                        </td>
                        <td class="py-1.5 px-1 text-center">
                          <app-badge [variant]="getStatusVariant(act.status)" class="text-[9px] h-3.5 px-1">{{ act.status }}</app-badge>
                        </td>
                        <td class="py-1.5 px-1 text-center">
                          <span [ngClass]="getPerfColor(act.timeProgress)">{{ act.timeProgress }}%</span>
                        </td>
                        <td class="py-1.5 px-1">
                          <div class="flex items-center gap-1.5 justify-center group">
                            <app-progress [value]="act.progress" class="w-10 h-1"></app-progress>
                            <span class="text-[9px] whitespace-nowrap">{{ act.progress }}%</span>
                          </div>
                        </td>
                        <td class="py-1.5 px-1 text-right font-medium">{{ act.budget | number:'1.0-0':'fr-FR' }}</td>
                        <td class="py-1.5 px-1 text-center font-medium">
                          <span [ngClass]="getPerfColor(act.budgetExecutionRate)">{{ act.budgetExecutionRate }}%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Indicators Table (if any) -->
              <div *ngIf="project.indicators.length > 0">
                <h4 class="text-[11px] font-semibold mb-1.5 flex items-center gap-1.5 px-1">
                  <lucide-icon [img]="TargetIcon" class="w-3.5 h-3.5"></lucide-icon> Indicateurs
                </h4>
                <div class="overflow-x-auto border rounded-md">
                  <table class="w-full text-[10px]">
                    <thead>
                      <tr class="bg-muted/50 border-b">
                        <th class="text-left py-1.5 px-2 font-medium">Indicateur</th>
                        <th class="text-center py-1.5 px-1 font-medium">Unité</th>
                        <th class="text-right py-1.5 px-1 font-medium">Cible</th>
                        <th class="text-right py-1.5 px-1 font-medium">Réalisé</th>
                        <th class="text-center py-1.5 px-1 font-medium">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let ind of project.indicators" class="border-b last:border-0 hover:bg-muted/30">
                        <td class="py-1.5 px-2 font-medium">{{ ind.name }}</td>
                        <td class="py-1.5 px-1 text-center text-muted-foreground">{{ ind.unit }}</td>
                        <td class="py-1.5 px-1 text-right">{{ ind.target | number }}</td>
                        <td class="py-1.5 px-1 text-right font-medium text-primary">{{ ind.actual | number }}</td>
                        <td class="py-1.5 px-1 text-center">
                          <span class="font-bold" [ngClass]="getPerfColor(ind.performance)">{{ ind.performance }}%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </app-accordion-content>
          </app-accordion-item>
        </app-accordion>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProjectDetailsTableComponent {
  @Input() projects: Project[] = [];

  readonly FolderKanbanIcon = FolderKanban;
  readonly TimerIcon = Timer;
  readonly WalletIcon = Wallet;
  readonly ActivityIcon = Activity;
  readonly PackageIcon = Package;
  readonly TargetIcon = Target;
  readonly ClockIcon = Clock;

  projectsAnalysis = computed(() => {
    return this.projects.map(p => {
      // Basic metrics computation
      const activities = p.activities || [];
      const activitiesCount = activities.length;

      const totalProgress = activitiesCount > 0
        ? Math.round(activities.reduce((sum, a) => sum + (a.progress || 0), 0) / activitiesCount)
        : 0;

      // Time progress
      const start = new Date(p.startDate).getTime();
      const end = new Date(p.endDate).getTime();
      const now = new Date().getTime();
      const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.max(0, (now - start) / (1000 * 60 * 60 * 24));
      const timeProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

      // Budget execution
      const budget = p.budgetFCFA || 0;
      const spent = p.spent || 0;
      const budgetExecutionRate = budget > 0 ? Math.round((spent / budget) * 100) : 0;

      // Deliverable progress (if available) - mocking for now if not in model
      const deliverableProgress = Math.round(totalProgress * 0.9); // Mocked correlation

      // Operational rate (weighted average)
      const operationalRate = Math.round((totalProgress * 0.6) + (budgetExecutionRate * 0.4));

      // Mocked indicators
      const indicatorsCount = Math.floor(Math.random() * 3) + 1;
      const indicators = Array.from({ length: indicatorsCount }).map((_, i) => ({
        name: `Indicateur de performance ${i + 1}`,
        unit: '%',
        target: 100,
        actual: Math.round(operationalRate * (0.8 + Math.random() * 0.4)),
        performance: 0
      })).map(ind => ({
        ...ind,
        performance: Math.round((ind.actual / ind.target) * 100)
      }));

      return {
        ...p,
        activitiesCount,
        indicatorsCount,
        timeProgress,
        budgetExecutionRate,
        activityProgress: totalProgress,
        deliverableProgress,
        operationalRate,
        indicators,
        activities: activities.map(a => {
          // Compute act specific metrics
          const aStart = new Date(a.startDate || p.startDate).getTime();
          const aEnd = new Date(a.endDate || p.endDate).getTime();
          const aElapsed = Math.max(0, (now - aStart) / (1000 * 60 * 60 * 24));
          const aTotal = Math.max(1, (aEnd - aStart) / (1000 * 60 * 60 * 24));
          const aTimeProgress = Math.min(100, Math.round((aElapsed / aTotal) * 100));

          const aBudget = a.budget || 0;
          const aSpent = a.spent || 0;
          const aBudgetExecutionRate = aBudget > 0 ? Math.round((aSpent / aBudget) * 100) : 0;

          return {
            ...a,
            timeProgress: aTimeProgress,
            budgetExecutionRate: aBudgetExecutionRate
          };
        })
      };
    });
  });

  getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' | 'outline' {
    const s = status.toLowerCase();
    if (s.includes('termin') || s.includes('compl')) return 'success';
    if (s.includes('cours') || s.includes('prog')) return 'default';
    if (s.includes('susp') || s.includes('attente')) return 'warning';
    if (s.includes('retard') || s.includes('annule')) return 'destructive';
    return 'outline';
  }

  getOperationalColor(rate: number): string {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  }

  getPerfColor(perf: number): string {
    if (perf >= 90) return 'text-green-600';
    if (perf >= 50) return 'text-amber-600';
    return 'text-red-600';
  }
}
