import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Calendar, Target, Wallet, FolderOpen, Plus,
  LayoutGrid, Eye, BarChart3, FileText, Lock, Unlock, Edit,
  CheckCircle2, MoreHorizontal, Package, Building2, Settings,
  ChevronDown, Copy, Archive, Settings2, Trash2, X
} from 'lucide-angular';
import { PtaService } from '../../services/pta.service';
import { ProjectService } from '../../services/project.service';
import { mockServices, getServiceById } from '../../data/entites-execution.data';
import { mockOperations, getOperationById, getOperationsByService } from '../../data/operations.data';
import { PTA, PTAActivity, PTAIndicatorPlanning, PTA_STATUS_LABELS, PTA_STATUS_COLORS, generatePTACode } from '../../models/pta.model';
import { BUTTON_COMPONENTS } from '../../shared/ui/button';
import { BADGE_COMPONENTS } from '../../shared/ui/badge';
import { CARD_COMPONENTS } from '../../shared/ui/card';
import { TABS_COMPONENTS } from '../../shared/ui/tabs';
import { PROGRESS_COMPONENTS } from '../../shared/ui/progress';

@Component({
  selector: 'app-planification',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    ...BUTTON_COMPONENTS,
    ...BADGE_COMPONENTS,
    ...CARD_COMPONENTS,
    ...TABS_COMPONENTS,
    ...PROGRESS_COMPONENTS,
  ],
  templateUrl: './planification.html',
  styleUrl: './planification.scss',
})
export class PlanificationComponent implements OnInit {
  private ptaService = inject(PtaService);
  private projectService = inject(ProjectService);

  // Icons
  readonly CalendarIcon = Calendar;
  readonly TargetIcon = Target;
  readonly WalletIcon = Wallet;
  readonly FolderOpenIcon = FolderOpen;
  readonly PlusIcon = Plus;
  readonly LayoutGridIcon = LayoutGrid;
  readonly EyeIcon = Eye;
  readonly BarChart3Icon = BarChart3;
  readonly FileTextIcon = FileText;
  readonly LockIcon = Lock;
  readonly UnlockIcon = Unlock;
  readonly EditIcon = Edit;
  readonly CheckCircleIcon = CheckCircle2;
  readonly MoreHorizontalIcon = MoreHorizontal;
  readonly PackageIcon = Package;
  readonly Building2Icon = Building2;
  readonly SettingsIcon = Settings;
  readonly ChevronDownIcon = ChevronDown;
  readonly CopyIcon = Copy;
  readonly ArchiveIcon = Archive;
  readonly TrashIcon = Trash2;
  readonly XIcon = X;

  // Constants
  readonly ptaStatusLabels = PTA_STATUS_LABELS;
  readonly ptaStatusColors = PTA_STATUS_COLORS;

  // Active filters
  selectedPTA = signal<PTA | null>(null);
  selectedService = signal<string>('all');
  selectedProject = signal<string>('all');
  selectedOperation = signal<string>('all');

  // Display toggles
  viewMode = signal<string>('table');
  displayMode = signal<'budget' | 'deliverables'>('budget');

  // PTA List
  ptaList = signal<PTA[]>([]);

  // Modal control
  createDialogOpen = false;
  duplicateDialogOpen = false;
  activityFormOpen = false;
  activityDetailOpen = false;
  confirmDialogOpen = false;

  // Confirm actions state
  confirmActionType: 'open' | 'close' | 'archive' | null = null;
  confirmPta: PTA | null = null;

  // Form states
  newPTAName = '';
  newPTAYear = new Date().getFullYear();
  newPTADescription = '';
  duplicateYear = new Date().getFullYear() + 1;

  // Activity form states
  editingActivity = signal<PTAActivity | null>(null);
  selectedActivityDetail = signal<PTAActivity | null>(null);
  activityFormName = '';
  activityFormNature = 'Travaux';
  activityFormResponsable = '';
  activityFormDescription = '';
  activityFormService = '';
  activityFormProject = '';
  activityFormOperation = '';
  activityFormBudgetT1 = 0;
  activityFormBudgetT2 = 0;
  activityFormBudgetT3 = 0;
  activityFormBudgetT4 = 0;

  // Data helpers
  activeServices = mockServices.filter(s => s.actif);
  operations = mockOperations;

  onProjectFilterChange(val: string) {
    this.selectedProject.set(val);
    if (val !== 'all') {
      this.selectedOperation.set('all');
    }
  }

  onOperationFilterChange(val: string) {
    this.selectedOperation.set(val);
    if (val !== 'all') {
      this.selectedProject.set('all');
    }
  }

  ngOnInit() {
    this.ptaService.getPTAs().subscribe(ptas => {
      this.ptaList.set(ptas);
      if (!this.selectedPTA()) {
        const opened = ptas.find(p => p.status === 'ouvert');
        this.selectedPTA.set(opened || ptas[0] || null);
      }
    });
  }

