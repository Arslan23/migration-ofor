import { Component, OnInit, signal, computed, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FolderKanban, Wallet, TrendingUp, BarChart3, Package, Award, Filter, Eye, X } from 'lucide-angular';
import { SelectComponent, SelectTriggerComponent, SelectValueComponent, SelectContentComponent, SelectItemComponent } from '../../../shared/ui/select';
import { ProjectService } from '../../../services/project.service';
import { Project, REGIONS, BAILLEURS } from '../../../models/project.model';
import { mockServices, getServiceById } from '../../../data/entites-execution.data';
import Chart from 'chart.js/auto';

type Dimension = 'region' | 'bailleur' | 'service' | 'nature';

interface UnitBreakdown { target: number; produced: number; }
interface NatureBreakdown { budgetPlanned: number; budgetExecuted: number; livrablesProduits: number; activitiesCount: number; }

interface YearRow {
  year: string; budgetPlanned: number; budgetExecuted: number; projectsActive: number;
  deliverablesTarget: number; deliverablesProduced: number; activitiesCount: number; activitiesDone: number;
  tauxBudget: number; tauxLivrables: number;
  byUnit: Record<string, UnitBreakdown>; byNature: Record<string, NatureBreakdown>;
}

interface DimRow {
  name: string; budgetPlanned: number; budgetExecuted: number; livrablesProduits: number;
  projets: number; tauxExecution: number;
  byUnit: Record<string, UnitBreakdown>; byNature: Record<string, NatureBreakdown>;
}

interface ComputedData {
  yearly: YearRow[]; totals: any; byDimension: DimRow[];
  statusCount: Record<string, number>; filteredCount: number; units: string[];
}

const formatMontant = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const formatShort = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} Mds`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} M`;
  return formatMontant(n);
};
const deliverableLabel = (d: any) => d?.name || d?.uniteMesure?.name || d?.unit || 'Livrable';

@Component({
  selector: 'app-global-ofor-tab',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucideAngularModule,
    SelectComponent, SelectTriggerComponent, SelectValueComponent, SelectContentComponent, SelectItemComponent,
  ],
  templateUrl: './global-ofor-tab.html',
})
export class GlobalOforTabComponent implements AfterViewInit {
  @ViewChild('budgetChart') budgetChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('livrablesChart') livrablesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dimChart') dimChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;

  private budgetChartInstance?: Chart;
  private livrablesChartInstance?: Chart;
  private dimChartInstance?: Chart;
  private statusChartInstance?: Chart;

  readonly icons = { FolderKanban, Wallet, TrendingUp, BarChart3, Package, Award, Filter, Eye, X };
  readonly formatMontant = formatMontant;
  readonly formatShort = formatShort;
  readonly Math = Math;
  readonly Object = Object;

  projects = signal<Project[]>([]);
  dimension = signal<Dimension>('region');
  yearFrom = signal('2022');
  yearTo = signal('2026');
  regionFilter = signal('all');
  bailleurFilter = signal('all');
  serviceFilter = signal('all');
  deliverableFilter = signal('all');

  detail = signal<{ kind: 'year' | 'dim'; key: string } | null>(null);

  readonly yearOptions = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027'];
  readonly regions = REGIONS.filter(r => r !== 'National');
  readonly bailleurs = BAILLEURS;
  readonly services = mockServices.filter(s => s.actif);

