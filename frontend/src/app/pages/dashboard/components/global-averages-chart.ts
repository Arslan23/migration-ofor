import { Component, Input, OnInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Target } from 'lucide-angular';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-global-averages-chart',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="rounded-xl border bg-card text-card-foreground shadow-sm h-full">
      <div class="p-6 pb-2">
        <h3 class="text-sm font-semibold flex items-center gap-2">
          <lucide-icon [img]="TargetIcon" class="w-4 h-4"></lucide-icon>
          Moyennes globales
        </h3>
      </div>
      <div class="p-6 pt-0 flex flex-col items-center justify-center h-[300px]">
        <div class="relative w-full h-full">
          <canvas #chartCanvas></canvas>
        </div>
      </div>
    </div>
  `
})
export class GlobalAveragesChartComponent implements OnInit, OnChanges {
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    @Input() data: {
        delay: number;
        budget: number;
        activities: number;
        deliverables: number;
    } = { delay: 0, budget: 0, activities: 0, deliverables: 0 };

    readonly TargetIcon = Target;

    private chart: Chart | undefined;

    ngOnInit() { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data'] && this.chartCanvas) {
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

        // Radial Bar chart with Chart.js is basically a Doughnut with multiple datasets
        // or a single dataset with weight. We'll use 4 rings.

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Délai consommé', 'Exéc. budget', 'Avanc. activités', 'Avanc. livrables'],
                datasets: [
                    {
                        data: [this.data.delay, 100 - this.data.delay],
                        backgroundColor: ['#f59e0b', 'transparent'],
                        borderWidth: 0,
                        circumference: 180,
                        rotation: 270,
                        weight: 0.5,
                    },
                    {
                        data: [this.data.budget, 100 - this.data.budget],
                        backgroundColor: ['#3b82f6', 'transparent'],
                        borderWidth: 0,
                        circumference: 180,
                        rotation: 270,
                        weight: 0.5,
                    },
                    {
                        data: [this.data.activities, 100 - this.data.activities],
                        backgroundColor: ['#10b981', 'transparent'],
                        borderWidth: 0,
                        circumference: 180,
                        rotation: 270,
                        weight: 0.5,
                    },
                    {
                        data: [this.data.deliverables, 100 - this.data.deliverables],
                        backgroundColor: ['#8b5cf6', 'transparent'],
                        borderWidth: 0,
                        circumference: 180,
                        rotation: 270,
                        weight: 0.5,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '20%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 8,
                            usePointStyle: true,
                            pointStyle: 'rect',
                            font: { size: 10 },
                            filter: (item) => !item.text.includes('undefined') && item.fillStyle !== 'transparent'
                        }
                    },
                    tooltip: {
                        filter: (item) => item.dataIndex === 0,
                        callbacks: {
                            label: (context) => `${context.label}: ${context.raw}%`
                        }
                    }
                }
            }
        });
    }
}
