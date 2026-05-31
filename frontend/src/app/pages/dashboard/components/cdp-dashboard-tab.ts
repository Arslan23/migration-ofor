import { Component, Input, computed, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Target, TrendingUp, Activity, CheckCircle2, AlertTriangle, Clock, Download, FileSpreadsheet, ChevronDown, ChevronRight, BarChart3, PieChart } from 'lucide-angular';
import Chart from 'chart.js/auto';
import { CDP, CDPEvaluationAnnuelle, CDPCategorie, CDPComposante, CDPFicheSuiviIndicateur } from '../../../models/cdp.model';
import { BadgeComponent } from '../../../shared/ui/badge';
import { CARD_COMPONENTS } from '../../../shared/ui/card';
import { ButtonComponent } from '../../../shared/ui/button';
import { ProgressComponent } from '../../../shared/ui/progress';
import { ACCORDION_COMPONENTS } from '../../../shared/ui/accordion';
import { cn } from '../../../lib/utils';

@Component({
    selector: 'app-cdp-dashboard-tab',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule,
        BadgeComponent,
        ...CARD_COMPONENTS,
        ButtonComponent,
        ProgressComponent,
        ...ACCORDION_COMPONENTS
    ],
    templateUrl: './cdp-dashboard-tab.html',
    styles: [`
    :host { display: block; }
  `]
})
export class CdpDashboardTabComponent implements AfterViewInit, OnChanges {
    @Input({ required: true }) cdp!: CDP;
    @Input({ required: true }) evaluationYear: string = '2024';
    @Input() selectedCategoryId: string = 'all';
    @Input() selectedComponentId: string = 'all';
    @Input({ required: true }) evaluations: CDPEvaluationAnnuelle[] = [];
    @Input({ required: true }) categories: CDPCategorie[] = [];
    @Input({ required: true }) composantes: CDPComposante[] = [];
    @Input({ required: true }) fichesSuivi: CDPFicheSuiviIndicateur[] = [];

    @ViewChild('radarChartCanvas') radarChartCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;

    private radarChart: Chart | undefined;
    private pieChart: Chart | undefined;

    // Icons
    readonly TargetIcon = Target;
    readonly TrendingUpIcon = TrendingUp;
    readonly ActivityIcon = Activity;
    readonly CheckCircle2Icon = CheckCircle2;
    readonly AlertTriangleIcon = AlertTriangle;
    readonly ClockIcon = Clock;
    readonly DownloadIcon = Download;
    readonly FileSpreadsheetIcon = FileSpreadsheet;
    readonly ChevronDownIcon = ChevronDown;
    readonly ChevronRightIcon = ChevronRight;
    readonly BarChartIcon = BarChart3;
    readonly PieChartIcon = PieChart;

    cn = cn;

    ngAfterViewInit() {
        this.initCharts();
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((changes['evaluationYear'] || changes['fichesSuivi'] || changes['cdp'] || changes['selectedCategoryId'] || changes['selectedComponentId']) && this.radarChart) {
            this.updateCharts();
        }
    }

    private initCharts() {
        this.updateCharts();
    }

    private updateCharts() {
        if (this.radarChart) this.radarChart.destroy();
        if (this.pieChart) this.pieChart.destroy();

        const radarCtx = this.radarChartCanvas.nativeElement.getContext('2d');
        const pieCtx = this.pieChartCanvas.nativeElement.getContext('2d');

        if (radarCtx) {
            const data = this.performanceByCategory();
            this.radarChart = new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        label: 'Performance %',
                        data: data.map(d => d.performance),
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { display: false, stepSize: 20 },
                            pointLabels: { font: { size: 9 } },
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        }
                    }
                }
            });
        }

        if (pieCtx) {
            const stats = this.indicatorStats();
            this.pieChart = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Atteints', 'En progression', 'En retard'],
                    datasets: [{
                        data: [stats.atteints, stats.enProgres, stats.enRetard],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0,
                        // @ts-ignore - Chart.js type mismatch for cutout
                        cutout: '60%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 10,
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }
    }

    pieChartTitle = computed(() => `Répartition des indicateurs - ${this.evaluationYear}`);

    periodLabel = computed(() => `Année ${this.evaluationYear}`);

    indicatorStats = computed(() => {
        const fiches = this.fichesSuivi.filter(f => f.currentValue !== undefined);
        const total = this.fichesSuivi.length;

        return {
            total,
            fichesWithData: fiches.length,
            atteints: fiches.filter(f => (f.performanceRate || 0) >= 100).length,
            enProgres: fiches.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length,
            enRetard: fiches.filter(f => (f.performanceRate || 0) < 80).length,
            avgPerformance: fiches.length > 0
                ? Math.round(fiches.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / fiches.length)
                : 0
        };
    });

    performanceByCategory = computed(() => {
        return this.categories.map(cat => {
            const catFiches = this.fichesSuivi.filter(f => f.composanteId && this.composantes.find(c => c.id === f.composanteId)?.categorieId === cat.id);
            const avgPerf = catFiches.length > 0
                ? Math.round(catFiches.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / catFiches.length)
                : 0;
            return { name: cat.name, performance: avgPerf };
        });
    });

    groupedPerformance = computed(() => {
        let cats = this.categories;
        if (this.selectedCategoryId !== 'all') {
            cats = cats.filter(c => c.id === this.selectedCategoryId);
        }

        return cats.map(cat => {
            let comps = this.composantes.filter(c => c.categorieId === cat.id);
            if (this.selectedComponentId !== 'all') {
                comps = comps.filter(c => c.id === this.selectedComponentId);
            }

            const catFiches = this.fichesSuivi.filter(f =>
                f.composanteId && this.composantes.find(c => c.id === f.composanteId)?.categorieId === cat.id
            );
            const catFichesWithData = catFiches.filter(f => f.currentValue !== undefined);

            const catAtteints = catFichesWithData.filter(f => (f.performanceRate || 0) >= 100).length;
            const catEnRetard = catFichesWithData.filter(f => (f.performanceRate || 0) < 80).length;
            const catPerf = catFichesWithData.length > 0
                ? Math.round(catFichesWithData.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / catFichesWithData.length)
                : 0;

            const compData = comps.map(comp => {
                const indicators = this.fichesSuivi.filter(f => f.composanteId === comp.id);
                const indicatorsWithData = indicators.filter(f => f.currentValue !== undefined);
                const avgPerf = indicatorsWithData.length > 0
                    ? Math.round(indicatorsWithData.reduce((sum, f) => sum + (f.performanceRate || 0), 0) / indicatorsWithData.length)
                    : 0;
                return { ...comp, indicators, performance: avgPerf };
            }).filter(c => c.indicators.length > 0);

            return {
                ...cat,
                components: compData,
                performance: catPerf,
                atteints: catAtteints,
                enRetard: catEnRetard,
                totalIndicators: catFiches.length
            };
        }).filter(cat => cat.components.length > 0);
    });

    getBadgeVariant(perc: number): 'success' | 'warning' | 'destructive' | 'secondary' {
        if (perc >= 100) return 'success';
        if (perc >= 80) return 'warning';
        return 'destructive';
    }

    getPerfColor(perc: number): string {
        if (perc >= 100) return 'text-green-600';
        if (perc >= 80) return 'text-amber-600';
        return 'text-red-600';
    }

    getPerfBg(perc: number): string {
        if (perc >= 100) return 'bg-green-100 dark:bg-green-900/30';
        if (perc >= 80) return 'bg-amber-100 dark:bg-amber-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    }
}
