import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, Search, FileText, CheckCircle, Clock,
  AlertCircle, Calendar, User, Wallet, BarChart3, ChevronRight,
  ArrowRight, Eye, Plus, Send, Lock, FolderOpen, Edit, FileDown,
  Package, Building2, Check, X, ShieldAlert, Award, AlertTriangle, Trash2
} from 'lucide-angular';
import { ProjectService } from '../../services/project.service';
import { PtaService } from '../../services/pta.service';
import { SuiviService } from '../../services/suivi.service';
import { 
  Collecte, 
  FicheSuivi, 
  FicheIndicateur, 
  FicheSuiviStatus, 
  DEFAULT_WORKFLOWS, 
  getWorkflowForNature,
  calculateWorkflowProgress,
  generateCollecteCode,
  PointCritique,
  ActionSuivi
} from '../../models/workflow.model';
import { BUTTON_COMPONENTS } from '../../shared/ui/button';
import { BADGE_COMPONENTS } from '../../shared/ui/badge';
import { CARD_COMPONENTS } from '../../shared/ui/card';
import { TABS_COMPONENTS } from '../../shared/ui/tabs';
import { PROGRESS_COMPONENTS } from '../../shared/ui/progress';

@Component({
  selector: 'app-suivi',
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
  templateUrl: './suivi.html',
  styleUrl: './suivi.scss',
})
export class SuiviComponent implements OnInit {
  private projectService = inject(ProjectService);
  private ptaService = inject(PtaService);
  private suiviService = inject(SuiviService);

  // Expose JS helpers
  readonly Math = Math;
  readonly calculateWorkflowProgress = calculateWorkflowProgress;

  // Icons
  readonly SearchIcon = Search;
  readonly FileTextIcon = FileText;
  readonly CheckCircleIcon = CheckCircle;
  readonly ClockIcon = Clock;
  readonly AlertCircleIcon = AlertCircle;
  readonly CalendarIcon = Calendar;
  readonly UserIcon = User;
  readonly WalletIcon = Wallet;
  readonly BarChart3Icon = BarChart3;
  readonly ChevronRightIcon = ChevronRight;
  readonly ArrowRightIcon = ArrowRight;
  readonly EyeIcon = Eye;
  readonly PlusIcon = Plus;
  readonly SendIcon = Send;
  readonly LockIcon = Lock;
  readonly FolderOpenIcon = FolderOpen;
  readonly EditIcon = Edit;
  readonly FileDownIcon = FileDown;
  readonly PackageIcon = Package;
  readonly Building2Icon = Building2;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly ShieldAlertIcon = ShieldAlert;
  readonly AwardIcon = Award;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly TrashIcon = Trash2;

  // View state signals
  activeMainTab = signal<string>('execution');
  activeSubTab = signal<string>('activites');
  searchQuery = signal<string>('');
  selectedPTAFilter = signal<string>('all');
  selectedProjectFilter = signal<string>('all');
  selectedStatusFilter = signal<string>('all');

  // Dialog / form control states
  collecteDialogOpen = false;
  ficheSuiviFormOpen = false;
  ficheIndicateurFormOpen = false;
  ficheDetailOpen = false;

  // Selected entities
  selectedFicheSuivi = signal<FicheSuivi | null>(null);
  selectedFicheIndicateur = signal<FicheIndicateur | null>(null);

  // Collecte creation form states
  collecteFormProject = '';
  collecteFormDate = new Date().toISOString().split('T')[0];
  collecteFormDescription = '';

  // Fiche editing temporary states
  editingFicheSuivi: FicheSuivi | null = null;
  editingFicheIndicateur: FicheIndicateur | null = null;

  // Dialog and reference variables
  projectsList = computed(() => this.projectService.getProjectsSignal()());
  ptaList = signal<any[]>([]);

  ngOnInit() {
    this.ptaService.getPTAs().subscribe(ptas => {
      this.ptaList.set(ptas);
    });
  }

