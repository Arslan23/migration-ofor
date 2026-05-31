import { Indicator } from "./project.model";
import { Comment } from "./comment.model";
import { Attachment } from "./attachment.model";

export type PTAStatus = "brouillon" | "ouvert" | "cloture" | "archive";

export const PTA_STATUS_LABELS: Record<PTAStatus, string> = {
    brouillon: "Brouillon",
    ouvert: "Ouvert",
    cloture: "Clôturé",
    archive: "Archivé",
};

export const PTA_STATUS_COLORS: Record<PTAStatus, string> = {
    brouillon: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    ouvert: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    cloture: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    archive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

// Statut de validation des éléments PTA (activités et indicateurs)
export type PTAItemValidationStatus = "brouillon" | "valide";

export const PTA_ITEM_VALIDATION_LABELS: Record<PTAItemValidationStatus, string> = {
    brouillon: "Brouillon",
    valide: "Validé",
};

export const PTA_ITEM_VALIDATION_COLORS: Record<PTAItemValidationStatus, string> = {
    brouillon: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
    valide: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export interface PTADeliverable {
    id: string;
    unit: string;
    targetValue: number;
    currentValue?: number;
    targetT1?: number;
    targetT2?: number;
    targetT3?: number;
    targetT4?: number;
}

export interface PTAIndicatorPlanning {
    indicatorId: string;
    indicatorName: string;
    indicatorCode: string;
    unit: string;
    baselineValue: number;
    annualTarget: number;
    targetT1: number;
    targetT2: number;
    targetT3: number;
    targetT4: number;
    currentT1?: number;
    currentT2?: number;
    currentT3?: number;
    currentT4?: number;
    // Statut de validation
    validationStatus?: PTAItemValidationStatus;
    validatedAt?: string;
    validatedBy?: string;
}

export interface PTAActivity {
    id: string;
    name: string;
    project: string;
    projectId: string;
    activityId?: string;
    budgetTotal: number;
    budgetT1: number;
    budgetT2: number;
    budgetT3: number;
    budgetT4: number;
    deliverables: PTADeliverable[];
    trimestres: string[];
    responsable: string;
    nature: string;
    description?: string;
    serviceResponsableId?: string;
    operationId?: string;
    operationName?: string;
    // Documents et commentaires
    attachments?: Attachment[];
    comments?: Comment[];
    // Statut de validation
    validationStatus?: PTAItemValidationStatus;
    validatedAt?: string;
    validatedBy?: string;
}

export interface PTA {
    id: string;
    code: string;
    name: string;
    year: number;
    status: PTAStatus;
    version: number;
    description?: string;
    createdAt: string;
    createdBy: string;
    openedAt?: string;
    openedBy?: string;
    closedAt?: string;
    closedBy?: string;
    activities: PTAActivity[];
    indicators: PTAIndicatorPlanning[];
    totalBudget: number;
    // Pour le versioning
    previousVersionId?: string;
}

// Générer un code PTA
export const generatePTACode = (year: number, version: number): string => {
    return `PTA-${year}-V${version.toString().padStart(2, '0')}`;
};
