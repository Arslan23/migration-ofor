import { Injectable, inject, effect, signal, computed } from '@angular/core';
import { ProjectService } from './project.service';
import { PtaService } from './pta.service';
import { 
  Collecte, 
  FicheSuivi, 
  FicheIndicateur, 
  FicheSuiviStatus, 
  DEFAULT_WORKFLOWS, 
  getWorkflowForNature,
  generateCollecteCode,
  generateFicheSuiviCode
} from '../models/workflow.model';
import { PTAActivity } from '../models/pta.model';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class SuiviService {
  private projectService = inject(ProjectService);
  private ptaService = inject(PtaService);

  // Core signals for state management
  collectes = signal<Collecte[]>([]);
  fichesSuivi = signal<FicheSuivi[]>([]);
  fichesIndicateurs = signal<FicheIndicateur[]>([]);

  constructor() {
    // Re-generate or initialize mock data when projects and PTAs are available
    effect(() => {
      const ptaList = this.ptaService.ptaList$ || [];
      const projects = this.projectService.getProjectsSignal()();
      
      // We will generate mock data using T1-T4 2024-2026 periods
      this.initializeMockData(projects);
    }, { allowSignalWrites: true });
  }

  private initializeMockData(projects: Project[]) {
    // Extract all activities across projects
    const ptaActivities: PTAActivity[] = [];
    projects.forEach(project => {
      if (project.activities) {
        project.activities.forEach(activity => {
          const startDate = new Date(activity.startDate);
          const endDate = new Date(activity.endDate);
          const budget = activity.budget;
          const getQuarter = (date: Date) => Math.ceil((date.getMonth() + 1) / 3);
          const startQ = getQuarter(startDate);
          const endQ = getQuarter(endDate);
          const trimestres: string[] = [];
          const budgetByQ: any = { T1: 0, T2: 0, T3: 0, T4: 0 };
          
          for (let q = startQ; q <= endQ; q++) {
            trimestres.push(`T${q}`);
            budgetByQ[`T${q}`] = budget / (endQ - startQ + 1);
          }
          const nature = activity.nature || 'Travaux';
          const deliverables = (activity.deliverables || []).map((del, idx) => ({
            id: `del-${activity.id}-${idx}`,
            unit: del.uniteMesure?.name || del.unit || "",
            targetValue: del.targetValue,
            name: del.uniteMesure?.name || del.name || "",
          }));

          ptaActivities.push({
            id: `pta-${activity.id}`,
            activityId: activity.id,
            name: activity.name,
            project: project.name,
            projectId: project.id,
            budgetTotal: budget,
            budgetT1: budgetByQ.T1, budgetT2: budgetByQ.T2, budgetT3: budgetByQ.T3, budgetT4: budgetByQ.T4,
            deliverables: deliverables as any, trimestres,
            responsable: activity.responsible || project.responsible,
            nature, description: activity.description,
          });
        });
      }
    });

    const collectesList: Collecte[] = [];
    const fichesList: FicheSuivi[] = [];
    const fichesIndsList: FicheIndicateur[] = [];

    const projectIds = Array.from(new Set(ptaActivities.map(a => a.projectId)));

    const periodes: { year: number; trimestre: "T1" | "T2" | "T3" | "T4"; date: string; status: "cloturee" | "en_cours"; ratio: number }[] = [
      { year: 2024, trimestre: "T1", date: "2024-03-25", status: "cloturee", ratio: 0.20 },
      { year: 2024, trimestre: "T2", date: "2024-06-25", status: "cloturee", ratio: 0.45 },
      { year: 2024, trimestre: "T3", date: "2024-09-25", status: "cloturee", ratio: 0.70 },
      { year: 2024, trimestre: "T4", date: "2024-12-20", status: "cloturee", ratio: 1.00 },
      { year: 2025, trimestre: "T1", date: "2025-03-25", status: "cloturee", ratio: 0.22 },
      { year: 2025, trimestre: "T2", date: "2025-06-25", status: "cloturee", ratio: 0.50 },
      { year: 2025, trimestre: "T3", date: "2025-09-25", status: "cloturee", ratio: 0.75 },
      { year: 2025, trimestre: "T4", date: "2025-12-20", status: "cloturee", ratio: 0.95 },
      { year: 2026, trimestre: "T1", date: "2026-03-25", status: "cloturee", ratio: 0.18 },
      { year: 2026, trimestre: "T2", date: "2026-06-15", status: "en_cours", ratio: 0.35 },
    ];

    projectIds.forEach((projectId) => {
      const projectActivities = ptaActivities.filter(a => a.projectId === projectId);
      const projectName = projectActivities[0]?.project || "";
      const projectCode = projectId.slice(0, 4).toUpperCase();
      const project = projects.find(p => p.id === projectId);
      const projectIndicators = project?.indicators || [];

      periodes.forEach((periode, pIdx) => {
        const collecteId = `col-${projectId}-${periode.year}-${periode.trimestre}`;
        const dateCollecte = periode.date;
        const ptaId = periode.year === 2024 ? "pta-2024-1" : periode.year === 2025 ? "pta-2025-1" : "pta-2026-1";

        const collecte: Collecte = {
          id: collecteId,
          code: generateCollecteCode(projectCode, dateCollecte),
          projectId,
          projectName,
          ptaId,
          dateCollecte,
          description: `Collecte ${periode.trimestre} ${periode.year}`,
          createdAt: dateCollecte,
          createdBy: "Admin",
          status: periode.status,
        };
        collectesList.push(collecte);

        projectActivities.forEach((activity, aIdx) => {
          const workflow = getWorkflowForNature(activity.nature, DEFAULT_WORKFLOWS);
          const stepCount = workflow?.steps.length || 1;
          const stepIdx = Math.min(Math.floor(periode.ratio * stepCount), stepCount - 1);
          const currentStep = workflow?.steps[stepIdx];
          const progressPercentage = Math.min(100, Math.round(periode.ratio * 100));
          const depensesCumulees = Math.round(activity.budgetTotal * periode.ratio * 0.92);

          let status: FicheSuiviStatus;
          if (periode.status === "cloturee") {
            status = (aIdx + pIdx) % 5 === 0 ? "valide" : "approuve";
          } else {
            const mod = (aIdx + pIdx) % 4;
            status = mod === 0 ? "brouillon" : mod === 1 ? "soumis" : mod === 2 ? "valide" : "approuve";
          }

          fichesList.push({
            id: `fiche-${collecteId}-${activity.activityId}`,
            code: generateFicheSuiviCode(projectCode, (activity.activityId || '').slice(0, 4).toUpperCase(), dateCollecte),
            collecteId,
            dateCollecte,
            projectId: activity.projectId,
            projectName: activity.project,
            activityId: activity.activityId || '',
            activityName: activity.name,
            budgetPrevu: activity.budgetTotal,
            depensesCumulees,
            workflowId: workflow?.id,
            workflowName: workflow?.name,
            currentStepId: currentStep?.id,
            currentStepName: currentStep?.name,
            progressPercentage,
            livrables: activity.deliverables.map(del => ({
              livrableId: del.id,
              livrableName: del.unit,
              unit: del.unit,
              targetValue: del.targetValue,
              currentValue: Math.round(del.targetValue * periode.ratio),
            })),
            status,
            responsable: activity.responsable,
            observations: pIdx === 0 ? "Démarrage conforme au planning" : pIdx === periodes.length - 1 ? "Avancement satisfaisant" : "",
            createdAt: dateCollecte,
            submittedAt: status !== "brouillon" ? dateCollecte : undefined,
            validatedAt: status === "valide" || status === "approuve" ? dateCollecte : undefined,
            approvedAt: status === "approuve" ? dateCollecte : undefined,
            pointsCritiques: [
              {
                id: `pc-${collecteId}-${aIdx}`,
                titre: "Retard de livraison des intrants",
                description: "Problème logistique résolu avec le nouveau fournisseur.",
                niveau: "attention",
                statut: "resolu",
                dateIdentification: dateCollecte,
              }
            ],
            actionsSuivi: [
              {
                id: `act-suivi-${collecteId}-${aIdx}`,
                titre: "Vérifier la conformité des intrants",
                description: "Inspection physique par l'équipe projet",
                responsable: activity.responsable,
                echeance: dateCollecte,
                priorite: "normale",
                statut: "termine",
              }
            ]
          });
        });

        if (projectIndicators.length > 0) {
          const indicStatus: FicheSuiviStatus = periode.status === "cloturee" ? "approuve" : (pIdx % 2 === 0 ? "soumis" : "brouillon");
          const previousRatio = pIdx > 0 ? periodes[pIdx - 1].ratio : 0;
          
          fichesIndsList.push({
            id: `fiche-ind-${collecteId}`,
            code: `FI-${projectCode}-${dateCollecte.replace(/-/g, '')}`,
            collecteId,
            dateCollecte,
            projectId,
            projectName,
            indicateurs: projectIndicators.map(ind => ({
              indicateurId: ind.id,
              indicateurCode: ind.code,
              indicateurName: ind.name,
              unit: ind.unit,
              baselineValue: ind.baselineValue,
              targetValue: ind.targetValue,
              previousValue: Math.round(ind.baselineValue + (ind.targetValue - ind.baselineValue) * previousRatio),
              currentValue: Math.round(ind.baselineValue + (ind.targetValue - ind.baselineValue) * periode.ratio),
              comment: "",
            })),
            status: indicStatus,
            responsable: project?.responsible || "",
            observations: "",
            createdAt: dateCollecte,
            submittedAt: indicStatus !== "brouillon" ? dateCollecte : undefined,
            validatedAt: indicStatus === "approuve" ? dateCollecte : undefined,
            approvedAt: indicStatus === "approuve" ? dateCollecte : undefined,
          });
        }
      });
    });

    this.collectes.set(collectesList);
    this.fichesSuivi.set(fichesList);
    this.fichesIndicateurs.set(fichesIndsList);
  }

  // State action handlers
  updateFicheSuivi(fiche: FicheSuivi) {
    this.fichesSuivi.update(fiches => fiches.map(f => f.id === fiche.id ? { ...fiche, updatedAt: new Date().toISOString() } : f));
  }

  updateFicheIndicateur(fiche: FicheIndicateur) {
    this.fichesIndicateurs.update(fiches => fiches.map(f => f.id === fiche.id ? { ...fiche, updatedAt: new Date().toISOString() } : f));
  }

  createCollecte(newCollecte: Collecte, selectedActivities: { activityId: string; nature: string; name: string; budgetTotal: number; deliverables: any[]; responsable: string }[], projectIndicators: any[]) {
    // 1. Add collecte
    this.collectes.update(list => [newCollecte, ...list]);

    // 2. Add matching activities Fiches
    const newFiches: FicheSuivi[] = selectedActivities.map((act, aIdx) => {
      const workflow = getWorkflowForNature(act.nature, DEFAULT_WORKFLOWS);
      const firstStep = workflow?.steps[0];
      return {
        id: `fiche-${newCollecte.id}-${act.activityId}`,
        code: generateFicheSuiviCode(newCollecte.code.slice(4, 8), act.activityId.slice(0, 4).toUpperCase(), newCollecte.dateCollecte),
        collecteId: newCollecte.id,
        dateCollecte: newCollecte.dateCollecte,
        projectId: newCollecte.projectId,
        projectName: newCollecte.projectName,
        activityId: act.activityId,
        activityName: act.name,
        budgetPrevu: act.budgetTotal,
        depensesCumulees: 0,
        workflowId: workflow?.id,
        workflowName: workflow?.name,
        currentStepId: firstStep?.id,
        currentStepName: firstStep?.name,
        progressPercentage: 0,
        livrables: act.deliverables.map(del => ({
          livrableId: del.id,
          livrableName: del.unit,
          unit: del.unit,
          targetValue: del.targetValue,
          currentValue: 0,
        })),
        status: "brouillon" as const,
        responsable: act.responsable,
        createdAt: new Date().toISOString(),
        pointsCritiques: [],
        actionsSuivi: []
      };
    });

    this.fichesSuivi.update(list => [...newFiches, ...list]);

    // 3. Add indicator Fiche if indicators exist
    if (projectIndicators && projectIndicators.length > 0) {
      const newFicheInd: FicheIndicateur = {
        id: `fiche-ind-${newCollecte.id}`,
        code: `FI-${newCollecte.code.slice(4, 8)}-${newCollecte.dateCollecte.replace(/-/g, '')}`,
        collecteId: newCollecte.id,
        dateCollecte: newCollecte.dateCollecte,
        projectId: newCollecte.projectId,
        projectName: newCollecte.projectName,
        indicateurs: projectIndicators.map(ind => ({
          indicateurId: ind.id,
          indicateurCode: ind.code,
          indicateurName: ind.name,
          unit: ind.unit,
          baselineValue: ind.baselineValue,
          targetValue: ind.targetValue,
          previousValue: ind.baselineValue,
          currentValue: ind.baselineValue,
          comment: "",
        })),
        status: "brouillon" as const,
        responsable: newCollecte.createdBy,
        createdAt: new Date().toISOString(),
      };
      this.fichesIndicateurs.update(list => [newFicheInd, ...list]);
    }
  }

  cloturerCollecte(collecteId: string) {
    this.collectes.update(list => list.map(c => c.id === collecteId ? { ...c, status: "cloturee", closedAt: new Date().toISOString(), closedBy: "Admin" } : c));
  }
}
