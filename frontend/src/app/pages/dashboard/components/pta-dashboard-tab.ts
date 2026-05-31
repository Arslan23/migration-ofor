import { Component, Input, computed, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Calendar, Wallet, TrendingUp, Target, Activity, Package, BarChart3, CheckCircle2, AlertTriangle, Clock, Download, FileSpreadsheet } from 'lucide-angular';
import Chart from 'chart.js/auto';
import { PTA } from '../../../models/pta.model';
import { BadgeComponent } from '../../../shared/ui/badge';
import { CARD_COMPONENTS } from '../../../shared/ui/card';
import { ButtonComponent } from '../../../shared/ui/button';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-pta-dashboard-tab',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BadgeComponent,
    ...CARD_COMPONENTS,
    ButtonComponent
  ],
  template: `
    <div class="space-y-4">
      <!-- Header with export buttons -->
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-muted-foreground">Suivi PTA - {{ periodLabel() }}</h2>
        <div class="flex items-center gap-2">
          <app-button variant="outline" size="sm" class="h-7 text-xs gap-1">
            <lucide-icon [img]="FileSpreadsheetIcon" class="w-3.5 h-3.5"></lucide-icon> Excel
          </app-button>
          <app-button size="sm" class="h-7 text-xs gap-1">
            <lucide-icon [img]="DownloadIcon" class="w-3.5 h-3.5"></lucide-icon> PDF
          </app-button>
        </div>
      </div>

      <!-- Main KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <app-card>
          <div card-content class="p-2 flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-primary/10">
              <lucide-icon [img]="CalendarIcon" class="w-3.5 h-3.5 text-primary"></lucide-icon>
            </div>
            <div>
              <p class="text-[9px] text-muted-foreground">Période</p>
              <p class="text-sm font-bold">{{ periodLabel() }}</p>
            </div>
          </div>
        </app-card>

        <app-card>
          <div card-content class="p-2 flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <lucide-icon [img]="WalletIcon" class="w-3.5 h-3.5 text-blue-600"></lucide-icon>
            </div>
            <div>
              <p class="text-[9px] text-muted-foreground">Budget prévu</p>
              <p class="text-sm font-bold text-blue-600">{{ formatBudget(periodData().totalPlan) }}</p>
            </div>
          </div>
        </app-card>

        <app-card>
          <div card-content class="p-2 flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <lucide-icon [img]="TrendingUpIcon" class="w-3.5 h-3.5 text-green-600"></lucide-icon>
            </div>
            <div>
              <p class="text-[9px] text-muted-foreground">Budget réalisé</p>
              <p class="text-sm font-bold text-green-600">{{ formatBudget(periodData().totalReal) }}</p>
            </div>
          </div>
        </app-card>

        <app-card>
          <div card-content class="p-2 flex items-center gap-2">
            <div [class]="cn(
              'p-1.5 rounded-lg',
              periodData().executionRate >= 80 ? 'bg-green-100 dark:bg-green-900/30' :
              periodData().executionRate >= 60 ? 'bg-amber-100 dark:bg-amber-900/30' :
              'bg-red-100 dark:bg-red-900/30'
            )">
              <lucide-icon [img]="TargetIcon" [class]="cn(
                'w-3.5 h-3.5',
                periodData().executionRate >= 80 ? 'text-green-600' :
                periodData().executionRate >= 60 ? 'text-amber-600' : 'text-red-600'
              )"></lucide-icon>
            </div>
            <div>
              <p class="text-[9px] text-muted-foreground">Taux exécution</p>
              <p [class]="cn(
                'text-sm font-bold',
                periodData().executionRate >= 80 ? 'text-green-600' :
                periodData().executionRate >= 60 ? 'text-amber-600' : 'text-red-600'
              )">{{ periodData().executionRate }}%</p>
            </div>
          </div>
        </app-card>

        <app-card>
          <div card-content class="p-2 flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <lucide-icon [img]="ActivityIcon" class="w-3.5 h-3.5 text-purple-600"></lucide-icon>
            </div>
            <div>
              <p class="text-[9px] text-muted-foreground">Activités</p>
              <p class="text-sm font-bold">{{ periodData().activitiesData.length }}</p>
            </div>
          </div>
        </app-card>

        <app-card>
          <div card-content class="p-2 flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <lucide-icon [img]="PackageIcon" class="w-3.5 h-3.5 text-amber-600"></lucide-icon>
            </div>
            <div>
              <p class="text-[9px] text-muted-foreground">Livrables</p>
              <p class="text-sm font-bold">{{ periodData().delStats.total }}</p>
            </div>
          </div>
        </app-card>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <app-card>
          <div card-header class="py-2">
            <div card-title class="text-sm flex items-center gap-2">
              <lucide-icon [img]="BarChart3Icon" class="w-4 h-4"></lucide-icon> Budget par nature ({{ periodLabel() }})
            </div>
          </div>
          <div card-content class="h-60 pt-0">
            <canvas #natureChartCanvas></canvas>
          </div>
        </app-card>

        <app-card>
          <div card-header class="py-2">
            <div card-title class="text-sm flex items-center gap-2">
              <lucide-icon [img]="PackageIcon" class="w-4 h-4"></lucide-icon> Livrables ({{ periodLabel() }})
            </div>
          </div>
          <div card-content class="h-60 flex items-center overflow-hidden">
            <div class="w-1/2 h-full flex items-center justify-center p-2">
              <canvas #pieChartCanvas></canvas>
            </div>
            <div class="w-1/2 space-y-2 pr-2">
              <div class="flex items-center gap-2 text-xs">
                <lucide-icon [img]="CheckCircle2Icon" class="w-4 h-4 text-green-600"></lucide-icon>
                <span class="flex-1">Atteints</span>
                <app-badge variant="success" class="text-xs">{{ periodData().delStats.completed }}</app-badge>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <lucide-icon [img]="ClockIcon" class="w-4 h-4 text-amber-600"></lucide-icon>
                <span class="flex-1">En cours</span>
                <app-badge variant="warning" class="text-xs">{{ periodData().delStats.inProgress }}</app-badge>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <lucide-icon [img]="AlertTriangleIcon" class="w-4 h-4 text-red-600"></lucide-icon>
                <span class="flex-1">En retard</span>
                <app-badge variant="destructive" class="text-xs">{{ periodData().delStats.delayed }}</app-badge>
              </div>
            </div>
          </div>
        </app-card>
      </div>

      <!-- Activities Table -->
      <app-card>
        <div card-header class="py-2">
          <div card-title class="text-sm flex items-center justify-between">
            <span class="flex items-center gap-2">
              <lucide-icon [img]="CalendarIcon" class="w-4 h-4"></lucide-icon> Exécution des activités - {{ periodLabel() }}
            </span>
            <app-badge variant="outline" class="text-xs">
              {{ periodData().activitiesData.length }} activités • {{ formatBudget(periodData().totalPlan) }} prévu
            </app-badge>
          </div>
        </div>
        <div card-content class="pt-0 p-2">
          <div class="overflow-x-auto border rounded-md">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b bg-muted/50">
                  <th class="text-left py-2 px-2 font-medium">Activité</th>
                  <th class="text-left py-2 px-1 font-medium">Nature</th>
                  <th class="text-right py-2 px-2 font-medium">Budget prévu</th>
                  <th class="text-right py-2 px-2 font-medium">Budget réalisé</th>
                  <th class="text-center py-2 px-2 font-medium">Taux</th>
                  <th class="text-center py-2 px-2 font-medium">Livrables</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let proj of periodData().byProject">
                  <!-- Project Header Row -->
                  <tr class="bg-primary/5 font-semibold">
                    <td class="py-1.5 px-2 text-primary" colspan="3">
                      {{ proj.name.length > 60 ? proj.name.substring(0, 60) + '...' : proj.name }}
                    </td>
                    <td class="py-1.5 px-2 text-right font-bold">{{ formatBudget(proj.real) }}</td>
                    <td class="py-1.5 px-2 text-center">
                      <app-badge [variant]="getBadgeVariant(getPerc(proj.real, proj.plan))" class="text-[10px]">
                        {{ getPerc(proj.real, proj.plan) }}%
                      </app-badge>
                    </td>
                    <td class="py-1.5 px-2 text-center text-muted-foreground font-normal">
                      {{ getProjDelCount(proj.activities) }}
                    </td>
                  </tr>
                  <!-- Activities Rows (limited to 6 as in React) -->
                  <tr *ngFor="let act of proj.activities.slice(0, 6)" class="border-b last:border-0 hover:bg-muted/30">
                    <td class="py-1.5 px-2 pl-6 text-muted-foreground">
                      {{ act.name.length > 50 ? act.name.substring(0, 50) + '...' : act.name }}
                    </td>
                    <td class="py-1.5 px-1">
                      <app-badge variant="outline" class="text-[9px] font-normal opacity-80">{{ act.nature }}</app-badge>
                    </td>
                    <td class="py-1.5 px-2 text-right opacity-80">{{ formatBudget(act.planValue) }}</td>
                    <td class="py-1.5 px-2 text-right font-medium">{{ formatBudget(act.realValue) }}</td>
                    <td class="py-1.5 px-2 text-center">
                      <app-badge [variant]="getBadgeVariant(getPerc(act.realValue, act.planValue))" class="text-[10px] scale-90">
                        {{ getPerc(act.realValue, act.planValue) }}%
                      </app-badge>
                    </td>
                    <td class="py-1.5 px-2 text-center text-muted-foreground">
                      {{ act.deliverables.length > 0 ? act.deliverables.length : '-' }}
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>
      </app-card>

      <!-- Deliverables Table -->
      <app-card>
        <div card-header class="py-2">
          <div card-title class="text-sm flex items-center justify-between">
            <span class="flex items-center gap-2">
              <lucide-icon [img]="PackageIcon" class="w-4 h-4"></lucide-icon> Exécution des livrables - {{ periodLabel() }}
            </span>
            <app-badge variant="outline" class="text-xs">
              {{ periodData().delStats.total }} livrables • {{ periodData().delStats.completed }} atteints
            </app-badge>
          </div>
        </div>
        <div card-content class="pt-0 p-2">
          <div class="overflow-x-auto border rounded-md">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b bg-muted/50">
                  <th class="text-left py-2 px-2 font-medium">Livrable</th>
                  <th class="text-left py-2 px-1 font-medium">Activité</th>
                  <th class="text-center py-2 px-1 font-medium">Unité</th>
                  <th class="text-right py-2 px-2 font-medium">Cible</th>
                  <th class="text-right py-2 px-2 font-medium">Réalisé</th>
                  <th class="text-center py-2 px-2 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let group of periodData().delByProject.slice(0, 5)">
                  <tr class="bg-primary/5 font-semibold">
                    <td class="py-1.5 px-2 text-primary" colspan="6">
                      {{ group.projectName.length > 60 ? group.projectName.substring(0, 60) + '...' : group.projectName }}
                      <app-badge variant="outline" class="ml-2 text-[10px] font-normal">{{ group.deliverables.length }} livrables</app-badge>
                    </td>
                  </tr>
                  <tr *ngFor="let d of group.deliverables.slice(0, 5)" class="border-b last:border-0 hover:bg-muted/30">
                    <td class="py-1.5 px-2 pl-6">
                      {{ d.unit || 'Livrable' }}
                    </td>
                    <td class="py-1.5 px-1 text-muted-foreground truncate max-w-[150px]">
                      {{ d.activityName }}
                    </td>
                    <td class="py-1.5 px-1 text-center text-muted-foreground">{{ d.unit || '-' }}</td>
                    <td class="py-1.5 px-2 text-right">{{ d.target | number:'1.0-0':'fr-FR' }}</td>
                    <td class="py-1.5 px-2 text-right font-bold text-primary">{{ d.realized | number:'1.0-0':'fr-FR' }}</td>
                    <td class="py-1.5 px-2 text-center">
                      <app-badge [variant]="getBadgeVariant(getPerc(d.realized, d.target))" class="text-[10px]">
                        {{ getPerc(d.realized, d.target) }}%
                      </app-badge>
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class PtaDashboardTabComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) pta!: PTA;
  @Input({ required: true }) selectedPeriod: string = 'annuel';
  @Input() selectedProjectId: string = 'all';
  @Input() selectedServiceId: string = 'all';
  @Input() selectedOperationId: string = 'all';

  @ViewChild('natureChartCanvas') natureChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  private natureChart: Chart | undefined;
  private pieChart: Chart | undefined;

  readonly CalendarIcon = Calendar;
  readonly WalletIcon = Wallet;
  readonly TrendingUpIcon = TrendingUp;
  readonly TargetIcon = Target;
  readonly ActivityIcon = Activity;
  readonly PackageIcon = Package;
  readonly BarChart3Icon = BarChart3;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly ClockIcon = Clock;
  readonly DownloadIcon = Download;
  readonly FileSpreadsheetIcon = FileSpreadsheet;

  cn = cn;

  ngAfterViewInit() {
    this.initCharts();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['pta'] || changes['selectedPeriod'] || changes['selectedProjectId']) && this.natureChart) {
      this.updateCharts();
    }
  }

  private initCharts() {
    this.updateCharts();
  }

  private updateCharts() {
    if (this.natureChart) this.natureChart.destroy();
    if (this.pieChart) this.pieChart.destroy();

    const natureCtx = this.natureChartCanvas.nativeElement.getContext('2d');
    const pieCtx = this.pieChartCanvas.nativeElement.getContext('2d');

    if (natureCtx) {
      const data = this.periodData().byNature;
      this.natureChart = new Chart(natureCtx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.name),
          datasets: [
            { data: data.map(d => d.plan), label: 'Prévu', backgroundColor: '#3b82f6', borderRadius: 2, barThickness: 8 },
            { data: data.map(d => d.real), label: 'Réalisé', backgroundColor: '#10b981', borderRadius: 2, barThickness: 8 }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
          },
          scales: {
            x: { ticks: { font: { size: 9 }, callback: (v) => this.formatBudget(Number(v)) }, grid: { display: false } },
            y: { ticks: { font: { size: 9 } }, grid: { display: false } }
          }
        }
      });
    }

    if (pieCtx) {
      const stats = this.periodData().delStats;
      this.pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: ['Atteints', 'En cours', 'En retard'],
          datasets: [{
            data: [stats.completed, stats.inProgress, stats.delayed],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  periodLabel = computed(() => {
    return this.selectedPeriod === 'annuel'
      ? `Année ${this.pta.year}`
      : `${this.selectedPeriod} ${this.pta.year}`;
  });

  periodData = computed(() => {
    const isAnnual = this.selectedPeriod === 'annuel' || this.selectedPeriod === 'cumul';
    const selectedQ = this.selectedPeriod as 'T1' | 'T2' | 'T3' | 'T4';

    // Filter activities by project handled by dashboard level but double checking here
    const filteredActivities = this.pta.activities
      .filter(a => this.selectedProjectId === 'all' || a.projectId === this.selectedProjectId)
      .filter(a => this.selectedServiceId === 'all' || a.serviceResponsableId === this.selectedServiceId)
      .filter(a => this.selectedOperationId === 'all' || a.operationId === this.selectedOperationId);

    // Simulation logic matching React
    const getRealized = (planned: number, qIndex: number) => {
      const rates = [0.85, 0.75, 0.65, 0.45];
      return Math.round(planned * (rates[qIndex] + (Math.random() * 0.2)));
    };

    const activitiesData = filteredActivities.map(act => {
      const budgets = {
        T1: { plan: act.budgetT1, real: getRealized(act.budgetT1, 0) },
        T2: { plan: act.budgetT2, real: getRealized(act.budgetT2, 1) },
        T3: { plan: act.budgetT3, real: getRealized(act.budgetT3, 2) },
        T4: { plan: act.budgetT4, real: getRealized(act.budgetT4, 3) },
      };

      if (isAnnual) {
        const totalPlan = act.budgetTotal;
        const totalReal = budgets.T1.real + budgets.T2.real + budgets.T3.real + budgets.T4.real;
        return { ...act, planValue: totalPlan, realValue: totalReal, budgets };
      } else {
        const q = (budgets as any)[selectedQ] || { plan: 0, real: 0 };
        return { ...act, planValue: q.plan, realValue: q.real, budgets };
      }
    });

    const totalPlan = activitiesData.reduce((sum, a) => sum + a.planValue, 0);
    const totalReal = activitiesData.reduce((sum, a) => sum + a.realValue, 0);
    const executionRate = totalPlan > 0 ? Math.round((totalReal / totalPlan) * 100) : 0;

    // By Nature
    const natureMap: Record<string, { plan: number; real: number; count: number }> = {};
    activitiesData.forEach(a => {
      const nature = a.nature || 'Autre';
      if (!natureMap[nature]) natureMap[nature] = { plan: 0, real: 0, count: 0 };
      natureMap[nature].plan += a.planValue;
      natureMap[nature].real += a.realValue;
      natureMap[nature].count++;
    });

    const byNature = Object.entries(natureMap).map(([name, data]) => ({
      name,
      plan: data.plan,
      real: data.real,
      count: data.count,
      rate: totalPlan > 0 ? Math.round((data.real / data.plan) * 100) : 0
    }));

    // By Project (for Table)
    const projectMap: Record<string, { name: string; plan: number; real: number; activities: any[] }> = {};
    activitiesData.forEach(a => {
      if (!projectMap[a.project]) {
        projectMap[a.project] = { name: a.project, plan: 0, real: 0, activities: [] };
      }
      projectMap[a.project].plan += a.planValue;
      projectMap[a.project].real += a.realValue;
      projectMap[a.project].activities.push(a);
    });

    // Deliverables
    const deliverables = activitiesData.flatMap(act => {
      return act.deliverables.map(d => {
        const targetPerQ = Math.ceil(d.targetValue / 4);
        const quarterTargets = { T1: targetPerQ, T2: targetPerQ, T3: targetPerQ, T4: d.targetValue - (targetPerQ * 3) };
        const quarterRealized = {
          T1: Math.round(quarterTargets.T1 * (0.7 + Math.random() * 0.4)),
          T2: Math.round(quarterTargets.T2 * (0.6 + Math.random() * 0.4)),
          T3: Math.round(quarterTargets.T3 * (0.5 + Math.random() * 0.4)),
          T4: Math.round(quarterTargets.T4 * (0.4 + Math.random() * 0.4)),
        };

        if (isAnnual) {
          const totalRealized = quarterRealized.T1 + quarterRealized.T2 + quarterRealized.T3 + quarterRealized.T4;
          return { ...d, activityName: act.name, project: act.project, target: d.targetValue, realized: totalRealized };
        } else {
          return { ...d, activityName: act.name, project: act.project, target: (quarterTargets as any)[selectedQ] || 0, realized: (quarterRealized as any)[selectedQ] || 0 };
        }
      });
    });

    const delCompleted = deliverables.filter(d => d.target > 0 && (d.realized / d.target) >= 1).length;
    const delInProgress = deliverables.filter(d => d.target > 0 && (d.realized / d.target) >= 0.5 && (d.realized / d.target) < 1).length;
    const delDelayed = deliverables.filter(d => d.target > 0 && (d.realized / d.target) < 0.5).length;

    // Group deliverables by project for table
    const delGroupMap: Record<string, { projectName: string; deliverables: any[] }> = {};
    deliverables.forEach(d => {
      if (!delGroupMap[d.project]) delGroupMap[d.project] = { projectName: d.project, deliverables: [] };
      delGroupMap[d.project].deliverables.push(d);
    });

    return {
      activitiesData,
      totalPlan,
      totalReal,
      executionRate,
      byNature,
      byProject: Object.values(projectMap).sort((a, b) => b.plan - a.plan),
      delStats: { completed: delCompleted, inProgress: delInProgress, delayed: delDelayed, total: deliverables.length },
      delByProject: Object.values(delGroupMap)
    };
  });

  // Helper methods
  formatBudget(amount: number): string {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
    return amount.toLocaleString('fr-FR');
  }

  getBadgeVariant(perc: number): 'success' | 'warning' | 'destructive' | 'secondary' | 'default' | 'outline' {
    if (perc >= 90) return 'success';
    if (perc >= 70) return 'warning';
    return 'destructive';
  }

  getPerc(real: number, plan: number): number {
    return plan > 0 ? Math.round((real / plan) * 100) : 0;
  }

  getProjDelCount(activities: any[]): number {
    return activities.reduce((sum, a) => sum + (a.deliverables?.length || 0), 0);
  }
}
