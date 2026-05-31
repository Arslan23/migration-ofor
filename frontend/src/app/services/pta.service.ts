import { Injectable, inject, effect } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { PTA, PTAActivity, PTAIndicatorPlanning, PTAStatus, generatePTACode } from '../models/pta.model';
import { ProjectService } from './project.service';
import { Project } from '../models/project.model';
import { generateStandalonePTAActivities } from '../data/standalone-pta-activities.data';

@Injectable({
    providedIn: 'root'
})
export class PtaService {
    private projectService = inject(ProjectService);
    private ptaListSubject = new BehaviorSubject<PTA[]>([]);
    ptaList$ = this.ptaListSubject.asObservable();

    constructor() {
        effect(() => {
            const projects = this.projectService.getProjectsSignal()();
            this.rebuildPTAList(projects);
        });
    }

    private rebuildPTAList(projects: Project[]) {
        const sumBudget = (acts: PTAActivity[]) => acts.reduce((s, a) => s + a.budgetTotal, 0);

        // Generate activities and indicators for 3 exercises (2024, 2025, 2026)
        const activities2024 = [
            ...this.generatePTAActivitiesFromProjects(projects, 0),
            ...generateStandalonePTAActivities(0)
        ];
        const activities2025 = [
            ...this.generatePTAActivitiesFromProjects(projects, 1),
            ...generateStandalonePTAActivities(1)
        ];
        const activities2026 = [
            ...this.generatePTAActivitiesFromProjects(projects, 2),
            ...generateStandalonePTAActivities(2)
        ];

        const indicators2024 = this.generatePTAIndicatorsFromProjects(projects);
        const indicators2025 = this.generatePTAIndicatorsFromProjects(projects);
        const indicators2026 = this.generatePTAIndicatorsFromProjects(projects);

        const list: PTA[] = [
            {
                id: "pta-2024-1",
                code: "PTA-2024-V01",
                name: "Plan de Travail Annuel 2024",
                year: 2024,
                status: "archive",
                version: 1,
                description: "PTA archivé — exercice clôturé et historisé",
                createdAt: "2024-01-15T10:00:00Z",
                createdBy: "Système",
                openedAt: "2024-01-20T08:00:00Z",
                openedBy: "Direction",
                closedAt: "2024-12-31T23:59:00Z",
                closedBy: "Direction",
                activities: activities2024,
                indicators: indicators2024,
                totalBudget: sumBudget(activities2024),
            },
            {
                id: "pta-2025-1",
                code: "PTA-2025-V01",
                name: "Plan de Travail Annuel 2025",
                year: 2025,
                status: "cloture",
                version: 1,
                description: "PTA exercice 2025 — clôturé en attente d'archivage",
                createdAt: "2024-12-10T09:00:00Z",
                createdBy: "Système",
                openedAt: "2025-01-15T08:00:00Z",
                openedBy: "Direction",
                closedAt: "2025-12-31T23:59:00Z",
                closedBy: "Direction",
                activities: activities2025,
                indicators: indicators2025,
                totalBudget: sumBudget(activities2025),
                previousVersionId: "pta-2024-1",
            },
            {
                id: "pta-2026-1",
                code: "PTA-2026-V01",
                name: "Plan de Travail Annuel 2026",
                year: 2026,
                status: "ouvert",
                version: 1,
                description: "PTA en cours — exercice courant",
                createdAt: "2025-12-05T10:00:00Z",
                createdBy: "Système",
                openedAt: "2026-01-08T08:00:00Z",
                openedBy: "Direction",
                activities: activities2026,
                indicators: indicators2026,
                totalBudget: sumBudget(activities2026),
                previousVersionId: "pta-2025-1",
            }
        ];

        this.ptaListSubject.next(list);
    }

    getPTAs(): Observable<PTA[]> {
        return this.ptaList$;
    }

    getPTA(id: string): Observable<PTA | undefined> {
        const pta = this.ptaListSubject.value.find(p => p.id === id);
        return of(pta);
    }

    updatePTA(updatedPTA: PTA) {
        const current = this.ptaListSubject.value;
        const index = current.findIndex(p => p.id === updatedPTA.id);
        if (index > -1) {
            const next = [...current];
            next[index] = updatedPTA;
            this.ptaListSubject.next(next);
        }
    }

