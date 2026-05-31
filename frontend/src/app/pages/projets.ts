import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Search, Plus, MoreHorizontal, Eye, Edit, Trash2, FileText, CheckCircle, Clock, AlertTriangle, Download, FileSpreadsheet } from 'lucide-angular';
import { ProjectService } from '../services/project.service';
import { Project, ProjectStatus, STATUS_LABELS } from '../models/project.model';
import { BUTTON_COMPONENTS } from '../shared/ui/button';
import { INPUT_COMPONENTS } from '../shared/ui/input';
import { SELECT_COMPONENTS } from '../shared/ui/select';
import { BADGE_COMPONENTS } from '../shared/ui/badge';
import { CARD_COMPONENTS } from '../shared/ui/card';
import { DIALOG_COMPONENTS } from '../shared/ui/dialog';
import { DROPDOWN_MENU_COMPONENTS } from '../shared/ui/dropdown-menu';
import { ProjectDetailDialogComponent } from './projets/components/project-detail-dialog';
import { ProjectWizardComponent } from './projets/components/project-wizard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

@Component({
  selector: 'app-projets',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ...BUTTON_COMPONENTS,
    ...INPUT_COMPONENTS,
    ...SELECT_COMPONENTS,
    ...BADGE_COMPONENTS,
    ...CARD_COMPONENTS,
    ...DIALOG_COMPONENTS,
    ...DROPDOWN_MENU_COMPONENTS,
    ProjectDetailDialogComponent,
    ProjectWizardComponent
  ],
  templateUrl: './projets.html',
  styleUrl: './projets.scss',
})
export class ProjetsComponent {
  private projectService = inject(ProjectService);
  private router = inject(Router);

  // Reactive projects from service
  projects = this.projectService.getProjectsSignal();

  // Local UI state
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  workflowFilter = signal<string>('all');

  // Dialog states
  deleteId = signal<string | null>(null);
  selectedProject = signal<Project | null>(null);
  validateProjectId = signal<string | null>(null);
  showCreateForm = signal(false);

  // Icons
  readonly SearchIcon = Search;
  readonly PlusIcon = Plus;
  readonly MoreHorizontalIcon = MoreHorizontal;
  readonly EyeIcon = Eye;
  readonly EditIcon = Edit;
  readonly Trash2Icon = Trash2;
  readonly FileTextIcon = FileText;
  readonly CheckCircleIcon = CheckCircle;
  readonly ClockIcon = Clock;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly DownloadIcon = Download;
  readonly FileSpreadsheetIcon = FileSpreadsheet;

  filteredProjects = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const workflow = this.workflowFilter();

    return this.projects().filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        project.code.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || project.status === status;
      const matchesWorkflow = workflow === 'all' || project.workflowStatus === workflow;
      return matchesSearch && matchesStatus && matchesWorkflow;
    });
  });

  totalBudget = computed(() => this.projects().reduce((sum, p) => sum + p.budget, 0));
  avgProgress = computed(() => {
    const projs = this.projects();
    if (projs.length === 0) return 0;
    return Math.round(projs.reduce((sum, p) => sum + p.progress, 0) / projs.length);
  });

  getStatusBadgeClass(status: ProjectStatus): string {
    const styles: Record<ProjectStatus, string> = {
      en_cours: "bg-blue-100 text-blue-800 border-blue-200",
      termine: "bg-green-100 text-green-800 border-green-200",
      retard: "bg-red-100 text-red-800 border-red-200",
      planifie: "bg-muted text-muted-foreground",
      suspendu: "bg-amber-100 text-amber-800 border-amber-200",
    };
    return styles[status] || "";
  }

  getStatusLabel(status: ProjectStatus): string {
    return STATUS_LABELS[status];
  }

  formatBudget(amount: number) {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  formatDate(dateStr: string) {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  handleCreateProject(data: any) {
    const workflowStatus = data.status === 'en_validation' ? 'en_validation' : 'brouillon';
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      code: data.code || `PRJ-${String(this.projects().length + 1).padStart(3, '0')}`,
      name: data.name,
      description: data.description || '',
      region: data.region || '',
      zonesIntervention: data.zonesIntervention || [],
      bailleur: data.bailleur || '',
      budget: data.budget || 0,
      currency: data.currency || 'XOF',
      budgetFCFA: data.budgetFCFA || data.budget || 0,
      spent: 0,
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date().toISOString(),
      progress: 0,
      status: 'planifie',
      equipeProjet: data.equipeProjet || [],
      responsible: data.responsible || '',
      responsibleEmail: data.responsibleEmail || '',
      objectives: data.objectives || '',
      entiteExecution: data.entiteExecution || '',
      serviceResponsableId: data.serviceResponsableId || '',
      indicators: [],
      activities: [],
      workflowStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projectService.addProject(newProject);
    this.showCreateForm.set(false);
  }

  handleValidateProject(id: string) {
    this.projectService.updateProject(id, { workflowStatus: 'valide' });
    this.validateProjectId.set(null);
  }

  handleRejectProject(id: string) {
    this.projectService.updateProject(id, { workflowStatus: 'rejete' });
    this.validateProjectId.set(null);
  }

  handleSubmitForValidation(id: string) {
    this.projectService.updateProject(id, { workflowStatus: 'en_validation' });
  }

  handleDeleteProject(id: string) {
    this.projectService.deleteProject(id);
    this.deleteId.set(null);
  }

  handleExportCSV() {
    const rows = this.filteredProjects().map((p) => ({
      Code: p.code,
      Projet: p.name,
      Region: p.region,
      Bailleur: p.bailleur,
      Budget: p.budget,
      Debut: this.formatDate(p.startDate),
      Fin: this.formatDate(p.endDate),
      Statut: this.getStatusLabel(p.status),
      Workflow: this.getWorkflowLabel(p.workflowStatus),
      Avancement: `${p.progress}%`,
    }));
    this.downloadCsv('projets.csv', rows);
  }

  handleExportPDF() {
    window.print();
  }

  getProjectsCountByStatus(status: ProjectStatus): number {
    return this.projects().filter((p) => p.status === status).length;
  }

  navigateToProject(id: string) {
    this.router.navigate(['/projets', id]);
  }

  getWorkflowLabel(status?: Project['workflowStatus']): string {
    const labels = {
      brouillon: 'Brouillon',
      en_validation: 'En validation',
      valide: 'Valide',
      rejete: 'Rejete',
    };
    return status ? labels[status] : 'Valide';
  }

  getWorkflowBadgeClass(status?: Project['workflowStatus']): string {
    const styles = {
      brouillon: 'bg-amber-100 text-amber-800 border-amber-200',
      en_validation: 'bg-blue-100 text-blue-800 border-blue-200',
      rejete: 'bg-red-100 text-red-800 border-red-200',
      valide: '',
    };
    return status ? styles[status] : '';
  }

  getWorkflowIcon(status?: Project['workflowStatus']) {
    if (status === 'brouillon') return this.ClockIcon;
    if (status === 'en_validation' || status === 'rejete') return this.AlertTriangleIcon;
    return this.CheckCircleIcon;
  }

  private downloadCsv(filename: string, rows: Record<string, unknown>[]) {
    const headers = Object.keys(rows[0] || {
      Code: '',
      Projet: '',
      Region: '',
      Bailleur: '',
      Budget: '',
      Debut: '',
      Fin: '',
      Statut: '',
      Workflow: '',
      Avancement: '',
    });
    const content = [
      headers.join(','),
      ...rows.map(row => headers.map(header => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