  data = computed<ComputedData>(() => {
    const yFrom = parseInt(this.yearFrom());
    const yTo = parseInt(this.yearTo());
    const years: number[] = [];
    for (let y = yFrom; y <= yTo; y++) years.push(y);
    const allProjects = this.projects();
    const filtered = allProjects.filter(p => {
      if (this.regionFilter() !== 'all' && p.region !== this.regionFilter()) return false;
      if (this.bailleurFilter() !== 'all' && p.bailleur !== this.bailleurFilter()) return false;
      return true;
    });
    const unitsSet = new Set<string>();
    const yearly: YearRow[] = years.map(year => {
      let budgetPlanned = 0, budgetExecuted = 0, projectsActive = 0;
      let deliverablesTarget = 0, deliverablesProduced = 0, activitiesCount = 0, activitiesDone = 0;
      const byUnit: Record<string, UnitBreakdown> = {};
      const byNature: Record<string, NatureBreakdown> = {};
      filtered.forEach(p => {
        const ps = new Date(p.startDate).getFullYear();
        const pe = new Date(p.endDate).getFullYear();
        if (year < ps || year > pe) return;
        const span = pe - ps + 1;
        projectsActive++;
        budgetPlanned += (p.budgetFCFA || 0) / span;
        budgetExecuted += (p.spent || 0) / span;
        p.activities?.forEach(a => {
          const as2 = new Date(a.startDate).getFullYear();
          const ae = new Date(a.endDate).getFullYear();
          if (year < as2 || year > ae) return;
          const sp = ae - as2 + 1;
          activitiesCount++;
          if (a.status === 'termine') activitiesDone++;
          const nature = a.nature || 'autre';
          if (!byNature[nature]) byNature[nature] = { budgetPlanned: 0, budgetExecuted: 0, livrablesProduits: 0, activitiesCount: 0 };
          byNature[nature].activitiesCount++;
          byNature[nature].budgetPlanned += (a.budget || 0) / sp;
          byNature[nature].budgetExecuted += ((a.budget || 0) * (a.progress || 70) / 100) / sp;
          a.deliverables?.forEach(d => {
            const label = deliverableLabel(d);
            unitsSet.add(label);
            const t = (d.targetValue || 0) / sp;
            const current = d.currentValue ?? (d.targetValue || 0) * 0.75;
            const c = current / sp;
            deliverablesTarget += t;
            deliverablesProduced += c;
            if (!byUnit[label]) byUnit[label] = { target: 0, produced: 0 };
            byUnit[label].target += t;
            byUnit[label].produced += c;
            byNature[nature].livrablesProduits += c;
          });
        });
      });
      const tauxBudget = budgetPlanned > 0 ? Math.round((budgetExecuted / budgetPlanned) * 100) : 0;
      const tauxLivrables = deliverablesTarget > 0 ? Math.round((deliverablesProduced / deliverablesTarget) * 100) : 0;
      return {
        year: year.toString(), budgetPlanned: Math.round(budgetPlanned), budgetExecuted: Math.round(budgetExecuted),
        projectsActive, deliverablesTarget: Math.round(deliverablesTarget), deliverablesProduced: Math.round(deliverablesProduced),
        activitiesCount, activitiesDone, tauxBudget, tauxLivrables, byUnit, byNature,
      };
    });
    const totals = yearly.reduce((acc, y) => ({
      budgetPlanned: acc.budgetPlanned + y.budgetPlanned, budgetExecuted: acc.budgetExecuted + y.budgetExecuted,
      deliverablesTarget: acc.deliverablesTarget + y.deliverablesTarget, deliverablesProduced: acc.deliverablesProduced + y.deliverablesProduced,
      activitiesCount: acc.activitiesCount + y.activitiesCount, activitiesDone: acc.activitiesDone + y.activitiesDone,
    }), { budgetPlanned: 0, budgetExecuted: 0, deliverablesTarget: 0, deliverablesProduced: 0, activitiesCount: 0, activitiesDone: 0 });
    const dim = this.dimension();
    const getDimKey = (p: Project): string => {
      if (dim === 'region') return p.region || 'Non défini';
      if (dim === 'bailleur') return p.bailleur || 'Non défini';
      return 'Tous';
    };
    const dimMap: Record<string, { budgetPlanned: number; budgetExecuted: number; livrablesProduits: number; projets: number; byUnit: Record<string, UnitBreakdown>; byNature: Record<string, NatureBreakdown> }> = {};
    const ensureDim = (key: string) => {
      if (!dimMap[key]) dimMap[key] = { budgetPlanned: 0, budgetExecuted: 0, livrablesProduits: 0, projets: 0, byUnit: {}, byNature: {} };
      return dimMap[key];
    };
    filtered.forEach(p => {
      const ps = new Date(p.startDate).getFullYear();
      const pe = new Date(p.endDate).getFullYear();
      const overlapFrom = Math.max(ps, yFrom);
      const overlapTo = Math.min(pe, yTo);
      if (overlapTo < overlapFrom) return;
      const overlap = overlapTo - overlapFrom + 1;
      const span = pe - ps + 1;
      if (dim === 'nature') {
        p.activities?.forEach(a => {
          const nature = a.nature || 'autre';
          const slot = ensureDim(nature);
          const as2 = new Date(a.startDate).getFullYear();
          const ae = new Date(a.endDate).getFullYear();
          const oFrom = Math.max(as2, yFrom);
          const oTo = Math.min(ae, yTo);
          if (oTo < oFrom) return;
          const aSpan = ae - as2 + 1;
          const aOverlap = oTo - oFrom + 1;
          slot.budgetPlanned += ((a.budget || 0) / aSpan) * aOverlap;
          slot.budgetExecuted += ((a.budget || 0) * (a.progress || 70) / 100 / aSpan) * aOverlap;
          a.deliverables?.forEach(d => {
            const label = deliverableLabel(d);
            const current = d.currentValue ?? (d.targetValue || 0) * 0.75;
            const c = (current / aSpan) * aOverlap;
            slot.livrablesProduits += c;
            if (!slot.byUnit[label]) slot.byUnit[label] = { target: 0, produced: 0 };
            slot.byUnit[label].target += ((d.targetValue || 0) / aSpan) * aOverlap;
            slot.byUnit[label].produced += c;
          });
        });
      } else {
        const key = getDimKey(p);
        const slot = ensureDim(key);
        slot.budgetPlanned += ((p.budgetFCFA || 0) / span) * overlap;
        slot.budgetExecuted += ((p.spent || 0) / span) * overlap;
        slot.projets += 1;
        p.activities?.forEach(a => {
          const nature = a.nature || 'autre';
          const as2 = new Date(a.startDate).getFullYear();
          const ae = new Date(a.endDate).getFullYear();
          const oFrom = Math.max(as2, yFrom);
          const oTo = Math.min(ae, yTo);
          if (oTo < oFrom) return;
          const aSpan = ae - as2 + 1;
          const aOverlap = oTo - oFrom + 1;
          if (!slot.byNature[nature]) slot.byNature[nature] = { budgetPlanned: 0, budgetExecuted: 0, livrablesProduits: 0, activitiesCount: 0 };
          slot.byNature[nature].activitiesCount++;
          slot.byNature[nature].budgetPlanned += ((a.budget || 0) / aSpan) * aOverlap;
          slot.byNature[nature].budgetExecuted += ((a.budget || 0) * (a.progress || 70) / 100 / aSpan) * aOverlap;
          a.deliverables?.forEach(d => {
            const label = deliverableLabel(d);
            const current = d.currentValue ?? (d.targetValue || 0) * 0.75;
            const c = (current / aSpan) * aOverlap;
            slot.livrablesProduits += c;
            if (!slot.byUnit[label]) slot.byUnit[label] = { target: 0, produced: 0 };
            slot.byUnit[label].target += ((d.targetValue || 0) / aSpan) * aOverlap;
            slot.byUnit[label].produced += c;
            slot.byNature[nature].livrablesProduits += c;
          });
        });
      }
    });
    const byDimension: DimRow[] = Object.entries(dimMap).map(([name, v]) => ({
      name, budgetPlanned: Math.round(v.budgetPlanned), budgetExecuted: Math.round(v.budgetExecuted),
      livrablesProduits: Math.round(v.livrablesProduits), projets: v.projets,
      tauxExecution: v.budgetPlanned > 0 ? Math.round((v.budgetExecuted / v.budgetPlanned) * 100) : 0,
      byUnit: v.byUnit, byNature: v.byNature,
    })).sort((a, b) => b.budgetExecuted - a.budgetExecuted);
    const statusCount: Record<string, number> = { en_cours: 0, termine: 0, retard: 0, planifie: 0 };
    filtered.forEach(p => {
      const ps = new Date(p.startDate).getFullYear();
      const pe = new Date(p.endDate).getFullYear();
      if (pe < yFrom || ps > yTo) return;
      statusCount[p.status] = (statusCount[p.status] || 0) + 1;
    });
    return { yearly, totals, byDimension, statusCount, filteredCount: filtered.length, units: Array.from(unitsSet).sort() };
  });

