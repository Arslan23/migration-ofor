import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
    LucideAngularModule, ArrowLeft, Edit, Download, MapPin, Calendar,
    User, Wallet, Target, ListTodo, Building2, FileText, Users,
    Banknote, Mail, Phone, Clock, CheckCircle2, AlertCircle, TrendingUp, Package
} from 'lucide-angular';
import { ProjectService } from '../../services/project.service';
import { PersonnelService } from '../../services/personnel';
import { Project, Activity, Indicator, STATUS_LABELS, ACTIVITY_STATUS_LABELS } from '../../models/project.model';
import { ROLE_LABELS } from '../../models/personnel.model';
import { mockPersonnel } from '../../data/personnel.data';
import { BUTTON_COMPONENTS } from '../../shared/ui/button';
import { BADGE_COMPONENTS } from '../../shared/ui/badge';
import { CARD_COMPONENTS } from '../../shared/ui/card';
import { TABS_COMPONENTS } from '../../shared/ui/tabs';
import { ACCORDION_COMPONENTS } from '../../shared/ui/accordion';
import { PROGRESS_COMPONENTS } from '../../shared/ui/progress';
import { ProjectDetailDialogComponent } from './components/project-detail-dialog';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

@Component({
    selector: 'app-projet-detail',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule,
        ...BUTTON_COMPONENTS,
        ...BADGE_COMPONENTS,
        ...CARD_COMPONENTS,
        ...TABS_COMPONENTS,
        ...ACCORDION_COMPONENTS,
        ...PROGRESS_COMPONENTS,
        ProjectDetailDialogComponent,
    ],
    templateUrl: './projet-detail.html',
    styleUrl: './projet-detail.scss',
})
export class ProjetDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private projectService = inject(ProjectService);

    // Icons
    readonly ArrowLeftIcon = ArrowLeft;
    readonly EditIcon = Edit;
    readonly DownloadIcon = Download;
    readonly MapPinIcon = MapPin;
    readonly CalendarIcon = Calendar;
    readonly UserIcon = User;
    readonly WalletIcon = Wallet;
    readonly TargetIcon = Target;
    readonly ListTodoIcon = ListTodo;
    readonly Building2Icon = Building2;
    readonly FileTextIcon = FileText;
    readonly UsersIcon = Users;
    readonly BanknoteIcon = Banknote;
    readonly MailIcon = Mail;
    readonly PhoneIcon = Phone;
    readonly ClockIcon = Clock;
    readonly CheckCircle2Icon = CheckCircle2;
    readonly AlertCircleIcon = AlertCircle;
    readonly TrendingUpIcon = TrendingUp;
    readonly PackageIcon = Package;

    // State
    project = signal<Project | null>(null);
    showFicheProjet = signal(false);
    showEditForm = signal(false);

    // Computed
    indicators = computed(() => this.project()?.indicators || []);
    activities = computed(() => this.project()?.activities || []);

    totalDeliverables = computed(() =>
        this.activities().reduce((sum, act) => sum + act.deliverables.length, 0)
    );

    completedActivities = computed(() =>
        this.activities().filter(a => a.status === 'termine').length
    );

    timeProgress = computed(() => {
        const p = this.project();
        if (!p) return 0;
        const totalDays = differenceInDays(new Date(p.endDate), new Date(p.startDate));
        const elapsedDays = Math.max(0, Math.min(totalDays, differenceInDays(new Date(), new Date(p.startDate))));
        return totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 0;
    });

    remainingDays = computed(() => {
        const p = this.project();
        if (!p) return 0;
        return Math.max(0, differenceInDays(new Date(p.endDate), new Date()));
    });

    projectMonths = computed(() => {
        const p = this.project();
        if (!p) return 0;
        return differenceInMonths(new Date(p.endDate), new Date(p.startDate));
    });

    budgetProgress = computed(() => {
        const p = this.project();
        if (!p || p.budget <= 0) return 0;
        return Math.round(((p.spent || 0) / p.budget) * 100);
    });

    actCoverage = computed(() => {
        const p = this.project();
        if (!p || p.budget <= 0) return 0;
        const totalActBudget = this.activities().reduce((s, a) => s + (a.budget || 0), 0);
        return Math.round((totalActBudget / p.budget) * 100);
    });

    constructor() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.projectService.getProject(id).subscribe(p => {
                if (p) {
                    this.project.set(p);
                } else {
                    this.router.navigate(['/projets']);
                }
            });
        }
    }

    goBack() {
        this.router.navigate(['/projets']);
    }

    formatBudget(amount: number): string {
        return new Intl.NumberFormat('fr-FR').format(amount);
    }

    formatDate(dateStr: string): string {
        return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
    }

    formatDateShort(dateStr: string): string {
        return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
    }

    getStatusLabel(status: string): string {
        return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
    }

    getActivityStatusLabel(status: string): string {
        return ACTIVITY_STATUS_LABELS[status as keyof typeof ACTIVITY_STATUS_LABELS] || status;
    }

    getActivityStatusClass(status: string): string {
        const map: Record<string, string> = {
            en_cours: 'bg-blue-100 text-blue-800',
            termine: 'bg-green-100 text-green-800',
            planifie: 'bg-muted text-muted-foreground',
            annule: 'bg-red-100 text-red-800',
        };
        return map[status] || '';
    }

    getPersonnelName(personnelId: string): string {
        const p = mockPersonnel.find(pp => pp.id === personnelId);
        return p ? `${p.prenom} ${p.nom}` : 'Inconnu';
    }

    getPersonnelFonction(personnelId: string): string {
        const p = mockPersonnel.find(pp => pp.id === personnelId);
        return p?.fonction || '';
    }

    getRoleLabel(role: string): string {
        return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
    }

    getIndicatorProgress(indicator: Indicator): number {
        if (!indicator.targetValue || indicator.targetValue <= 0) return 0;
        return Math.min(100, Math.round(((indicator.currentValue || 0) / indicator.targetValue) * 100));
    }

    handleAddIndicator(data: any) {
        const p = this.project();
        if (!p) return;
        const newIndicator: Indicator = {
            ...data,
            id: `ind-${Date.now()}`,
        };
        this.projectService.updateProject(p.id, {
            indicators: [...p.indicators, newIndicator]
        });
        this.project.set({ ...p, indicators: [...p.indicators, newIndicator] });
    }

    handleDeleteIndicator(id: string) {
        const p = this.project();
        if (!p) return;
        const updated = p.indicators.filter(i => i.id !== id);
        this.projectService.updateProject(p.id, { indicators: updated });
        this.project.set({ ...p, indicators: updated });
    }

    handleAddActivity(data: any) {
        const p = this.project();
        if (!p) return;
        const newActivity: Activity = {
            ...data,
            id: `act-${Date.now()}`,
            spent: 0,
            progress: 0,
            deliverables: [],
            fichesSuivi: [],
        };
        this.projectService.updateProject(p.id, {
            activities: [...p.activities, newActivity]
        });
        this.project.set({ ...p, activities: [...p.activities, newActivity] });
    }

    handleDeleteActivity(id: string) {
        const p = this.project();
        if (!p) return;
        const updated = p.activities.filter(a => a.id !== id);
        this.projectService.updateProject(p.id, { activities: updated });
        this.project.set({ ...p, activities: updated });
    }
}