  // Filter cascades
  availableProjects = computed(() => {
    const srv = this.selectedService();
    const allProj = this.projectService.getProjectsSignal()();
    if (srv === 'all') return allProj;
    return allProj.filter(p => (p as any).serviceResponsableId === srv);
  });

  availableOperations = computed(() => {
    const srv = this.selectedService();
    if (srv === 'all') return this.operations.filter(o => o.actif);
    return getOperationsByService(srv);
  });

  filteredActivities = computed(() => {
    const pta = this.selectedPTA();
    if (!pta) return [];

    const service = this.selectedService();
    const proj = this.selectedProject();
    const op = this.selectedOperation();

    return pta.activities.filter(a => {
      const matchService = service === 'all' || a.serviceResponsableId === service;
      const matchProj = proj === 'all' || a.projectId === proj;
      const matchOp = op === 'all' || a.operationId === op;
      return matchService && matchProj && matchOp;
    });
  });

  // Grouped structure: Service -> Group (Project or Operation) -> Activities
  groupedActivities = computed(() => {
    const acts = this.filteredActivities();
    const serviceMap: Record<string, { serviceLabel: string; groups: Record<string, { type: 'projet' | 'operation'; label: string; activities: PTAActivity[] }> }> = {};

    acts.forEach(a => {
      const srvId = a.serviceResponsableId || 'no-service';
      const srv = srvId !== 'no-service' ? getServiceById(srvId) : undefined;
      const serviceLabel = srv ? `${srv.code} — ${srv.nom}` : "Service non défini";

      if (!serviceMap[srvId]) {
        serviceMap[srvId] = { serviceLabel, groups: {} };
      }

      let groupKey = '';
      let type: 'projet' | 'operation' = 'operation';
      let label = '';

      if (a.operationId) {
        groupKey = `op-${a.operationId}`;
        type = 'operation';
        const op = getOperationById(a.operationId);
        label = op ? `${op.code} — ${op.libelle}` : (a.operationName || 'Opération');
      } else if (a.projectId) {
        groupKey = `prj-${a.projectId}`;
        type = 'projet';
        label = a.project || 'Projet';
      } else {
        groupKey = 'autre';
        type = 'operation';
        label = 'Non rattaché';
      }

      if (!serviceMap[srvId].groups[groupKey]) {
        serviceMap[srvId].groups[groupKey] = { type, label, activities: [] };
      }

      serviceMap[srvId].groups[groupKey].activities.push(a);
    });

    return Object.keys(serviceMap).map(k => ({
      serviceId: k,
      label: serviceMap[k].serviceLabel,
      groups: Object.keys(serviceMap[k].groups).map(gk => ({
        key: gk,
        type: serviceMap[k].groups[gk].type,
        label: serviceMap[k].groups[gk].label,
        activities: serviceMap[k].groups[gk].activities,
      }))
    }));
  });

  // PTA Stats
  totalBudgetPrevu = computed(() => this.filteredActivities().reduce((s, a) => s + a.budgetTotal, 0));
  totalActivites = computed(() => this.filteredActivities().length);

  budgetByQuarter = computed(() => {
    const acts = this.filteredActivities();
    return {
      T1: acts.reduce((s, a) => s + (a.budgetT1 || 0), 0),
      T2: acts.reduce((s, a) => s + (a.budgetT2 || 0), 0),
      T3: acts.reduce((s, a) => s + (a.budgetT3 || 0), 0),
      T4: acts.reduce((s, a) => s + (a.budgetT4 || 0), 0),
    };
  });

  isReadOnly = computed(() => {
    const pta = this.selectedPTA();
    return !pta || pta.status === 'cloture' || pta.status === 'archive';
  });

  selectPTA(pta: PTA) {
    this.selectedPTA.set(pta);
  }

