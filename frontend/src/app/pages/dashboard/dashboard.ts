import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { StatCardComponent } from './components/stat-card';
import { ComparisonChartComponent } from './components/comparison-chart';
import { GlobalAveragesChartComponent } from './components/global-averages-chart';
import { ProjectDetailsTableComponent } from './components/project-details-table';
import { LucideAngularModule, FolderKanban, Wallet, Activity, AlertTriangle, Clock, CheckCircle2, Package, LayoutGrid, Target, Printer, FileSpreadsheet, FileText, Filter, TrendingUp, Timer, BarChart3, Calendar, Download, Layers } from 'lucide-angular';
import { SelectComponent, SelectTriggerComponent, SelectValueComponent, SelectContentComponent, SelectItemComponent } from '../../shared/ui/select';
import { TabsComponent, TabsListComponent, TabsTriggerComponent, TabsContentComponent } from '../../shared/ui/tabs';
import { PtaService } from '../../services/pta.service';
import { CdpService } from '../../services/cdp.service';
import { PtaDashboardTabComponent } from './components/pta-dashboard-tab';
import { CdpDashboardTabComponent } from './components/cdp-dashboard-tab';
import { GlobalOforTabComponent } from './components/global-ofor-tab';
import { PTA } from '../../models/pta.model';
import { CDP, CDPEvaluationAnnuelle, CDPCategorie, CDPComposante, CDPFicheSuiviIndicateur } from '../../models/cdp.model';
import { mockServices } from '../../data/entites-execution.data';

