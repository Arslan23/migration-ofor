import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Project } from '../../../models/project.model';
import { BadgeComponent } from '../../../shared/ui/badge';

@Component({
  selector: 'app-budget-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, BadgeComponent],
  templateUrl: './budget-chart.html',
  styleUrl: './budget-chart.scss'
})
export class BudgetChartComponent implements OnChanges {
  @Input() projects: Project[] = [];
  @Input() filterProjectId: string = 'all';

  public chartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        "hsl(204, 100%, 35%)",
        "hsl(82, 100%, 36%)",
        "hsl(204, 70%, 50%)",
        "hsl(82, 70%, 50%)",
        "hsl(45, 100%, 50%)",
        "hsl(280, 70%, 50%)",
      ]
    }]
  };

  public chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 10
          },
          boxWidth: 10
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed as number;
            const dataset = context.dataset;
            const total = (dataset.data as number[]).reduce((acc, cur) => acc + cur, 0);
            const percentage = Math.round((value / total) * 100) + '%';
            return `${label}: ${percentage}`;
          }
        }
      }
    }
  };

  totalBudget = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['projects'] || changes['filterProjectId']) {
      this.updateChartData();
    }
  }

  private updateChartData() {
    const filteredProjects = this.filterProjectId === 'all'
      ? this.projects
      : this.projects.filter(p => p.id === this.filterProjectId);

    const categoryMap: Record<string, number> = {};

    filteredProjects.forEach(project => {
      project.activities?.forEach(activity => {
        const nature = activity.nature || "Autres";
        categoryMap[nature] = (categoryMap[nature] || 0) + (activity.budget || 0);
      });
    });

    this.totalBudget = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    this.chartData = {
      ...this.chartData,
      labels,
      datasets: [{
        ...this.chartData.datasets[0],
        data
      }]
    };
  }

  formatBudget(amount: number): string {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} Mds`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} M`;
    }
    return amount.toLocaleString("fr-FR");
  }
}