  // Reactive computed lists
  filteredCollectes = computed(() => {
    const list = this.suiviService.collectes();
    const query = this.searchQuery().toLowerCase();
    const pta = this.selectedPTAFilter();
    const prj = this.selectedProjectFilter();

    return list.filter(c => {
      const matchQuery = c.projectName.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);
      const matchPTA = pta === 'all' || c.ptaId === pta;
      const matchProject = prj === 'all' || c.projectId === prj;
      return matchQuery && matchPTA && matchProject;
    });
  });

  filteredFichesSuivi = computed(() => {
    const list = this.suiviService.fichesSuivi();
    const query = this.searchQuery().toLowerCase();
    const prj = this.selectedProjectFilter();
    const status = this.selectedStatusFilter();

    return list.filter(f => {
      const matchQuery = f.activityName.toLowerCase().includes(query) || f.projectName.toLowerCase().includes(query) || f.code.toLowerCase().includes(query);
      const matchProject = prj === 'all' || f.projectId === prj;
      const matchStatus = status === 'all' || f.status === status;
      return matchQuery && matchProject && matchStatus;
    });
  });

  filteredFichesIndicateurs = computed(() => {
    const list = this.suiviService.fichesIndicateurs();
    const query = this.searchQuery().toLowerCase();
    const prj = this.selectedProjectFilter();
    const status = this.selectedStatusFilter();

    return list.filter(f => {
      const matchQuery = f.projectName.toLowerCase().includes(query) || f.code.toLowerCase().includes(query);
      const matchProject = prj === 'all' || f.projectId === prj;
      const matchStatus = status === 'all' || f.status === status;
      return matchQuery && matchProject && matchStatus;
    });
  });

  // KPI Calculations
  activitiesExecutionStats = computed(() => {
    const fiches = this.suiviService.fichesSuivi();
    const total = fiches.length;
    const finished = fiches.filter(f => f.progressPercentage === 100).length;
    const totalBudget = fiches.reduce((s, f) => s + f.budgetPrevu, 0);
    const totalSpent = fiches.reduce((s, f) => s + f.depensesCumulees, 0);

    return {
      total,
      finished,
      progress: total > 0 ? Math.round((finished / total) * 100) : 0,
      totalBudget,
      totalSpent,
      rate: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    };
  });

  fichesApprovalStats = computed(() => {
    const fiches = this.suiviService.fichesSuivi();
    return {
      brouillon: fiches.filter(f => f.status === 'brouillon').length,
      soumis: fiches.filter(f => f.status === 'soumis').length,
      valide: fiches.filter(f => f.status === 'valide').length,
      approuve: fiches.filter(f => f.status === 'approuve').length,
    };
  });

  // Helpers
  formatNumber(val: number): string {
    return new Intl.NumberFormat('fr-FR').format(val);
  }

  formatBudget(amount: number): string {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(2)} Mds`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
    return this.formatNumber(amount);
  }

  getStatusBadgeClass(status: FicheSuiviStatus): string {
    switch (status) {
      case 'brouillon': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'soumis': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'valide': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approuve': return 'bg-green-100 text-green-800 border-green-200';
    }
  }

  getStatusLabel(status: FicheSuiviStatus): string {
    switch (status) {
      case 'brouillon': return 'Brouillon';
      case 'soumis': return 'Soumis';
      case 'valide': return 'Validé';
      case 'approuve': return 'Approuvé';
    }
  }

  // Fiche detailed actions
  viewFicheDetail(fiche: FicheSuivi) {
    this.selectedFicheSuivi.set(fiche);
    this.ficheDetailOpen = true;
  }

  openEditFicheSuivi(fiche: FicheSuivi) {
    this.editingFicheSuivi = JSON.parse(JSON.stringify(fiche)); // deep copy
    this.ficheSuiviFormOpen = true;
  }

  openEditFicheIndicateur(fiche: FicheIndicateur) {
    this.editingFicheIndicateur = JSON.parse(JSON.stringify(fiche)); // deep copy
    this.ficheIndicateurFormOpen = true;
  }

  saveFicheSuiviEdit() {
    if (!this.editingFicheSuivi) return;
    this.suiviService.updateFicheSuivi(this.editingFicheSuivi);
    this.ficheSuiviFormOpen = false;
    this.editingFicheSuivi = null;
  }

  saveFicheIndicateurEdit() {
    if (!this.editingFicheIndicateur) return;
    this.suiviService.updateFicheIndicateur(this.editingFicheIndicateur);
    this.ficheIndicateurFormOpen = false;
    this.editingFicheIndicateur = null;
  }

  // Validation workflows
  submitFicheSuivi(fiche: FicheSuivi) {
    const updated = {
      ...fiche,
      status: 'soumis' as const,
      submittedAt: new Date().toISOString(),
      submittedBy: 'Agent S&E'
    };
    this.suiviService.updateFicheSuivi(updated);
  }

  validateFicheSuivi(fiche: FicheSuivi) {
    const updated = {
      ...fiche,
      status: 'valide' as const,
      validatedAt: new Date().toISOString(),
      validatedBy: 'Directeur DPSE'
    };
    this.suiviService.updateFicheSuivi(updated);
  }

  approveFicheSuivi(fiche: FicheSuivi) {
    const updated = {
      ...fiche,
      status: 'approuve' as const,
      approvedAt: new Date().toISOString(),
      approvedBy: 'Directeur Général'
    };
    this.suiviService.updateFicheSuivi(updated);
  }

  submitFicheIndicateur(fiche: FicheIndicateur) {
    const updated = {
      ...fiche,
      status: 'soumis' as const,
      submittedAt: new Date().toISOString(),
      submittedBy: 'Agent S&E'
    };
    this.suiviService.updateFicheIndicateur(updated);
  }

  approveFicheIndicateur(fiche: FicheIndicateur) {
    const updated = {
      ...fiche,
      status: 'approuve' as const,
      approvedAt: new Date().toISOString(),
      approvedBy: 'Directeur DPSE'
    };
    this.suiviService.updateFicheIndicateur(updated);
  }

  // Collecte Creation
  openCreateCollecte() {
    this.collecteFormProject = this.projectsList()[0]?.id || '';
    this.collecteFormDate = new Date().toISOString().split('T')[0];
    this.collecteFormDescription = '';
    this.collecteDialogOpen = true;
  }

  handleCreateCollecte() {
    const project = this.projectsList().find(p => p.id === this.collecteFormProject);
    if (!project) return;

    const projectCode = project.id.slice(0, 4).toUpperCase();
    const dateCollecte = this.collecteFormDate;
    
    // Auto-detect matching open PTA
    const ptaId = dateCollecte.startsWith('2024') ? 'pta-2024-1' : dateCollecte.startsWith('2025') ? 'pta-2025-1' : 'pta-2026-1';

    const newCollecte: Collecte = {
      id: `col-${project.id}-${Date.now()}`,
      code: generateCollecteCode(projectCode, dateCollecte),
      projectId: project.id,
      projectName: project.name,
      ptaId,
      dateCollecte,
      description: this.collecteFormDescription || `Collecte du ${dateCollecte}`,
      createdAt: new Date().toISOString(),
      createdBy: 'Utilisateur S&E',
      status: 'en_cours'
    };

    // Standard activity porting
    const selectedActivities = (project.activities || []).map(a => ({
      activityId: a.id,
      nature: a.nature || 'Travaux',
      name: a.name,
      budgetTotal: a.budget,
      deliverables: (a.deliverables || []).map((d, i) => ({ id: `del-${a.id}-${i}`, unit: d.unit || 'Livrable', targetValue: d.targetValue })),
      responsable: a.responsible || project.responsible
    }));

    this.suiviService.createCollecte(newCollecte, selectedActivities, project.indicators || []);
    this.collecteDialogOpen = false;
  }

  cloturerCollecte(c: Collecte) {
    if (confirm(`Êtes-vous sûr de vouloir clôturer définitivement la collecte "${c.code}" ?`)) {
      this.suiviService.cloturerCollecte(c.id);
    }
  }

  // Workflow steps helpers
  getWorkflowSteps(nature: string) {
    return getWorkflowForNature(nature, DEFAULT_WORKFLOWS).steps;
  }

  onStepChange(stepId: string) {
    if (!this.editingFicheSuivi) return;
    const workflow = getWorkflowForNature(this.editingFicheSuivi.workflowId || 'sensibilisation', DEFAULT_WORKFLOWS);
    const step = workflow.steps.find(s => s.id === stepId);
    if (step) {
      this.editingFicheSuivi.currentStepId = step.id;
      this.editingFicheSuivi.currentStepName = step.name;
      this.editingFicheSuivi.progressPercentage = Math.round((step.order / workflow.steps.length) * 100);
    }
  }

  // Fiche Form edits helpers
  addPointCritique() {
    if (!this.editingFicheSuivi) return;
    const p: PointCritique = {
      id: `pc-new-${Date.now()}`,
      titre: '',
      description: '',
      niveau: 'info',
      statut: 'ouvert',
      dateIdentification: new Date().toISOString().split('T')[0]
    };
    if (!this.editingFicheSuivi.pointsCritiques) {
      this.editingFicheSuivi.pointsCritiques = [];
    }
    this.editingFicheSuivi.pointsCritiques.push(p);
  }

  removePointCritique(idx: number) {
    if (this.editingFicheSuivi?.pointsCritiques) {
      this.editingFicheSuivi.pointsCritiques.splice(idx, 1);
    }
  }

  addActionSuivi() {
    if (!this.editingFicheSuivi) return;
    const a: ActionSuivi = {
      id: `as-new-${Date.now()}`,
      titre: '',
      responsable: this.editingFicheSuivi.responsable || '',
      echeance: new Date().toISOString().split('T')[0],
      priorite: 'normale',
      statut: 'a_faire'
    };
    if (!this.editingFicheSuivi.actionsSuivi) {
      this.editingFicheSuivi.actionsSuivi = [];
    }
    this.editingFicheSuivi.actionsSuivi.push(a);
  }

  removeActionSuivi(idx: number) {
    if (this.editingFicheSuivi?.actionsSuivi) {
      this.editingFicheSuivi.actionsSuivi.splice(idx, 1);
    }
  }
}
