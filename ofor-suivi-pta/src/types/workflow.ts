// Types pour les workflows de suivi

export interface WorkflowStep {
  id: string;
  code: string;
  name: string;
  order: number;
  description?: string;
  isFinal?: boolean; // Étape finale (ex: "Terminé")
  color?: string; // Couleur pour l'affichage
}

export interface Workflow {
  id: string;
  code: string;
  name: string;
  description?: string;
  // Nature(s) d'activité concernée(s)
  natures: string[];
  steps: WorkflowStep[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types pour les points critiques
export type PointCritiqueNiveau = "info" | "attention" | "critique";
export type PointCritiqueStatut = "ouvert" | "en_cours" | "resolu";

export interface PointCritique {
  id: string;
  titre: string;
  description: string;
  niveau: PointCritiqueNiveau;
  statut: PointCritiqueStatut;
  dateIdentification: string;
  dateResolution?: string;
}

// Types pour les actions de suivi
export type ActionSuiviStatut = "a_faire" | "en_cours" | "termine" | "annule";
export type ActionSuiviPriorite = "basse" | "normale" | "haute" | "urgente";

export interface ActionSuivi {
  id: string;
  titre: string;
  description?: string;
  responsable: string;
  echeance: string;
  priorite: ActionSuiviPriorite;
  statut: ActionSuiviStatut;
  dateRealisation?: string;
  pointCritiqueId?: string; // Lien optionnel avec un point critique
}

export const POINT_CRITIQUE_NIVEAU_LABELS: Record<PointCritiqueNiveau, string> = {
  info: "Information",
  attention: "Attention",
  critique: "Critique",
};

export const POINT_CRITIQUE_STATUT_LABELS: Record<PointCritiqueStatut, string> = {
  ouvert: "Ouvert",
  en_cours: "En cours de traitement",
  resolu: "Résolu",
};

export const ACTION_SUIVI_STATUT_LABELS: Record<ActionSuiviStatut, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

export const ACTION_SUIVI_PRIORITE_LABELS: Record<ActionSuiviPriorite, string> = {
  basse: "Basse",
  normale: "Normale",
  haute: "Haute",
  urgente: "Urgente",
};

// Statut des fiches de suivi avec workflow
export type FicheSuiviStatus = "brouillon" | "soumis" | "valide" | "approuve";

// Collecte de données - regroupe les fiches d'un projet à une date donnée
export interface Collecte {
  id: string;
  code: string;
  projectId: string;
  projectName: string;
  // Rattachement obligatoire au PTA dont relève la collecte
  ptaId: string;
  dateCollecte: string; // Date de collecte (format: yyyy-MM-dd)
  description?: string;
  // Métadonnées
  createdAt: string;
  createdBy: string;
  status: "en_cours" | "cloturee";
  closedAt?: string;
  closedBy?: string;
}

// Fiche de suivi (liée à une collecte)
export interface FicheSuivi {
  id: string;
  code: string;
  collecteId: string; // Lien vers la collecte parente
  dateCollecte: string; // Date de collecte (format: yyyy-MM-dd)
  projectId: string;
  projectName: string;
  activityId: string;
  activityName: string;
  // Budget
  budgetPrevu: number;
  depensesCumulees: number; // Dépenses cumulées depuis le début
  // Avancement workflow
  workflowId?: string;
  workflowName?: string;
  currentStepId?: string;
  currentStepName?: string;
  progressPercentage: number;
  // Performances trimestrielles (historique)
  performancesTrimestres?: {
    t1: number | null;
    t2: number | null;
    t3: number | null;
    t4: number | null;
  };
  // Livrables
  livrables: {
    livrableId: string;
    livrableName: string;
    unit: string;
    targetValue: number;
    currentValue: number; // Valeur cumulée réalisée
  }[];
  // Points critiques et actions de suivi
  pointsCritiques?: PointCritique[];
  actionsSuivi?: ActionSuivi[];
  // Workflow de validation de la fiche
  status: FicheSuiviStatus;
  responsable: string;
  observations?: string;
  // Historique
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
}

// Fiche indicateurs (pour saisir les valeurs réalisées des indicateurs projet dans une collecte)
export interface FicheIndicateur {
  id: string;
  code: string;
  collecteId: string;
  dateCollecte: string;
  projectId: string;
  projectName: string;
  // Valeurs des indicateurs
  indicateurs: {
    indicateurId: string;
    indicateurCode: string;
    indicateurName: string;
    unit: string;
    baselineValue: number;
    targetValue: number;
    previousValue: number; // Valeur de la collecte précédente
    currentValue: number; // Valeur saisie pour cette collecte
    comment?: string;
  }[];
  // Workflow de validation
  status: FicheSuiviStatus;
  responsable: string;
  observations?: string;
  // Historique
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
}

// Alias pour compatibilité
export type FicheHebdo = FicheSuivi;

// Générer le code de collecte
export const generateCollecteCode = (projectCode: string, dateCollecte: string): string => {
  const date = new Date(dateCollecte);
  const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  return `COL-${projectCode}-${dateStr}`;
};

// Workflows par défaut selon la nature d'activité
export const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: "wf-travaux-1",
    code: "WF-TRAVAUX",
    name: "Workflow Travaux",
    description: "Workflow standard pour les activités de travaux",
    natures: ["travaux"],
    steps: [
      { id: "s1", code: "PREP", name: "Préparation", order: 1, color: "bg-slate-500" },
      { id: "s2", code: "LANC", name: "Lancement", order: 2, color: "bg-blue-500" },
      { id: "s3", code: "EXEC", name: "Exécution", order: 3, color: "bg-amber-500" },
      { id: "s4", code: "RECEP", name: "Réception provisoire", order: 4, color: "bg-purple-500" },
      { id: "s5", code: "TERM", name: "Réception définitive", order: 5, isFinal: true, color: "bg-green-500" },
    ],
    isDefault: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "wf-etude-1",
    code: "WF-ETUDE",
    name: "Workflow Études",
    description: "Workflow standard pour les études et diagnostics",
    natures: ["etude"],
    steps: [
      { id: "s1", code: "TDR", name: "Élaboration TDR", order: 1, color: "bg-slate-500" },
      { id: "s2", code: "SELECT", name: "Sélection prestataire", order: 2, color: "bg-blue-500" },
      { id: "s3", code: "REAL", name: "Réalisation", order: 3, color: "bg-amber-500" },
      { id: "s4", code: "VALID", name: "Validation", order: 4, color: "bg-purple-500" },
      { id: "s5", code: "TERM", name: "Terminé", order: 5, isFinal: true, color: "bg-green-500" },
    ],
    isDefault: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "wf-formation-1",
    code: "WF-FORMATION",
    name: "Workflow Formation",
    description: "Workflow standard pour les formations",
    natures: ["formation"],
    steps: [
      { id: "s1", code: "PLAN", name: "Planification", order: 1, color: "bg-slate-500" },
      { id: "s2", code: "PREP", name: "Préparation matériel", order: 2, color: "bg-blue-500" },
      { id: "s3", code: "EXEC", name: "Exécution", order: 3, color: "bg-amber-500" },
      { id: "s4", code: "EVAL", name: "Évaluation", order: 4, color: "bg-purple-500" },
      { id: "s5", code: "TERM", name: "Terminé", order: 5, isFinal: true, color: "bg-green-500" },
    ],
    isDefault: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "wf-equipement-1",
    code: "WF-EQUIPEMENT",
    name: "Workflow Équipement",
    description: "Workflow standard pour les acquisitions d'équipement",
    natures: ["equipement"],
    steps: [
      { id: "s1", code: "SPEC", name: "Spécifications", order: 1, color: "bg-slate-500" },
      { id: "s2", code: "DAO", name: "Appel d'offres", order: 2, color: "bg-blue-500" },
      { id: "s3", code: "ATTR", name: "Attribution", order: 3, color: "bg-amber-500" },
      { id: "s4", code: "LIV", name: "Livraison", order: 4, color: "bg-purple-500" },
      { id: "s5", code: "INST", name: "Installation", order: 5, color: "bg-indigo-500" },
      { id: "s6", code: "TERM", name: "Réception", order: 6, isFinal: true, color: "bg-green-500" },
    ],
    isDefault: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "wf-simple-1",
    code: "WF-SIMPLE",
    name: "Workflow Simple",
    description: "Workflow générique à 3 étapes",
    natures: ["sensibilisation", "suivi", "autre"],
    steps: [
      { id: "s1", code: "DEM", name: "Démarré", order: 1, color: "bg-blue-500" },
      { id: "s2", code: "COURS", name: "En cours", order: 2, color: "bg-amber-500" },
      { id: "s3", code: "TERM", name: "Terminé", order: 3, isFinal: true, color: "bg-green-500" },
    ],
    isDefault: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

// Obtenir le workflow par défaut pour une nature d'activité
export const getWorkflowForNature = (nature: string, workflows: Workflow[] = DEFAULT_WORKFLOWS): Workflow | undefined => {
  return workflows.find(wf => wf.natures.includes(nature)) || workflows.find(wf => wf.code === "WF-SIMPLE");
};

// Calculer le pourcentage d'avancement basé sur l'étape du workflow
export const calculateWorkflowProgress = (currentStepId: string | undefined, workflow: Workflow): number => {
  if (!currentStepId || !workflow) return 0;
  const step = workflow.steps.find(s => s.id === currentStepId);
  if (!step) return 0;
  return Math.round((step.order / workflow.steps.length) * 100);
};

// Générer le code de fiche de suivi
export const generateFicheSuiviCode = (projectCode: string, activityCode: string, dateCollecte: string): string => {
  const date = new Date(dateCollecte);
  const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  return `FS-${projectCode}-${activityCode}-${dateStr}`;
};

// Alias pour compatibilité
export const generateFicheHebdoCode = generateFicheSuiviCode;
