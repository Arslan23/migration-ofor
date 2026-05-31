import { ZoneIntervention } from "@/data/geoData";
import { AffectationPersonnel } from "@/data/personnel";
import { Comment } from "@/types/comment";
import { Attachment } from "@/types/attachment";

export type ProjectStatus = "en_cours" | "termine" | "retard" | "planifie" | "suspendu";
export type ActivityStatus = "planifie" | "en_cours" | "termine" | "annule";
export type FicheStatus = "brouillon" | "soumis" | "valide" | "rejete";
export type IndicatorType = "quantitatif" | "qualitatif";
export type ActivityNature = "etude" | "travaux" | "formation" | "equipement" | "sensibilisation" | "suivi" | "autre";

export type { ZoneIntervention } from "@/data/geoData";
export type { AffectationPersonnel, RoleProjet, Personnel } from "@/data/personnel";

// Devises supportées
export type Currency = "XOF" | "EUR" | "USD" | "GBP" | "CHF" | "JPY" | "CNY" | "SAR" | "KWD" | "AED";

// Financement (par bailleur) d'un projet
export interface ProjectFinancement {
  id: string;
  bailleur: string;       // nom du bailleur (référentiel)
  amount: number;         // montant dans la devise
  currency: Currency;     // devise du financement
  amountFCFA: number;     // équivalent FCFA pour calculs
}

export interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "XOF", name: "Franc CFA (FCFA)", symbol: "FCFA" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "USD", name: "Dollar US", symbol: "$" },
  { code: "GBP", name: "Livre Sterling", symbol: "£" },
  { code: "CHF", name: "Franc Suisse", symbol: "CHF" },
  { code: "JPY", name: "Yen Japonais", symbol: "¥" },
  { code: "CNY", name: "Yuan Chinois", symbol: "¥" },
  { code: "SAR", name: "Riyal Saoudien", symbol: "SAR" },
  { code: "KWD", name: "Dinar Koweïtien", symbol: "KWD" },
  { code: "AED", name: "Dirham Émirats", symbol: "AED" },
];

// Liste des entités d'exécution
export const ENTITES_EXECUTION = [
  "OFOR",
  "Entreprise privée",
  "Bureau d'études",
  "ONG",
  "Collectivité locale",
  "Service déconcentré de l'État",
  "Agence d'exécution",
  "Partenaire technique",
  "Autre",
];

// Labels pour les natures d'activité
export const ACTIVITY_NATURE_LABELS: Record<ActivityNature, string> = {
  etude: "Étude",
  travaux: "Travaux",
  formation: "Formation",
  equipement: "Équipement",
  sensibilisation: "Sensibilisation",
  suivi: "Suivi & Évaluation",
  autre: "Autre",
};

// Indicateur de performance au niveau projet
export interface Indicator {
  id: string;
  code: string;
  name: string;
  type: IndicatorType;
  unit: string;
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  description?: string;
  // Lien avec les livrables des activités
  linkedDeliverableIds?: string[];
}

// Unité de mesure enrichie
export interface UniteMesure {
  id: string;
  code: string;
  name: string;
  description?: string;
  nature?: ActivityNature;
}

// Livrable au niveau activité (produit attendu)
export interface Deliverable {
  id: string;
  // Référence vers l'unité de mesure (optionnel - nouveau système)
  uniteMesureId?: string;
  uniteMesure?: UniteMesure;
  // Champs hérités pour compatibilité (utilisés si pas d'unité de mesure rattachée)
  code?: string;
  name?: string;
  unit?: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  // Référence vers l'indicateur de performance projet qu'il alimente
  linkedPerformanceIndicatorId?: string;
}

// Alias pour compatibilité arrière
export type ProductIndicator = Deliverable;
export type Objective = Deliverable;

