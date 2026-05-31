import { Component, Input, OnInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp } from 'lucide-angular';
import Chart from 'chart.js/auto';
import { Project } from '../../../models/project.model';

@Component({
    selector: 'app-comparison-chart',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div class="p-6 pb-2">
        <h3 class="text-sm font-semibold flex items-center gap-2">
          <lucide-icon [img]="TrendingUpIcon" class="w-4 h-4"></lucide-icon>
          Comparaison avancement par projet
        </h3>
      </div>
      <div class="p-6 pt-0">
        <div class="relative h-[300px]">
          <canvas #chartCanvas></canvas>
        </div>
      </div>
    </div>
  `
})
export class ComparisonChartComponent implements OnInit, OnChanges {
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
    @Input() projects: Project[] = [];

    readonly TrendingUpIcon = TrendingUp;

    private chart: Chart | undefined;

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['projects'] && this.chartCanvas) {
            this.updateChart();
        }
    }

    ngAfterViewInit() {
        this.updateChart();
    }

    private updateChart() {
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        // Prepare data (max 10 projects for readability)
        const displayProjects = this.projects.slice(0, 10);
        const labels = displayProjects.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name);

        // In a real app, these values would come from computations in the parent
        // Here we'll compute some mocks or basic versions for the visual
        const delaiConsomme = displayProjects.map(p => {
            const start = new Date(p.startDate).getTime();
            const end = new Date(p.endDate).getTime();
            const now = new Date().getTime();
            if (now >= end) return 100;
            if (now <= start) return 0;
            return Math.round(((now - start) / (end - start)) * 100);
        });

        const avancActivites = displayProjects.map(p => {
            if (!p.activities || p.activities.length === 0) return p.progress;
            return Math.round(p.activities.reduce((s, a) => s + a.progress, 0) / p.activities.length);
        });

        const execBudget = displayProjects.map(p => {
            if (!p.budgetFCFA || p.budgetFCFA === 0) return 0;
            return Math.round(((p.spent || 0) / p.budgetFCFA) * 100);
        });

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Délai consommé',
                        data: delaiConsomme,
                        backgroundColor: '#f59e0b',
                        borderRadius: 2,
                        barThickness: 6,
                    },
                    {
                        label: 'Avanc. activités',
                        data: avancActivites,
                        backgroundColor: '#10b981',
                        borderRadius: 2,
                        barThickness: 6,
                    },
                    {
                        label: 'Exéc. budget',
                        data: execBudget,
                        backgroundColor: '#3b82f6',
                        borderRadius: 2,
                        barThickness: 6,
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 8,
                            usePointStyle: true,
                            pointStyle: 'rect',
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            display: true,
                            drawOnChartArea: true,
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            callback: (value) => value + '%',
                            font: { size: 10 }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }
}