    createPTA(newPTA: PTA) {
        const current = this.ptaListSubject.value;
        this.ptaListSubject.next([...current, newPTA]);
    }

    // Generation Logic Ported from React
    private generatePTAActivitiesFromProjects(projects: Project[], yearSeed: number = 0): PTAActivity[] {
        const ptaActivities: PTAActivity[] = [];
        let counter = 0;

        projects.forEach(project => {
            if (project.activities && project.activities.length > 0) {
                project.activities.forEach(activity => {
                    const startDate = new Date(activity.startDate);
                    const endDate = new Date(activity.endDate);
                    const budget = activity.budget;

                    const getQuarter = (date: Date) => Math.ceil((date.getMonth() + 1) / 3);
                    const startQ = getQuarter(startDate);
                    const endQ = getQuarter(endDate);

                    const trimestres: string[] = [];
                    const budgetByQ: any = { T1: 0, T2: 0, T3: 0, T4: 0 };

                    const quarters: string[] = [];
                    for (let q = startQ; q <= endQ; q++) {
                        quarters.push(`T${q}`);
                        trimestres.push(`T${q}`);
                    }

                    const div = quarters.length || 1;
                    const budgetPerQuarter = budget / div;

                    quarters.forEach(q => {
                        budgetByQ[q] = budgetPerQuarter;
                    });

                    const nature = activity.nature ||
                        (activity.name.toLowerCase().includes('étude') ? 'Étude' :
                            activity.name.toLowerCase().includes('formation') ? 'Formation' :
                                activity.name.toLowerCase().includes('travaux') ? 'Travaux' :
                                    activity.name.toLowerCase().includes('installation') ? 'Équipement' : 'Travaux');

                    const deliverables = (activity.deliverables || []).map((del, idx) => {
                        const tv = del.targetValue || 0;
                        const per = quarters.length > 0 ? Math.floor(tv / quarters.length) : 0;
                        const rest = quarters.length > 0 ? tv - per * quarters.length : 0;
                        const tQ: { [key: string]: number } = { T1: 0, T2: 0, T3: 0, T4: 0 };
                        quarters.forEach((q, i) => { tQ[q] = per + (i === 0 ? rest : 0); });
                        return {
                            id: `del-${activity.id}-${idx}`,
                            unit: del.uniteMesure?.name || del.unit || "",
                            targetValue: tv,
                            targetT1: tQ['T1'],
                            targetT2: tQ['T2'],
                            targetT3: tQ['T3'],
                            targetT4: tQ['T4'],
                        };
                    });

                    const validationStatus = ((counter + yearSeed) % 10) < 7 ? "valide" : "brouillon";
                    counter++;

                    ptaActivities.push({
                        id: `pta-${yearSeed}-${activity.id}`,
                        activityId: activity.id,
                        name: activity.name,
                        project: project.name,
                        projectId: project.id,
                        serviceResponsableId: (project as any).serviceResponsableId,
                        budgetTotal: budget,
                        budgetT1: budgetByQ.T1,
                        budgetT2: budgetByQ.T2,
                        budgetT3: budgetByQ.T3,
                        budgetT4: budgetByQ.T4,
                        deliverables: deliverables,
                        trimestres: trimestres,
                        responsable: activity.responsible || project.responsible,
                        nature: nature,
                        description: activity.description,
                        validationStatus: validationStatus as any,
                        validatedAt: validationStatus === "valide" ? `${2024 + yearSeed}-02-15T10:00:00Z` : undefined,
                        validatedBy: validationStatus === "valide" ? "Direction" : undefined,
                    });
                });
            }
        });

        return ptaActivities;
    }

    private generatePTAIndicatorsFromProjects(projects: Project[]): PTAIndicatorPlanning[] {
        const indicators: PTAIndicatorPlanning[] = [];

        projects.forEach(project => {
            project.indicators?.forEach(indicator => {
                const annualTarget = Math.round(indicator.targetValue * 0.25);
                const perQuarter = Math.floor(annualTarget / 4);

                indicators.push({
                    indicatorId: indicator.id,
                    indicatorName: indicator.name,
                    indicatorCode: indicator.code,
                    unit: indicator.unit,
                    baselineValue: indicator.baselineValue,
                    annualTarget,
                    targetT1: perQuarter,
                    targetT2: perQuarter,
                    targetT3: perQuarter,
                    targetT4: perQuarter,
                });
            });
        });

        return indicators;
    }
}