  // Format budget helpers
  formatBudget(amount: number): string {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)} Mds`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} M`;
    }
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  formatBudgetFull(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  // PTA CRUD & state actions
  openConfirmDialog(type: 'open' | 'close' | 'archive', pta: PTA) {
    this.confirmActionType = type;
    this.confirmPta = pta;
    this.confirmDialogOpen = true;
  }

  handleConfirmAction() {
    if (!this.confirmActionType || !this.confirmPta) return;
    const pta = this.confirmPta;

    if (this.confirmActionType === 'open') {
      const updated: PTA = { ...pta, status: 'ouvert', openedAt: new Date().toISOString(), openedBy: 'Direction' };
      this.ptaService.updatePTA(updated);
      this.selectedPTA.set(updated);
    } else if (this.confirmActionType === 'close') {
      const updated: PTA = { ...pta, status: 'cloture', closedAt: new Date().toISOString(), closedBy: 'Direction' };
      this.ptaService.updatePTA(updated);
      this.selectedPTA.set(updated);
    } else if (this.confirmActionType === 'archive') {
      const updated: PTA = { ...pta, status: 'archive' };
      this.ptaService.updatePTA(updated);
      this.selectedPTA.set(updated);
    }

    this.confirmDialogOpen = false;
    this.confirmActionType = null;
    this.confirmPta = null;
  }

  openCreateDialog() {
    this.newPTAName = '';
    this.newPTAYear = new Date().getFullYear();
    this.newPTADescription = '';
    this.createDialogOpen = true;
  }

  handleCreatePTA() {
    const list = this.ptaList();
    const existing = list.filter(p => p.year === this.newPTAYear);
    const version = existing.length + 1;

    const newPTA: PTA = {
      id: `pta-${Date.now()}`,
      code: generatePTACode(this.newPTAYear, version),
      name: this.newPTAName || `Plan de Travail Annuel ${this.newPTAYear}`,
      year: this.newPTAYear,
      status: 'brouillon',
      version,
      description: this.newPTADescription,
      createdAt: new Date().toISOString(),
      createdBy: 'Utilisateur',
      activities: [],
      indicators: [],
      totalBudget: 0,
    };

    this.ptaService.createPTA(newPTA);
    this.selectedPTA.set(newPTA);
    this.createDialogOpen = false;
  }

  openDuplicateDialog(pta: PTA) {
    this.confirmPta = pta;
    this.duplicateYear = pta.year + 1;
    this.duplicateDialogOpen = true;
  }

  handleDuplicate() {
    if (!this.confirmPta) return;
    const pta = this.confirmPta;
    const list = this.ptaList();
    const existing = list.filter(p => p.year === this.duplicateYear);
    const version = existing.length + 1;

    const newPTA: PTA = {
      id: `pta-${Date.now()}`,
      code: generatePTACode(this.duplicateYear, version),
      name: `Plan de Travail Annuel ${this.duplicateYear}`,
      year: this.duplicateYear,
      status: 'brouillon',
      version,
      description: `Dupliqué depuis ${pta.code}`,
      createdAt: new Date().toISOString(),
      createdBy: 'Utilisateur',
      activities: pta.activities.map(a => ({ ...a, id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })),
      indicators: pta.indicators.map(i => ({ ...i })),
      totalBudget: pta.totalBudget,
      previousVersionId: pta.id,
    };

    this.ptaService.createPTA(newPTA);
    this.selectedPTA.set(newPTA);
    this.duplicateDialogOpen = false;
    this.confirmPta = null;
  }

  // Activity CRUD
  openAddActivity() {
    this.editingActivity.set(null);
    this.activityFormName = '';
    this.activityFormNature = 'Travaux';
    this.activityFormResponsable = '';
    this.activityFormDescription = '';
    this.activityFormService = this.activeServices[0]?.id || '';
    this.activityFormProject = '';
    this.activityFormOperation = '';
    this.activityFormBudgetT1 = 0;
    this.activityFormBudgetT2 = 0;
    this.activityFormBudgetT3 = 0;
    this.activityFormBudgetT4 = 0;
    this.activityFormOpen = true;
  }

  openEditActivity(act: PTAActivity) {
    this.editingActivity.set(act);
    this.activityFormName = act.name;
    this.activityFormNature = act.nature;
    this.activityFormResponsable = act.responsable;
    this.activityFormDescription = act.description || '';
    this.activityFormService = act.serviceResponsableId || '';
    this.activityFormProject = act.projectId || '';
    this.activityFormOperation = act.operationId || '';
    this.activityFormBudgetT1 = act.budgetT1 || 0;
    this.activityFormBudgetT2 = act.budgetT2 || 0;
    this.activityFormBudgetT3 = act.budgetT3 || 0;
    this.activityFormBudgetT4 = act.budgetT4 || 0;
    this.activityFormOpen = true;
  }

  handleSaveActivity() {
    const pta = this.selectedPTA();
    if (!pta) return;

    let projectObj = this.projectService.getProjectsSignal()().find(p => p.id === this.activityFormProject);
    const serviceObj = getServiceById(this.activityFormService);
    const opObj = getOperationById(this.activityFormOperation);

    const budgetTotal = this.activityFormBudgetT1 + this.activityFormBudgetT2 + this.activityFormBudgetT3 + this.activityFormBudgetT4;

    const trimestres: string[] = [];
    if (this.activityFormBudgetT1 > 0) trimestres.push('T1');
    if (this.activityFormBudgetT2 > 0) trimestres.push('T2');
    if (this.activityFormBudgetT3 > 0) trimestres.push('T3');
    if (this.activityFormBudgetT4 > 0) trimestres.push('T4');

    const editing = this.editingActivity();
    if (editing) {
      // Edit
      const updatedActivity: PTAActivity = {
        ...editing,
        name: this.activityFormName,
        nature: this.activityFormNature,
        responsable: this.activityFormResponsable,
        description: this.activityFormDescription,
        serviceResponsableId: this.activityFormService,
        projectId: this.activityFormProject || '',
        project: projectObj?.name || serviceObj?.nom || '',
        operationId: this.activityFormOperation || undefined,
        operationName: opObj?.libelle || undefined,
        budgetT1: this.activityFormBudgetT1,
        budgetT2: this.activityFormBudgetT2,
        budgetT3: this.activityFormBudgetT3,
        budgetT4: this.activityFormBudgetT4,
        budgetTotal,
        trimestres,
      };

      const updatedActs = pta.activities.map(a => a.id === editing.id ? updatedActivity : a);
      const updatedPta: PTA = { ...pta, activities: updatedActs, totalBudget: updatedActs.reduce((s, a) => s + a.budgetTotal, 0) };
      this.ptaService.updatePTA(updatedPta);
      this.selectedPTA.set(updatedPta);
    } else {
      // Add
      const newActivity: PTAActivity = {
        id: `act-${Date.now()}`,
        name: this.activityFormName,
        nature: this.activityFormNature,
        responsable: this.activityFormResponsable,
        description: this.activityFormDescription,
        serviceResponsableId: this.activityFormService,
        projectId: this.activityFormProject || '',
        project: projectObj?.name || serviceObj?.nom || '',
        operationId: this.activityFormOperation || undefined,
        operationName: opObj?.libelle || undefined,
        budgetT1: this.activityFormBudgetT1,
        budgetT2: this.activityFormBudgetT2,
        budgetT3: this.activityFormBudgetT3,
        budgetT4: this.activityFormBudgetT4,
        budgetTotal,
        trimestres,
        deliverables: [],
        validationStatus: 'brouillon',
      };

      const updatedActs = [...pta.activities, newActivity];
      const updatedPta: PTA = { ...pta, activities: updatedActs, totalBudget: updatedActs.reduce((s, a) => s + a.budgetTotal, 0) };
      this.ptaService.updatePTA(updatedPta);
      this.selectedPTA.set(updatedPta);
    }

    this.activityFormOpen = false;
  }

  handleDeleteActivity(act: PTAActivity) {
    const pta = this.selectedPTA();
    if (!pta) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'activité "${act.name}" ?`)) {
      const updatedActs = pta.activities.filter(a => a.id !== act.id);
      const updatedPta: PTA = { ...pta, activities: updatedActs, totalBudget: updatedActs.reduce((s, a) => s + a.budgetTotal, 0) };
      this.ptaService.updatePTA(updatedPta);
      this.selectedPTA.set(updatedPta);
    }
  }

  handleValidateActivity(act: PTAActivity) {
    const pta = this.selectedPTA();
    if (!pta) return;

    const updatedActs = pta.activities.map(a => {
      if (a.id === act.id) {
        return {
          ...a,
          validationStatus: 'valide' as const,
          validatedAt: new Date().toISOString(),
          validatedBy: 'Validateur actuel'
        };
      }
      return a;
    });

    const updatedPta: PTA = { ...pta, activities: updatedActs };
    this.ptaService.updatePTA(updatedPta);
    this.selectedPTA.set(updatedPta);
  }

  handleUnlockActivity(act: PTAActivity) {
    const pta = this.selectedPTA();
    if (!pta) return;

    const updatedActs = pta.activities.map(a => {
      if (a.id === act.id) {
        return {
          ...a,
          validationStatus: 'brouillon' as const,
          validatedAt: undefined,
          validatedBy: undefined
        };
      }
      return a;
    });

    const updatedPta: PTA = { ...pta, activities: updatedActs };
    this.ptaService.updatePTA(updatedPta);
    this.selectedPTA.set(updatedPta);
  }

  openActivityDetail(act: PTAActivity) {
    this.selectedActivityDetail.set(act);
    this.activityDetailOpen = true;
  }

  // Export handlers
  exportCSV() {
    const pta = this.selectedPTA();
    if (!pta) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Code,Activite,Nature,Responsable,T1,T2,T3,T4,Total\n';

    this.filteredActivities().forEach(a => {
      const nameEscaped = `"${a.name.replace(/"/g, '""')}"`;
      csvContent += `${pta.code},${nameEscaped},${a.nature},"${a.responsable}",${a.budgetT1},${a.budgetT2},${a.budgetT3},${a.budgetT4},${a.budgetTotal}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pta-${pta.code}-activities.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportPDF() {
    alert('Fonctionnalité d\'export PDF en cours de traitement pour la version mobile/bureau.');
  }
}