// Unités de mesure prédéfinies par nature d'activité
export const UNITES_MESURE_BY_NATURE: Record<string, UniteMesure[]> = {
  etude: [
    { id: "etude-1", code: "ETU", name: "Études", description: "Études techniques ou de faisabilité" },
    { id: "etude-2", code: "RAP", name: "Rapports", description: "Rapports d'étude ou d'analyse" },
    { id: "etude-3", code: "DIA", name: "Diagnostics", description: "Diagnostics techniques ou organisationnels" },
    { id: "etude-4", code: "SIT", name: "Sites identifiés", description: "Sites ou emplacements identifiés" },
    { id: "etude-5", code: "DOS", name: "Dossiers", description: "Dossiers techniques ou administratifs" },
    { id: "etude-6", code: "CAR", name: "Cartes", description: "Cartes ou plans" },
  ],
  travaux: [
    { id: "travaux-1", code: "FOR", name: "Forages", description: "Forages réalisés" },
    { id: "travaux-2", code: "KM", name: "Km", description: "Kilomètres de réseau" },
    { id: "travaux-3", code: "OUV", name: "Ouvrages", description: "Ouvrages hydrauliques" },
    { id: "travaux-4", code: "BAT", name: "Bâtiments", description: "Bâtiments construits" },
    { id: "travaux-5", code: "RES", name: "Réservoirs", description: "Réservoirs de stockage" },
    { id: "travaux-6", code: "BRA", name: "Branchements", description: "Branchements particuliers" },
  ],
  formation: [
    { id: "formation-1", code: "PFO", name: "Personnes formées", description: "Nombre de personnes formées" },
    { id: "formation-2", code: "SES", name: "Sessions", description: "Sessions de formation" },
    { id: "formation-3", code: "ASU", name: "ASUFOR", description: "Associations d'usagers formées" },
    { id: "formation-4", code: "OPE", name: "Opérateurs", description: "Opérateurs formés" },
    { id: "formation-5", code: "MOD", name: "Modules", description: "Modules de formation" },
    { id: "formation-6", code: "JOU", name: "Jours", description: "Jours de formation" },
  ],
  equipement: [
    { id: "equipement-1", code: "POM", name: "Pompes", description: "Pompes installées" },
    { id: "equipement-2", code: "GEL", name: "Groupes électrogènes", description: "Groupes électrogènes" },
    { id: "equipement-3", code: "VEH", name: "Véhicules", description: "Véhicules acquis" },
    { id: "equipement-4", code: "EQU", name: "Équipements", description: "Équipements divers" },
    { id: "equipement-5", code: "KIT", name: "Kits", description: "Kits d'équipement" },
    { id: "equipement-6", code: "COM", name: "Compteurs", description: "Compteurs installés" },
  ],
  sensibilisation: [
    { id: "sensibilisation-1", code: "SEA", name: "Séances", description: "Séances de sensibilisation" },
    { id: "sensibilisation-2", code: "VIL", name: "Villages", description: "Villages sensibilisés" },
    { id: "sensibilisation-3", code: "BEN", name: "Bénéficiaires", description: "Bénéficiaires touchés" },
    { id: "sensibilisation-4", code: "CAM", name: "Campagnes", description: "Campagnes de sensibilisation" },
    { id: "sensibilisation-5", code: "SUP", name: "Supports", description: "Supports de communication" },
  ],
  suivi: [
    { id: "suivi-1", code: "MIS", name: "Missions", description: "Missions de suivi" },
    { id: "suivi-2", code: "RAP", name: "Rapports", description: "Rapports de suivi" },
    { id: "suivi-3", code: "EVA", name: "Évaluations", description: "Évaluations réalisées" },
    { id: "suivi-4", code: "AUD", name: "Audits", description: "Audits effectués" },
    { id: "suivi-5", code: "VIS", name: "Visites", description: "Visites de terrain" },
  ],
  autre: [
    { id: "autre-1", code: "UNI", name: "Unités", description: "Unités diverses" },
    { id: "autre-2", code: "LOT", name: "Lots", description: "Lots d'éléments" },
    { id: "autre-3", code: "ACT", name: "Actions", description: "Actions réalisées" },
  ],
};

// Helper pour obtenir toutes les unités de mesure
export const getAllUnitesMesure = (): UniteMesure[] => {
  return Object.values(UNITES_MESURE_BY_NATURE).flat();
};

// Helper pour obtenir une unité par son ID
export const getUniteMesureById = (id: string): UniteMesure | undefined => {
  return getAllUnitesMesure().find(u => u.id === id);
};

// Helper pour obtenir le code d'un livrable (depuis unité de mesure ou champ direct)
export const getDeliverableCode = (deliverable: Deliverable): string => {
  if (deliverable.uniteMesure) return deliverable.uniteMesure.code;
  if (deliverable.uniteMesureId) {
    const unite = getUniteMesureById(deliverable.uniteMesureId);
    if (unite) return unite.code;
  }
  return deliverable.code || "";
};

// Helper pour obtenir le nom d'un livrable
export const getDeliverableName = (deliverable: Deliverable): string => {
  if (deliverable.uniteMesure) return deliverable.uniteMesure.name;
  if (deliverable.uniteMesureId) {
    const unite = getUniteMesureById(deliverable.uniteMesureId);
    if (unite) return unite.name;
  }
  return deliverable.name || "";
};

// Helper pour obtenir l'unité d'un livrable
export const getDeliverableUnit = (deliverable: Deliverable): string => {
  if (deliverable.uniteMesure) return deliverable.uniteMesure.name;
  if (deliverable.uniteMesureId) {
    const unite = getUniteMesureById(deliverable.uniteMesureId);
    if (unite) return unite.name;
  }
  return deliverable.unit || "";
};