  tauxBudgetGlobal = computed(() => {
    const d = this.data();
    return d.totals.budgetPlanned > 0 ? Math.round((d.totals.budgetExecuted / d.totals.budgetPlanned) * 100) : 0;
  });

  tauxLivrablesGlobal = computed(() => {
    const d = this.data();
    return d.totals.deliverablesTarget > 0 ? Math.round((d.totals.deliverablesProduced / d.totals.deliverablesTarget) * 100) : 0;
  });

  dimLabel = computed(() => {
    const d = this.dimension();
    if (d === 'region') return 'Régions';
    if (d === 'bailleur') return 'Bailleurs';
    if (d === 'service') return 'Services';
    return "Natures d'activité";
  });

  dimColLabel = computed(() => {
    const d = this.dimension();
    if (d === 'region') return 'Région';
    if (d === 'bailleur') return 'Bailleur';
    if (d === 'service') return 'Service';
    return 'Nature';
  });

  detailData = computed(() => {
    const det = this.detail();
    if (!det) return null;
    const d = this.data();
    if (det.kind === 'year') {
      const row = d.yearly.find(y => y.year === det.key);
      if (!row) return null;
      return {
        title: `Synthèse — Année ${row.year}`, budgetPlanned: row.budgetPlanned, budgetExecuted: row.budgetExecuted,
        tauxBudget: row.tauxBudget, projets: row.projectsActive, activitiesCount: row.activitiesCount,
        activitiesDone: row.activitiesDone, byUnit: row.byUnit, yearly: null as any,
      };
    }
    const row = d.byDimension.find(r => r.name === det.key);
    if (!row) return null;
    return {
      title: `Synthèse — ${row.name}`, budgetPlanned: row.budgetPlanned, budgetExecuted: row.budgetExecuted,
      tauxBudget: row.tauxExecution, projets: row.projets,
      activitiesCount: Object.values(row.byNature).reduce((s, n) => s + n.activitiesCount, 0),
      activitiesDone: 0, byUnit: row.byUnit, yearly: null as any,
    };
  });

