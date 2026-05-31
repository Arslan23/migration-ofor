import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-project-status-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="bg-card rounded-xl border border-border p-4 h-full flex flex-col">
      <div class="mb-2">
        <h3 class="font-heading font-semibold text-base">État des projets</h3>
        <p class="text-xs text-muted-foreground">Répartition par statut</p>
      </div>

      <div class="flex-1 min-h-[200px] relative">
        <div *ngIf="projects.length === 0" class="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          Aucune donnée disponible
        </div>
        <canvas baseChart
          [data]="chartData"
          [options]="chartOptions"
          [type]="'doughnut'">
        </canvas>
      </div>
      
      <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
         <div *ngFor="let item of statusCounts" class="flex items-center justify-between">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" [style.background-color]="item.color"></span>
              {{ item.label }}
            </span>
            <span class="font-medium">{{ item.count }}</span>
         </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class ProjectStatusChartComponent implements OnChanges {
  @Input() projects: Project[] = [];

  statusCounts: { label: string, count: number, color: string }[] = [];

  public chartData: ChartData<'doughnut', number[], string | string[]> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  };

  public chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100) + '%';
            return `${label}: ${percentage} (${value})`;
          }
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['projects']) {
      this.updateChartData();
    }
  }

  private updateChartData() {
    const counts: Record<string, number> = {
      en_cours: 0,
      termine: 0,
      retard: 0,
      planifie: 0
    };

    this.projects.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      } else {
        // Fallback or log
      }
    });

    this.statusCounts = [
      { label: 'En cours', count: counts['en_cours'], color: '#3b82f6' }, // blue-500
      { label: 'Terminé', count: counts['termine'], color: '#10b981' }, // emerald-500
      { label: 'En retard', count: counts['retard'], color: '#ef4444' }, // red-500
      { label: 'Planifié', count: counts['planifie'], color: '#94a3b8' }, // slate-400
    ].filter(s => s.count > 0);

    this.chartData = {
      labels: this.statusCounts.map(s => s.label),
      datasets: [{
        data: this.statusCounts.map(s => s.count),
        backgroundColor: this.statusCounts.map(s => s.color),
        borderWidth: 0
      }]
    };
  }
}