// Helper pour obtenir la description d'un livrable
export const getDeliverableDescription = (deliverable: Deliverable): string => {
  if (deliverable.uniteMesure) return deliverable.uniteMesure.description || "";
  if (deliverable.uniteMesureId) {
    const unite = getUniteMesureById(deliverable.uniteMesureId);
    if (unite) return unite.description || "";
  }
  return deliverable.description || "";
};

// Compatibilité: anciennes unités simples par nature
export const UNITS_BY_NATURE: Record<string, string[]> = {
  etude: ["études", "rapports", "diagnostics", "sites identifiés", "dossiers", "cartes"],
  travaux: ["forages", "km", "ouvrages", "bâtiments", "réservoirs", "branchements"],
  formation: ["personnes formées", "sessions", "ASUFOR", "opérateurs", "modules", "jours"],
  equipement: ["pompes", "groupes électrogènes", "véhicules", "équipements", "kits", "compteurs"],
  sensibilisation: ["séances", "villages", "bénéficiaires", "campagnes", "supports"],
  suivi: ["missions", "rapports", "évaluations", "audits", "visites"],
  autre: ["unités", "lots", "actions"],
};

// Fiche de suivi liée à une activité
export interface FicheSuivi {
  id: string;
  code: string;
  date: string;
  period: string;
  status: FicheStatus;
  author: string;
  submittedAt?: string;
  validatedAt?: string;
  validatedBy?: string;
  observations?: string;
  // Réalisations des livrables de l'activité
  deliverables: {
    deliverableId: string;
    plannedValue: number;
    actualValue: number;
    comment?: string;
  }[];
  // Avancement de l'activité
  activityProgress: number;
  activitySpent: number;
  // Documents et commentaires
  attachments?: Attachment[];
  comments?: Comment[];
}

// Activité
export interface Activity {
  id: string;
  code: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: ActivityStatus;
  responsible: string;
  progress: number;
  // Entité d'exécution de l'activité
  entiteExecution?: string;
  // Service OFOR responsable (hérité du projet)
  serviceResponsableId?: string;
  // Nature de l'activité
  nature?: ActivityNature;
  // Zones d'intervention de l'activité
  zonesIntervention?: ZoneIntervention[];
  // Livrables de l'activité
  deliverables: Deliverable[];
  // Fiches de suivi de l'activité
  fichesSuivi: FicheSuivi[];
  // Documents et commentaires
  attachments?: Attachment[];
  comments?: Comment[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  region: string;
  // Zones d'intervention du projet (remplace zones: string[])
  zonesIntervention?: ZoneIntervention[];
  bailleur: string; // Bailleur principal / chef de file (compatibilité)
  // Financements multiples (multi-bailleur)
  financements?: ProjectFinancement[];
  // Budget et devise
  budget: number;
  currency: Currency;
  budgetFCFA: number; // Équivalent en FCFA pour les calculs
  spent?: number;
  startDate: string;
  endDate: string;
  progress: number;
  status: ProjectStatus;
  // Équipe projet (nouveau système basé sur le référentiel personnel)
  equipeProjet?: AffectationPersonnel[];
  // Champs legacy pour compatibilité
  responsible: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  objectives?: string;
  // Entité d'exécution du projet
  entiteExecution?: string;
  // Service de l'OFOR responsable du suivi du projet (hérité par les activités)
  serviceResponsableId?: string;
  // Indicateurs de performance du projet
  indicators: Indicator[];
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormData {
  code: string;
  name: string;
  description?: string;
  region: string;
  zonesIntervention?: ZoneIntervention[];
  bailleur: string;
  financements?: ProjectFinancement[];
  budget: number;
  currency: Currency;
  budgetFCFA: number;
  startDate: string;
  endDate: string;
  equipeProjet?: AffectationPersonnel[];
  // Champs legacy pour compatibilité
  responsible: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  objectives?: string;
  entiteExecution?: string;
  serviceResponsableId?: string;
}

export const REGIONS = [
  "Dakar",
  "Diourbel",
  "Fatick",
  "Kaffrine",
  "Kaolack",
  "Kédougou",
  "Kolda",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sédhiou",
  "Tambacounda",
  "Thiès",
  "Ziguinchor",
  "National",
];

export const BAILLEURS = [
  "État du Sénégal",
  "BAD",
  "BADEA",
  "BID",
  "AFD",
  "UE",
  "Banque Mondiale",
  "JICA",
  "KfW",
  "Coopération Espagnole",
  "Autre",
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  en_cours: "En cours",
  termine: "Terminé",
  retard: "En retard",
  planifie: "Planifié",
  suspendu: "Suspendu",
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

export const FICHE_STATUS_LABELS: Record<FicheStatus, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  valide: "Validé",
  rejete: "Rejeté",
};