  constructor(private projectService: ProjectService) {
    effect(() => {
      this.data(); // track
      this.deliverableFilter(); // track
      setTimeout(() => this.renderCharts(), 50);
    });
  }

  ngAfterViewInit() {
    this.projectService.getProjects().subscribe(data => {
      this.projects.set(data);
    });
  }

  openDetail(kind: 'year' | 'dim', key: string) {
    this.detail.set({ kind, key });
  }

  closeDetail() {
    this.detail.set(null);
  }

  setDimension(value: string) {
    if (value === 'region' || value === 'bailleur' || value === 'service' || value === 'nature') {
      this.dimension.set(value);
    }
  }

  getUnitKeys(byUnit: Record<string, UnitBreakdown>): string[] {
    return Object.keys(byUnit || {});
  }

  private renderCharts() {
    const d = this.data();
    // Budget chart
    if (this.budgetChartRef?.nativeElement) {
      this.budgetChartInstance?.destroy();
      const ctx = this.budgetChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.budgetChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: d.yearly.map(y => y.year),
            datasets: [
              { label: 'Planifié', data: d.yearly.map(y => y.budgetPlanned), backgroundColor: '#94a3b8', borderRadius: 4 },
              { label: 'Exécuté', data: d.yearly.map(y => y.budgetExecuted), backgroundColor: '#10b981', borderRadius: 4 },
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 8, usePointStyle: true } },
              tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatMontant(c.raw as number)} FCFA` } } },
            scales: { y: { ticks: { callback: (v) => formatShort(v as number), font: { size: 10 } } }, x: { ticks: { font: { size: 11 } } } }
          }
        });
      }
    }
    // Livrables chart
    if (this.livrablesChartRef?.nativeElement) {
      this.livrablesChartInstance?.destroy();
      const ctx = this.livrablesChartRef.nativeElement.getContext('2d');
      const filter = this.deliverableFilter();
      const chartData = d.yearly.map(y => {
        if (filter === 'all') return { year: y.year, target: y.deliverablesTarget, produced: y.deliverablesProduced };
        const u = y.byUnit[filter];
        return { year: y.year, target: Math.round(u?.target || 0), produced: Math.round(u?.produced || 0) };
      });
      if (ctx) {
        this.livrablesChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartData.map(c => c.year),
            datasets: [
              { label: 'Cible', data: chartData.map(c => c.target), backgroundColor: '#cbd5e1', borderRadius: 4 },
              { label: 'Produit', data: chartData.map(c => c.produced), backgroundColor: '#8b5cf6', borderRadius: 4 },
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 8, usePointStyle: true } } },
            scales: { y: { ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 11 } } } }
          }
        });
      }
    }
    // Dimension chart (horizontal bar)
    if (this.dimChartRef?.nativeElement) {
      this.dimChartInstance?.destroy();
      const ctx = this.dimChartRef.nativeElement.getContext('2d');
      const sliced = d.byDimension.slice(0, 10);
      if (ctx) {
        this.dimChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: sliced.map(r => r.name.length > 20 ? r.name.substring(0, 20) + '...' : r.name),
            datasets: [
              { label: 'Planifié', data: sliced.map(r => r.budgetPlanned), backgroundColor: '#94a3b8' },
              { label: 'Exécuté', data: sliced.map(r => r.budgetExecuted), backgroundColor: '#3b82f6' },
            ]
          },
          options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 8, usePointStyle: true } },
              tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatMontant(c.raw as number)} FCFA` } } },
            scales: { x: { ticks: { callback: (v) => formatShort(v as number), font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } }
          }
        });
      }
    }
    // Status pie chart
    if (this.statusChartRef?.nativeElement) {
      this.statusChartInstance?.destroy();
      const ctx = this.statusChartRef.nativeElement.getContext('2d');
      const statusPie = [
        { name: 'Terminés', value: d.statusCount['termine'] || 0, color: '#10b981' },
        { name: 'En cours', value: d.statusCount['en_cours'] || 0, color: '#3b82f6' },
        { name: 'En retard', value: d.statusCount['retard'] || 0, color: '#ef4444' },
        { name: 'Planifiés', value: d.statusCount['planifie'] || 0, color: '#94a3b8' },
      ].filter(s => s.value > 0);
      if (ctx && statusPie.length > 0) {
        this.statusChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: statusPie.map(s => s.name),
            datasets: [{ data: statusPie.map(s => s.value), backgroundColor: statusPie.map(s => s.color), borderWidth: 2 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '55%',
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 8, usePointStyle: true } } }
          }
        });
      }
    }
  }
}