registerLocaleData(localeFr);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatCardComponent,
    ComparisonChartComponent,
    GlobalAveragesChartComponent,
    ProjectDetailsTableComponent,
    LucideAngularModule,
    SelectComponent,
    SelectTriggerComponent,
    SelectValueComponent,
    SelectContentComponent,
    SelectItemComponent,
    TabsComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent,
    PtaDashboardTabComponent,
    CdpDashboardTabComponent,
    GlobalOforTabComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  projects = signal<Project[]>([]);
  mainTab = 'global';

  // Filters
  selectedYear = signal<string>('2024');
  selectedRegion = signal<string>('all');
  selectedProjectId = signal<string>('all');
  selectedServiceId = signal<string>('all');

  // PTA Filters
  selectedPTAId = signal<string>('all');
  selectedPeriod = signal<string>('annuel');
  selectedOperationId = signal<string>('all');
  ptaList = signal<PTA[]>([]);

  // CDP Filters
  selectedCDPId = signal<string>('all');
  selectedEvalYear = signal<string>('2024');
  selectedCDPCategory = signal<string>('all');
  selectedCDPComponent = signal<string>('all');
  cdpList = signal<CDP[]>([]);
  cdpEvaluations = signal<CDPEvaluationAnnuelle[]>([]);
  cdpCategories = signal<CDPCategorie[]>([]);
  cdpComposantes = signal<CDPComposante[]>([]);
  cdpFiches = signal<CDPFicheSuiviIndicateur[]>([]);

  selectedPTA = computed(() => {
    return this.ptaList().find(p => p.id === this.selectedPTAId()) || this.ptaList()[0];
  });

  selectedCDP = computed(() => {
    return this.cdpList().find(c => c.id === this.selectedCDPId()) || this.cdpList()[0];
  });

  filteredCDPComposantes = computed(() => {
    const catId = this.selectedCDPCategory();
    if (catId === 'all') return this.cdpComposantes();
    return this.cdpComposantes().filter(c => c.categorieId === catId);
  });

  // Computed data
  filteredProjects = computed(() => {
    return this.projects().filter(p => {
      if (this.selectedRegion() !== 'all' && p.region !== this.selectedRegion()) return false;
      if (this.selectedServiceId() !== 'all' && p.serviceResponsableId !== this.selectedServiceId()) return false;
      if (this.selectedProjectId() !== 'all' && p.id !== this.selectedProjectId()) return false;
      // Filter by year if necessary (based on startDate)
      if (this.selectedYear() !== 'all' && !p.startDate.startsWith(this.selectedYear())) return false;
      return true;
    });
  });

  // KPI Computations
  totalProjects = computed(() => this.filteredProjects().length);

  totalBudget = computed(() =>
    this.filteredProjects().reduce((sum, p) => sum + p.budgetFCFA, 0)
  );

  totalSpent = computed(() =>
    this.filteredProjects().reduce((sum, p) => sum + (p.spent || 0), 0)
  );

  budgetExecution = computed(() => {
    const total = this.totalBudget();
    const spent = this.totalSpent();
    return total > 0 ? Math.round((spent / total) * 100) : 0;
  });

  avgProgress = computed(() => {
    const projs = this.filteredProjects();
    return projs.length > 0
      ? Math.round(projs.reduce((sum, p) => sum + p.progress, 0) / projs.length)
      : 0;
  });

  delayedProjects = computed(() =>
    this.filteredProjects().filter(p => p.status === 'retard').length
  );

  // New KPIs from React version
  delayConsumed = computed(() => {
    const projs = this.filteredProjects();
    if (projs.length === 0) return 0;

    let totalDelay = 0;
    projs.forEach(p => {
      const start = new Date(p.startDate).getTime();
      const end = new Date(p.endDate).getTime();
      const now = new Date().getTime();

      if (now <= start) totalDelay += 0;
      else if (now >= end) totalDelay += 100;
      else {
        const total = end - start;
        const elapsed = now - start;
        totalDelay += (elapsed / total) * 100;
      }
    });
    return Math.round(totalDelay / projs.length);
  });

  activityProgress = computed(() => {
    const projs = this.filteredProjects();
    let totalActItems = 0;
    let totalActProgress = 0;

    projs.forEach(p => {
      p.activities?.forEach(a => {
        totalActItems++;
        totalActProgress += a.progress;
      });
    });

    return totalActItems > 0 ? Math.round(totalActProgress / totalActItems) : 0;
  });

  allDeliverables = computed(() => {
    const deliverables: any[] = [];
    this.filteredProjects().forEach(p => {
      p.activities?.forEach(a => {
        a.deliverables?.forEach(d => {
          deliverables.push(d);
        });
      });
    });
    return deliverables;
  });

  totalDeliverablesCount = computed(() => this.allDeliverables().length);

  achievedDeliverablesCount = computed(() =>
    this.allDeliverables().filter(d => d.currentValue >= d.targetValue).length
  );

  deliverableProgress = computed(() => {
    const dels = this.allDeliverables();
    if (dels.length === 0) return 0;

    const totalPerf = dels.reduce((sum, d) => {
      const perf = d.targetValue > 0 ? (d.currentValue / d.targetValue) * 100 : 0;
      return sum + Math.min(perf, 100);
    }, 0);

    return Math.round(totalPerf / dels.length);
  });

  // Icons
  readonly icons = {
    FolderKanban,
    Wallet,
    Activity,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Package,
    LayoutGrid,
    Target,
    Calendar,
    Printer,
    FileSpreadsheet,
    FileText,
    Download,
    Layers,
    Filter,
    TrendingUp,
    Timer,
    BarChart3,
    RefreshCw: Activity // Fallback icon for reset
  };

  regions = computed(() => {
    const uniqueRegions = new Set(this.projects().map(p => p.region));
    return Array.from(uniqueRegions).sort();
  });

  years = ['2023', '2024', '2025'];
  readonly services = mockServices.filter(s => s.actif);

  readonly availableProjects = computed(() => {
    return this.projects()
      .filter(p => this.selectedRegion() === 'all' || p.region === this.selectedRegion())
      .filter(p => this.selectedServiceId() === 'all' || p.serviceResponsableId === this.selectedServiceId());
  });

  readonly ptaOperations = computed(() => {
    const pta = this.selectedPTA();
    if (!pta) return [];
    const operations = new Map<string, string>();
    pta.activities
      .filter(activity => !!activity.operationId)
      .filter(activity => this.selectedServiceId() === 'all' || activity.serviceResponsableId === this.selectedServiceId())
      .forEach(activity => operations.set(activity.operationId!, activity.operationName || activity.operationId!));
    return Array.from(operations.entries()).map(([id, name]) => ({ id, name }));
  });

  ngOnInit() {
    this.projectService.getProjects().subscribe(data => {
      this.projects.set(data);
    });

    this.ptaService.getPTAs().subscribe(data => {
      this.ptaList.set(data);
      if (data.length > 0) {
        this.selectedPTAId.set(data[0].id);
      }
    });

    this.cdpService.getCDPs().subscribe(data => {
      this.cdpList.set(data);
      if (data.length > 0) {
        this.selectedCDPId.set(data[0].id);
      }
    });

    this.cdpService.getEvaluations().subscribe(data => {
      this.cdpEvaluations.set(data);
    });

    this.cdpService.getCategories().subscribe(data => {
      this.cdpCategories.set(data);
    });

    this.cdpService.getComposantes().subscribe(data => {
      this.cdpComposantes.set(data);
    });

    this.cdpService.getEvaluations().subscribe(evals => {
      if (evals.length > 0) {
        this.cdpService.getFichesSuivi(evals[0].id).subscribe(fiches => {
          this.cdpFiches.set(fiches);
        });
      }
    });
  }

  constructor(
    private projectService: ProjectService,
    private ptaService: PtaService,
    private cdpService: CdpService
  ) {
    effect(() => {
      const cdpId = this.selectedCDPId();
      const year = parseInt(this.selectedEvalYear());
      if (cdpId && !isNaN(year)) {
        const evaluation = this.cdpEvaluations().find(e => e.cdpId === cdpId && e.year === year);
        if (evaluation) {
          this.cdpService.getFichesSuivi(evaluation.id).subscribe(fiches => {
            this.cdpFiches.set(fiches);
          });
        } else {
          this.cdpFiches.set([]);
        }
      }
    });
  }

  resetFilters() {
    this.selectedRegion.set('all');
    this.selectedProjectId.set('all');
    this.selectedServiceId.set('all');
    this.selectedOperationId.set('all');
    this.selectedYear.set('2024');
    this.selectedPeriod.set('annuel');
    if (this.ptaList().length > 0) {
      this.selectedPTAId.set(this.ptaList()[0].id);
    }
    if (this.cdpList().length > 0) {
      this.selectedCDPId.set(this.cdpList()[0].id);
    }
    this.selectedEvalYear.set('2024');
    this.selectedCDPCategory.set('all');
    this.selectedCDPComponent.set('all');
  }

  formatBudget(amount: number): string {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
    return amount.toLocaleString('fr-FR');
  }

  printReport() {
    window.print();
  }

  exportExcel() {
    this.downloadTextFile(`rapport-${this.mainTab}.csv`, this.buildCsvExport());
  }

  exportPDF() {
    window.print();
  }

  exportConsolidatedExcel() {
    this.downloadTextFile('rapport-consolide-ofor.csv', this.buildCsvExport(true));
  }

  exportConsolidatedPDF() {
    window.print();
  }

  onServiceChange(serviceId: string) {
    this.selectedServiceId.set(serviceId);
    this.selectedProjectId.set('all');
    this.selectedOperationId.set('all');
  }

  onProjectChange(projectId: string) {
    this.selectedProjectId.set(projectId);
    if (projectId !== 'all') this.selectedOperationId.set('all');
  }

  onOperationChange(operationId: string) {
    this.selectedOperationId.set(operationId);
    if (operationId !== 'all') this.selectedProjectId.set('all');
  }

  private buildCsvExport(consolidated = false): string {
    const rows = [
      ['Section', 'Indicateur', 'Valeur'],
      ['Projets', 'Nombre de projets', this.totalProjects().toString()],
      ['Projets', 'Budget total', this.totalBudget().toString()],
      ['Projets', 'Budget execute', this.totalSpent().toString()],
      ['Projets', 'Execution budgetaire', `${this.budgetExecution()}%`],
      ['Projets', 'Avancement activites', `${this.activityProgress()}%`],
      ['Projets', 'Avancement livrables', `${this.deliverableProgress()}%`],
    ];

    if (consolidated || this.mainTab === 'pta') {
      const pta = this.selectedPTA();
      rows.push(['PTA', 'PTA selectionne', pta?.code || '-']);
      rows.push(['PTA', 'Periode', this.selectedPeriod()]);
      rows.push(['PTA', 'Budget total', String(pta?.totalBudget || 0)]);
    }

    if (consolidated || this.mainTab === 'cdp') {
      const cdp = this.selectedCDP();
      rows.push(['CDP', 'CDP selectionne', cdp?.code || '-']);
      rows.push(['CDP', 'Annee', this.selectedEvalYear()]);
      rows.push(['CDP', 'Indicateurs', String(cdp?.indicateurs?.length || 0)]);
    }

    return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  private downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
