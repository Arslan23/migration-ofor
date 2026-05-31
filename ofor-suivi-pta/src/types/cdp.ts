import { Comment } from "./comment";
import { Attachment } from "./attachment";

// ==================== Statuts ====================

export type CDPStatus = "brouillon" | "actif" | "cloture" | "archive";

export const CDP_STATUS_LABELS: Record<CDPStatus, string> = {
  brouillon: "Brouillon",
  actif: "Actif",
  cloture: "Clôturé",
  archive: "Archivé",
};

export const CDP_STATUS_COLORS: Record<CDPStatus, string> = {
  brouillon: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  actif: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cloture: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  archive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

// Statut des fiches de suivi CDP (workflow complet)
export type CDPFicheSuiviStatus = "brouillon" | "soumis" | "valide" | "approuve";

export const CDP_FICHE_STATUS_LABELS: Record<CDPFicheSuiviStatus, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  valide: "Validé",
  approuve: "Approuvé",
};

export const CDP_FICHE_STATUS_COLORS: Record<CDPFicheSuiviStatus, string> = {
  brouillon: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
  soumis: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  valide: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  approuve: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

// ==================== Référentiels ====================

export interface CDPCategorie {
  id: string;
  code: string;
  name: string;
  description?: string;
  order: number;
}

export interface CDPComposante {
  id: string;
  code: string;
  name: string;
  description?: string;
  categorieId: string;
  categorieName?: string;
  order: number;
}

export interface CDPIndicateurRef {
  id: string;
  code: string;
  name: string;
  description?: string;
  composanteId: string;
  composanteName?: string;
  categorieId?: string;
  categorieName?: string;
  unit: string;
  /** Unités de mesure (référentiel UniteMesure.id) impliquées dans le calcul de cet indicateur */
  uniteMesureIds?: string[];
  formula?: string;
  source?: string;
  order: number;
}

// ==================== Contrat de Performance ====================

export interface CDPIndicateurCible {
  indicateurRefId: string;
  indicateurCode: string;
  indicateurName: string;
  composanteId: string;
  composanteName: string;
  unit: string;
  /** Hérité du référentiel — unités de mesure impliquées dans le calcul */
  uniteMesureIds?: string[];
  baselineValue: number;
  targetYear1: number;
  targetYear2: number;
  targetYear3: number;
}

export interface CDP {
  id: string;
  code: string;
  name: string;
  description?: string;
  startYear: number; // Année de début (sur 3 ans)
  endYear: number; // Année de fin
  status: CDPStatus;
  createdAt: string;
  createdBy: string;
  activatedAt?: string;
  activatedBy?: string;
  closedAt?: string;
  closedBy?: string;
  indicateurs: CDPIndicateurCible[];
}

// ==================== Évaluation annuelle ====================

export interface CDPEvaluationAnnuelle {
  id: string;
  cdpId: string;
  cdpName: string;
  year: number;
  status: CDPStatus;
  createdAt: string;
  createdBy: string;
  closedAt?: string;
  closedBy?: string;
}

// ==================== Fiches de suivi ====================

export interface CDPFicheSuiviIndicateur {
  id: string;
  evaluationId: string;
  indicateurRefId: string;
  indicateurCode: string;
  indicateurName: string;
  composanteId: string;
  composanteName: string;
  unit: string;
  /** Hérité du référentiel — unités de mesure impliquées dans le calcul */
  uniteMesureIds?: string[];
  targetValue: number; // Cible de l'année
  currentValue?: number; // Valeur réalisée
  performanceRate?: number; // Taux de performance (%)
  status: CDPFicheSuiviStatus;
  observations?: string;
  // Workflow
  submittedAt?: string;
  submittedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  // Documents et commentaires
  attachments?: Attachment[];
  comments?: Comment[];
}

// ==================== Helpers ====================

export const generateCDPCode = (startYear: number): string => {
  return `CDP-${startYear}-${startYear + 2}`;
};

export const calculatePerformanceRate = (target: number, current: number): number => {
  if (target === 0) return current > 0 ? 100 : 0;
  return Math.round((current / target) * 100 * 100) / 100;
};

// ==================== Données Mock Enrichies ====================

// Catégories CDP (4 catégories principales)
export const mockCDPCategories: CDPCategorie[] = [
  { id: "cat-1", code: "TECH", name: "Performance Technique", description: "Indicateurs de performance technique du service d'eau potable", order: 1 },
  { id: "cat-2", code: "COMM", name: "Performance Commerciale", description: "Indicateurs de performance commerciale et relation client", order: 2 },
  { id: "cat-3", code: "FIN", name: "Performance Financière", description: "Indicateurs de viabilité et équilibre financier", order: 3 },
  { id: "cat-4", code: "INST", name: "Performance Institutionnelle", description: "Indicateurs de gouvernance et développement institutionnel", order: 4 },
];

// Composantes CDP (14 composantes réparties dans les 4 catégories)
export const mockCDPComposantes: CDPComposante[] = [
  // Performance Technique (5 composantes)
  { id: "comp-1", code: "QUAL-EAU", name: "Qualité de l'eau", categorieId: "cat-1", categorieName: "Performance Technique", description: "Conformité aux normes de qualité", order: 1 },
  { id: "comp-2", code: "CONT-SERV", name: "Continuité du service", categorieId: "cat-1", categorieName: "Performance Technique", description: "Disponibilité et régularité du service", order: 2 },
  { id: "comp-3", code: "REND-RES", name: "Rendement du réseau", categorieId: "cat-1", categorieName: "Performance Technique", description: "Efficacité du réseau de distribution", order: 3 },
  { id: "comp-4", code: "MAINT-INFRA", name: "Maintenance des infrastructures", categorieId: "cat-1", categorieName: "Performance Technique", description: "Entretien préventif et curatif", order: 4 },
  { id: "comp-5", code: "EXT-RESEAU", name: "Extension du réseau", categorieId: "cat-1", categorieName: "Performance Technique", description: "Développement des infrastructures", order: 5 },
  
  // Performance Commerciale (4 composantes)
  { id: "comp-6", code: "RECOUV", name: "Recouvrement des créances", categorieId: "cat-2", categorieName: "Performance Commerciale", description: "Efficacité du recouvrement", order: 1 },
  { id: "comp-7", code: "REL-CLIENT", name: "Relation client", categorieId: "cat-2", categorieName: "Performance Commerciale", description: "Satisfaction et service client", order: 2 },
  { id: "comp-8", code: "FACT", name: "Facturation", categorieId: "cat-2", categorieName: "Performance Commerciale", description: "Qualité et régularité de la facturation", order: 3 },
  { id: "comp-9", code: "ACCES-SERV", name: "Accès au service", categorieId: "cat-2", categorieName: "Performance Commerciale", description: "Couverture et accessibilité", order: 4 },
  
  // Performance Financière (3 composantes)
  { id: "comp-10", code: "EQUIL-FIN", name: "Équilibre d'exploitation", categorieId: "cat-3", categorieName: "Performance Financière", description: "Viabilité financière", order: 1 },
  { id: "comp-11", code: "INVEST", name: "Capacité d'investissement", categorieId: "cat-3", categorieName: "Performance Financière", description: "Autofinancement et investissements", order: 2 },
  { id: "comp-12", code: "GEST-TRESOR", name: "Gestion de trésorerie", categorieId: "cat-3", categorieName: "Performance Financière", description: "Liquidité et solvabilité", order: 3 },
  
  // Performance Institutionnelle (2 composantes)
  { id: "comp-13", code: "GOUV", name: "Gouvernance", categorieId: "cat-4", categorieName: "Performance Institutionnelle", description: "Qualité de la gouvernance", order: 1 },
  { id: "comp-14", code: "RH", name: "Ressources humaines", categorieId: "cat-4", categorieName: "Performance Institutionnelle", description: "Gestion et développement RH", order: 2 },
];

// Indicateurs CDP (35+ indicateurs répartis dans les composantes)
export const mockCDPIndicateurs: CDPIndicateurRef[] = [
  // ===== PERFORMANCE TECHNIQUE =====
  // Qualité de l'eau (4 indicateurs)
  { id: "ind-1", code: "QUAL-01", name: "Taux de conformité microbiologique", composanteId: "comp-1", composanteName: "Qualité de l'eau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["suivi-3"], formula: "(Nb analyses conformes / Nb total analyses) × 100", source: "Laboratoire d'analyse", order: 1 },
  { id: "ind-2", code: "QUAL-02", name: "Taux de conformité physico-chimique", composanteId: "comp-1", composanteName: "Qualité de l'eau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["suivi-3"], formula: "(Nb analyses conformes / Nb total analyses) × 100", source: "Laboratoire d'analyse", order: 2 },
  { id: "ind-3", code: "QUAL-03", name: "Taux de chlore résiduel conforme", composanteId: "comp-1", composanteName: "Qualité de l'eau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["suivi-5"], formula: "(Nb mesures conformes / Nb total mesures) × 100", source: "Contrôle terrain", order: 3 },
  { id: "ind-4", code: "QUAL-04", name: "Fréquence des analyses réalisées", composanteId: "comp-1", composanteName: "Qualité de l'eau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["suivi-3"], formula: "(Nb analyses réalisées / Nb analyses prévues) × 100", source: "Planning laboratoire", order: 4 },
  
  // Continuité du service (4 indicateurs)
  { id: "ind-5", code: "CONT-01", name: "Taux de disponibilité du service", composanteId: "comp-2", composanteName: "Continuité du service", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: [], formula: "(Heures de service / Heures totales) × 100", source: "Système SCADA", order: 1 },
  { id: "ind-6", code: "CONT-02", name: "Durée moyenne des interruptions", composanteId: "comp-2", composanteName: "Continuité du service", categorieId: "cat-1", categorieName: "Performance Technique", unit: "heures", uniteMesureIds: [], formula: "Somme durées interruptions / Nb interruptions", source: "Rapports exploitation", order: 2 },
  { id: "ind-7", code: "CONT-03", name: "Nombre d'interruptions non programmées", composanteId: "comp-2", composanteName: "Continuité du service", categorieId: "cat-1", categorieName: "Performance Technique", unit: "nb/an", uniteMesureIds: [], formula: "Comptage annuel", source: "Rapports exploitation", order: 3 },
  { id: "ind-8", code: "CONT-04", name: "Taux de pression conforme", composanteId: "comp-2", composanteName: "Continuité du service", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["suivi-5"], formula: "(Points conformes / Points contrôlés) × 100", source: "Contrôle pression", order: 4 },
  
  // Rendement du réseau (3 indicateurs)
  { id: "ind-9", code: "REND-01", name: "Rendement du réseau de distribution", composanteId: "comp-3", composanteName: "Rendement du réseau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["equipement-6"], formula: "(Volume facturé / Volume produit) × 100", source: "Compteurs", order: 1 },
  { id: "ind-10", code: "REND-02", name: "Indice linéaire de pertes", composanteId: "comp-3", composanteName: "Rendement du réseau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "m³/km/j", uniteMesureIds: ["travaux-2"], formula: "Pertes / Longueur réseau / 365", source: "Bilan hydraulique", order: 2 },
  { id: "ind-11", code: "REND-03", name: "Taux de renouvellement des compteurs", composanteId: "comp-3", composanteName: "Rendement du réseau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["equipement-6"], formula: "(Compteurs renouvelés / Parc compteurs) × 100", source: "Gestion parc compteurs", order: 3 },
  
  // Maintenance des infrastructures (4 indicateurs)
  { id: "ind-12", code: "MAINT-01", name: "Taux de résolution des pannes sous 24h", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["suivi-1"], formula: "(Pannes résolues <24h / Total pannes) × 100", source: "Système ticketing", order: 1 },
  { id: "ind-13", code: "MAINT-02", name: "Taux d'exécution du plan de maintenance préventive", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", categorieId: "cat-1", categorieName: "Performance Technique", unit: "%", uniteMesureIds: ["suivi-1", "autre-3"], formula: "(Actions réalisées / Actions planifiées) × 100", source: "GMAO", order: 2 },
  { id: "ind-14", code: "MAINT-03", name: "Indice linéaire de réparations", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", categorieId: "cat-1", categorieName: "Performance Technique", unit: "nb/km/an", uniteMesureIds: ["travaux-2"], formula: "Nb réparations / Longueur réseau", source: "Rapports maintenance", order: 3 },
  { id: "ind-15", code: "MAINT-04", name: "Délai moyen d'intervention", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", categorieId: "cat-1", categorieName: "Performance Technique", unit: "heures", uniteMesureIds: ["suivi-1"], formula: "Somme délais / Nb interventions", source: "Système ticketing", order: 4 },
  
  // Extension du réseau (2 indicateurs)
  { id: "ind-16", code: "EXT-01", name: "Linéaire de réseau posé", composanteId: "comp-5", composanteName: "Extension du réseau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "km", uniteMesureIds: ["travaux-2"], formula: "Somme linéaires posés", source: "Rapports travaux", order: 1 },
  { id: "ind-17", code: "EXT-02", name: "Nombre de nouveaux branchements", composanteId: "comp-5", composanteName: "Extension du réseau", categorieId: "cat-1", categorieName: "Performance Technique", unit: "nb", uniteMesureIds: ["travaux-6"], formula: "Comptage annuel", source: "Base abonnés", order: 2 },
  
  // ===== PERFORMANCE COMMERCIALE =====
  // Recouvrement des créances (4 indicateurs)
  { id: "ind-18", code: "REC-01", name: "Taux de recouvrement global", composanteId: "comp-6", composanteName: "Recouvrement des créances", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: [], formula: "(Montant encaissé / Montant facturé) × 100", source: "Comptabilité", order: 1 },
  { id: "ind-19", code: "REC-02", name: "Délai moyen de recouvrement", composanteId: "comp-6", composanteName: "Recouvrement des créances", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "jours", uniteMesureIds: [], formula: "(Créances clients × 365) / CA annuel", source: "Comptabilité", order: 2 },
  { id: "ind-20", code: "REC-03", name: "Taux d'impayés > 90 jours", composanteId: "comp-6", composanteName: "Recouvrement des créances", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: [], formula: "(Impayés >90j / Total facturé) × 100", source: "Comptabilité", order: 3 },
  { id: "ind-21", code: "REC-04", name: "Taux de coupures pour impayés", composanteId: "comp-6", composanteName: "Recouvrement des créances", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: ["travaux-6"], formula: "(Coupures / Nb abonnés actifs) × 100", source: "Base abonnés", order: 4 },
  
  // Relation client (3 indicateurs)
  { id: "ind-22", code: "REL-01", name: "Taux de satisfaction client", composanteId: "comp-7", composanteName: "Relation client", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: ["sensibilisation-3"], formula: "(Clients satisfaits / Clients enquêtés) × 100", source: "Enquête satisfaction", order: 1 },
  { id: "ind-23", code: "REL-02", name: "Délai moyen de traitement des réclamations", composanteId: "comp-7", composanteName: "Relation client", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "jours", uniteMesureIds: [], formula: "Somme délais / Nb réclamations", source: "CRM", order: 2 },
  { id: "ind-24", code: "REL-03", name: "Taux de réclamations", composanteId: "comp-7", composanteName: "Relation client", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: ["sensibilisation-3"], formula: "(Nb réclamations / Nb abonnés) × 100", source: "CRM", order: 3 },
  
  // Facturation (3 indicateurs)
  { id: "ind-25", code: "FACT-01", name: "Taux de relève des compteurs", composanteId: "comp-8", composanteName: "Facturation", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: ["equipement-6"], formula: "(Compteurs relevés / Compteurs actifs) × 100", source: "Système relève", order: 1 },
  { id: "ind-26", code: "FACT-02", name: "Taux de factures sur index réel", composanteId: "comp-8", composanteName: "Facturation", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: ["equipement-6"], formula: "(Factures index réel / Total factures) × 100", source: "Système facturation", order: 2 },
  { id: "ind-27", code: "FACT-03", name: "Délai d'émission des factures", composanteId: "comp-8", composanteName: "Facturation", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "jours", uniteMesureIds: [], formula: "Date facture - Date relève", source: "Système facturation", order: 3 },
  
  // Accès au service (3 indicateurs)
  { id: "ind-28", code: "ACCES-01", name: "Taux d'accès à l'eau potable", composanteId: "comp-9", composanteName: "Accès au service", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: ["sensibilisation-2", "sensibilisation-3"], formula: "(Population desservie / Population zone) × 100", source: "Données démographiques", order: 1 },
  { id: "ind-29", code: "ACCES-02", name: "Délai moyen de raccordement", composanteId: "comp-9", composanteName: "Accès au service", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "jours", uniteMesureIds: ["travaux-6"], formula: "Somme délais / Nb raccordements", source: "Gestion abonnés", order: 2 },
  { id: "ind-30", code: "ACCES-03", name: "Taux de demandes de branchement satisfaites", composanteId: "comp-9", composanteName: "Accès au service", categorieId: "cat-2", categorieName: "Performance Commerciale", unit: "%", uniteMesureIds: ["travaux-6"], formula: "(Demandes satisfaites / Total demandes) × 100", source: "Gestion abonnés", order: 3 },
  
  // ===== PERFORMANCE FINANCIÈRE =====
  // Équilibre d'exploitation (3 indicateurs)
  { id: "ind-31", code: "FIN-01", name: "Ratio de couverture des charges", composanteId: "comp-10", composanteName: "Équilibre d'exploitation", categorieId: "cat-3", categorieName: "Performance Financière", unit: "%", uniteMesureIds: [], formula: "(Recettes exploitation / Charges exploitation) × 100", source: "Comptabilité", order: 1 },
  { id: "ind-32", code: "FIN-02", name: "Prix de revient du m³ produit", composanteId: "comp-10", composanteName: "Équilibre d'exploitation", categorieId: "cat-3", categorieName: "Performance Financière", unit: "FCFA/m³", uniteMesureIds: [], formula: "Charges exploitation / Volume produit", source: "Comptabilité", order: 2 },
  { id: "ind-33", code: "FIN-03", name: "Marge d'exploitation", composanteId: "comp-10", composanteName: "Équilibre d'exploitation", categorieId: "cat-3", categorieName: "Performance Financière", unit: "%", uniteMesureIds: [], formula: "(Résultat exploitation / CA) × 100", source: "Comptabilité", order: 3 },
  
  // Capacité d'investissement (2 indicateurs)
  { id: "ind-34", code: "INV-01", name: "Capacité d'autofinancement", composanteId: "comp-11", composanteName: "Capacité d'investissement", categorieId: "cat-3", categorieName: "Performance Financière", unit: "MFCFA", uniteMesureIds: [], formula: "Résultat net + Amortissements", source: "Comptabilité", order: 1 },
  { id: "ind-35", code: "INV-02", name: "Taux d'exécution du plan d'investissement", composanteId: "comp-11", composanteName: "Capacité d'investissement", categorieId: "cat-3", categorieName: "Performance Financière", unit: "%", uniteMesureIds: ["autre-3"], formula: "(Investissements réalisés / Investissements prévus) × 100", source: "Comptabilité", order: 2 },
  
  // Gestion de trésorerie (2 indicateurs)
  { id: "ind-36", code: "TRES-01", name: "Ratio de liquidité générale", composanteId: "comp-12", composanteName: "Gestion de trésorerie", categorieId: "cat-3", categorieName: "Performance Financière", unit: "ratio", uniteMesureIds: [], formula: "Actif circulant / Passif circulant", source: "Bilan", order: 1 },
  { id: "ind-37", code: "TRES-02", name: "Délai moyen de paiement fournisseurs", composanteId: "comp-12", composanteName: "Gestion de trésorerie", categorieId: "cat-3", categorieName: "Performance Financière", unit: "jours", uniteMesureIds: [], formula: "(Dettes fournisseurs × 365) / Achats annuels", source: "Comptabilité", order: 2 },
  
  // ===== PERFORMANCE INSTITUTIONNELLE =====
  // Gouvernance (3 indicateurs)
  { id: "ind-38", code: "GOUV-01", name: "Taux de réalisation du plan d'action annuel", composanteId: "comp-13", composanteName: "Gouvernance", categorieId: "cat-4", categorieName: "Performance Institutionnelle", unit: "%", uniteMesureIds: ["autre-3"], formula: "(Actions réalisées / Actions planifiées) × 100", source: "Suivi PTA", order: 1 },
  { id: "ind-39", code: "GOUV-02", name: "Taux de tenue des instances de gouvernance", composanteId: "comp-13", composanteName: "Gouvernance", categorieId: "cat-4", categorieName: "Performance Institutionnelle", unit: "%", uniteMesureIds: ["suivi-1"], formula: "(Réunions tenues / Réunions prévues) × 100", source: "Secrétariat général", order: 2 },
  { id: "ind-40", code: "GOUV-03", name: "Délai de production des rapports périodiques", composanteId: "comp-13", composanteName: "Gouvernance", categorieId: "cat-4", categorieName: "Performance Institutionnelle", unit: "jours", uniteMesureIds: ["suivi-2"], formula: "Date production - Date limite", source: "Direction générale", order: 3 },
  
  // Ressources humaines (3 indicateurs)
  { id: "ind-41", code: "RH-01", name: "Ratio agents/1000 abonnés", composanteId: "comp-14", composanteName: "Ressources humaines", categorieId: "cat-4", categorieName: "Performance Institutionnelle", unit: "ratio", uniteMesureIds: [], formula: "(Effectif × 1000) / Nb abonnés", source: "RH", order: 1 },
  { id: "ind-42", code: "RH-02", name: "Taux de réalisation du plan de formation", composanteId: "comp-14", composanteName: "Ressources humaines", categorieId: "cat-4", categorieName: "Performance Institutionnelle", unit: "%", uniteMesureIds: ["formation-2", "formation-1"], formula: "(Formations réalisées / Formations prévues) × 100", source: "RH", order: 2 },
  { id: "ind-43", code: "RH-03", name: "Taux d'absentéisme", composanteId: "comp-14", composanteName: "Ressources humaines", categorieId: "cat-4", categorieName: "Performance Institutionnelle", unit: "%", uniteMesureIds: [], formula: "(Jours absence / Jours ouvrés) × 100", source: "RH", order: 3 },
];

// CDP mock enrichi avec plus d'indicateurs
export const mockCDPs: CDP[] = [
  {
    id: "cdp-1",
    code: "CDP-2024-2026",
    name: "Contrat de Performance 2024-2026",
    description: "Contrat de performance triennal de l'OFOR avec l'État du Sénégal pour l'amélioration du service public de l'eau potable en milieu rural",
    startYear: 2024,
    endYear: 2026,
    status: "actif",
    createdAt: "2024-01-15",
    createdBy: "Admin OFOR",
    activatedAt: "2024-02-01",
    activatedBy: "DG OFOR",
    indicateurs: [
      // Performance Technique
      { indicateurRefId: "ind-1", indicateurCode: "QUAL-01", indicateurName: "Taux de conformité microbiologique", composanteId: "comp-1", composanteName: "Qualité de l'eau", unit: "%", baselineValue: 85, targetYear1: 90, targetYear2: 93, targetYear3: 95 },
      { indicateurRefId: "ind-2", indicateurCode: "QUAL-02", indicateurName: "Taux de conformité physico-chimique", composanteId: "comp-1", composanteName: "Qualité de l'eau", unit: "%", baselineValue: 88, targetYear1: 91, targetYear2: 94, targetYear3: 96 },
      { indicateurRefId: "ind-5", indicateurCode: "CONT-01", indicateurName: "Taux de disponibilité du service", composanteId: "comp-2", composanteName: "Continuité du service", unit: "%", baselineValue: 80, targetYear1: 85, targetYear2: 88, targetYear3: 92 },
      { indicateurRefId: "ind-6", indicateurCode: "CONT-02", indicateurName: "Durée moyenne des interruptions", composanteId: "comp-2", composanteName: "Continuité du service", unit: "heures", baselineValue: 8, targetYear1: 6, targetYear2: 4, targetYear3: 3 },
      { indicateurRefId: "ind-9", indicateurCode: "REND-01", indicateurName: "Rendement du réseau de distribution", composanteId: "comp-3", composanteName: "Rendement du réseau", unit: "%", baselineValue: 70, targetYear1: 75, targetYear2: 78, targetYear3: 82 },
      { indicateurRefId: "ind-10", indicateurCode: "REND-02", indicateurName: "Indice linéaire de pertes", composanteId: "comp-3", composanteName: "Rendement du réseau", unit: "m³/km/j", baselineValue: 12, targetYear1: 10, targetYear2: 8, targetYear3: 6 },
      { indicateurRefId: "ind-12", indicateurCode: "MAINT-01", indicateurName: "Taux de résolution des pannes sous 24h", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", unit: "%", baselineValue: 65, targetYear1: 75, targetYear2: 82, targetYear3: 90 },
      { indicateurRefId: "ind-13", indicateurCode: "MAINT-02", indicateurName: "Taux d'exécution du plan de maintenance préventive", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", unit: "%", baselineValue: 60, targetYear1: 70, targetYear2: 80, targetYear3: 90 },
      { indicateurRefId: "ind-16", indicateurCode: "EXT-01", indicateurName: "Linéaire de réseau posé", composanteId: "comp-5", composanteName: "Extension du réseau", unit: "km", baselineValue: 0, targetYear1: 150, targetYear2: 180, targetYear3: 200 },
      
      // Performance Commerciale
      { indicateurRefId: "ind-18", indicateurCode: "REC-01", indicateurName: "Taux de recouvrement global", composanteId: "comp-6", composanteName: "Recouvrement des créances", unit: "%", baselineValue: 75, targetYear1: 82, targetYear2: 87, targetYear3: 92 },
      { indicateurRefId: "ind-19", indicateurCode: "REC-02", indicateurName: "Délai moyen de recouvrement", composanteId: "comp-6", composanteName: "Recouvrement des créances", unit: "jours", baselineValue: 90, targetYear1: 75, targetYear2: 60, targetYear3: 45 },
      { indicateurRefId: "ind-22", indicateurCode: "REL-01", indicateurName: "Taux de satisfaction client", composanteId: "comp-7", composanteName: "Relation client", unit: "%", baselineValue: 70, targetYear1: 75, targetYear2: 80, targetYear3: 85 },
      { indicateurRefId: "ind-25", indicateurCode: "FACT-01", indicateurName: "Taux de relève des compteurs", composanteId: "comp-8", composanteName: "Facturation", unit: "%", baselineValue: 80, targetYear1: 88, targetYear2: 93, targetYear3: 97 },
      { indicateurRefId: "ind-28", indicateurCode: "ACCES-01", indicateurName: "Taux d'accès à l'eau potable", composanteId: "comp-9", composanteName: "Accès au service", unit: "%", baselineValue: 60, targetYear1: 68, targetYear2: 75, targetYear3: 82 },
      
      // Performance Financière
      { indicateurRefId: "ind-31", indicateurCode: "FIN-01", indicateurName: "Ratio de couverture des charges", composanteId: "comp-10", composanteName: "Équilibre d'exploitation", unit: "%", baselineValue: 95, targetYear1: 100, targetYear2: 105, targetYear3: 110 },
      { indicateurRefId: "ind-34", indicateurCode: "INV-01", indicateurName: "Capacité d'autofinancement", composanteId: "comp-11", composanteName: "Capacité d'investissement", unit: "MFCFA", baselineValue: 800, targetYear1: 1200, targetYear2: 1500, targetYear3: 2000 },
      { indicateurRefId: "ind-35", indicateurCode: "INV-02", indicateurName: "Taux d'exécution du plan d'investissement", composanteId: "comp-11", composanteName: "Capacité d'investissement", unit: "%", baselineValue: 70, targetYear1: 80, targetYear2: 85, targetYear3: 90 },
      
      // Performance Institutionnelle
      { indicateurRefId: "ind-38", indicateurCode: "GOUV-01", indicateurName: "Taux de réalisation du plan d'action annuel", composanteId: "comp-13", composanteName: "Gouvernance", unit: "%", baselineValue: 75, targetYear1: 82, targetYear2: 88, targetYear3: 93 },
      { indicateurRefId: "ind-42", indicateurCode: "RH-02", indicateurName: "Taux de réalisation du plan de formation", composanteId: "comp-14", composanteName: "Ressources humaines", unit: "%", baselineValue: 60, targetYear1: 75, targetYear2: 85, targetYear3: 95 },
    ],
  },
  // ===== CDP précédent (clôturé) =====
  {
    id: "cdp-0",
    code: "CDP-2021-2023",
    name: "Contrat de Performance 2021-2023",
    description: "Contrat de performance triennal précédent — exercice clôturé et historisé",
    startYear: 2021,
    endYear: 2023,
    status: "cloture",
    createdAt: "2021-01-10",
    createdBy: "Admin OFOR",
    activatedAt: "2021-02-01",
    activatedBy: "DG OFOR",
    closedAt: "2023-12-31",
    closedBy: "DG OFOR",
    indicateurs: [
      { indicateurRefId: "ind-1", indicateurCode: "QUAL-01", indicateurName: "Taux de conformité microbiologique", composanteId: "comp-1", composanteName: "Qualité de l'eau", unit: "%", baselineValue: 75, targetYear1: 80, targetYear2: 83, targetYear3: 85 },
      { indicateurRefId: "ind-5", indicateurCode: "CONT-01", indicateurName: "Taux de disponibilité du service", composanteId: "comp-2", composanteName: "Continuité du service", unit: "%", baselineValue: 70, targetYear1: 75, targetYear2: 78, targetYear3: 80 },
      { indicateurRefId: "ind-9", indicateurCode: "REND-01", indicateurName: "Rendement du réseau de distribution", composanteId: "comp-3", composanteName: "Rendement du réseau", unit: "%", baselineValue: 60, targetYear1: 65, targetYear2: 68, targetYear3: 70 },
      { indicateurRefId: "ind-18", indicateurCode: "REC-01", indicateurName: "Taux de recouvrement global", composanteId: "comp-6", composanteName: "Recouvrement des créances", unit: "%", baselineValue: 65, targetYear1: 70, targetYear2: 72, targetYear3: 75 },
      { indicateurRefId: "ind-28", indicateurCode: "ACCES-01", indicateurName: "Taux d'accès à l'eau potable", composanteId: "comp-9", composanteName: "Accès au service", unit: "%", baselineValue: 50, targetYear1: 55, targetYear2: 58, targetYear3: 60 },
      { indicateurRefId: "ind-31", indicateurCode: "FIN-01", indicateurName: "Ratio de couverture des charges", composanteId: "comp-10", composanteName: "Équilibre d'exploitation", unit: "%", baselineValue: 85, targetYear1: 90, targetYear2: 93, targetYear3: 95 },
    ],
  },
];

// Évaluations annuelles enrichies
export const mockCDPEvaluations: CDPEvaluationAnnuelle[] = [
  // CDP précédent (clôturé)
  { id: "eval-prev-1", cdpId: "cdp-0", cdpName: "CDP-2021-2023", year: 2021, status: "cloture", createdAt: "2021-01-15", createdBy: "Admin OFOR", closedAt: "2021-12-31", closedBy: "DG OFOR" },
  { id: "eval-prev-2", cdpId: "cdp-0", cdpName: "CDP-2021-2023", year: 2022, status: "cloture", createdAt: "2022-01-15", createdBy: "Admin OFOR", closedAt: "2022-12-31", closedBy: "DG OFOR" },
  { id: "eval-prev-3", cdpId: "cdp-0", cdpName: "CDP-2021-2023", year: 2023, status: "cloture", createdAt: "2023-01-15", createdBy: "Admin OFOR", closedAt: "2023-12-31", closedBy: "DG OFOR" },
  // CDP en cours
  { id: "eval-1", cdpId: "cdp-1", cdpName: "CDP-2024-2026", year: 2024, status: "cloture", createdAt: "2024-01-15", createdBy: "Admin OFOR", closedAt: "2024-12-31", closedBy: "DG OFOR" },
  { id: "eval-2", cdpId: "cdp-1", cdpName: "CDP-2024-2026", year: 2025, status: "actif", createdAt: "2025-01-10", createdBy: "Admin OFOR" },
  { id: "eval-3", cdpId: "cdp-1", cdpName: "CDP-2024-2026", year: 2026, status: "brouillon", createdAt: "2026-01-08", createdBy: "Système" },
];

// Fiches de suivi enrichies avec données réalistes
export const mockCDPFichesSuivi: CDPFicheSuiviIndicateur[] = [
  // ===== Année 2024 - Évaluation complète =====
  // Performance Technique
  { id: "fiche-1", evaluationId: "eval-1", indicateurRefId: "ind-1", indicateurCode: "QUAL-01", indicateurName: "Taux de conformité microbiologique", composanteId: "comp-1", composanteName: "Qualité de l'eau", unit: "%", targetValue: 90, currentValue: 92, performanceRate: 102.2, status: "approuve", observations: "Objectif dépassé grâce au renforcement des contrôles", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-2", evaluationId: "eval-1", indicateurRefId: "ind-2", indicateurCode: "QUAL-02", indicateurName: "Taux de conformité physico-chimique", composanteId: "comp-1", composanteName: "Qualité de l'eau", unit: "%", targetValue: 91, currentValue: 89, performanceRate: 97.8, status: "approuve", observations: "Léger écart, amélioration du traitement en cours", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-3", evaluationId: "eval-1", indicateurRefId: "ind-5", indicateurCode: "CONT-01", indicateurName: "Taux de disponibilité du service", composanteId: "comp-2", composanteName: "Continuité du service", unit: "%", targetValue: 85, currentValue: 83, performanceRate: 97.6, status: "approuve", observations: "Perturbations dues aux coupures électriques", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-4", evaluationId: "eval-1", indicateurRefId: "ind-6", indicateurCode: "CONT-02", indicateurName: "Durée moyenne des interruptions", composanteId: "comp-2", composanteName: "Continuité du service", unit: "heures", targetValue: 6, currentValue: 5.5, performanceRate: 109.1, status: "approuve", observations: "Amélioration notable", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-5", evaluationId: "eval-1", indicateurRefId: "ind-9", indicateurCode: "REND-01", indicateurName: "Rendement du réseau de distribution", composanteId: "comp-3", composanteName: "Rendement du réseau", unit: "%", targetValue: 75, currentValue: 76, performanceRate: 101.3, status: "approuve", observations: "Programme anti-fuites efficace", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-6", evaluationId: "eval-1", indicateurRefId: "ind-10", indicateurCode: "REND-02", indicateurName: "Indice linéaire de pertes", composanteId: "comp-3", composanteName: "Rendement du réseau", unit: "m³/km/j", targetValue: 10, currentValue: 9.8, performanceRate: 102.0, status: "approuve", observations: "Réduction des pertes", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-7", evaluationId: "eval-1", indicateurRefId: "ind-12", indicateurCode: "MAINT-01", indicateurName: "Taux de résolution des pannes sous 24h", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", unit: "%", targetValue: 75, currentValue: 72, performanceRate: 96.0, status: "approuve", observations: "Manque de pièces détachées", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-8", evaluationId: "eval-1", indicateurRefId: "ind-13", indicateurCode: "MAINT-02", indicateurName: "Taux d'exécution du plan de maintenance préventive", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", unit: "%", targetValue: 70, currentValue: 68, performanceRate: 97.1, status: "approuve", observations: "Retards légers au S2", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-9", evaluationId: "eval-1", indicateurRefId: "ind-16", indicateurCode: "EXT-01", indicateurName: "Linéaire de réseau posé", composanteId: "comp-5", composanteName: "Extension du réseau", unit: "km", targetValue: 150, currentValue: 162, performanceRate: 108.0, status: "approuve", observations: "Objectif dépassé", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  
  // Performance Commerciale
  { id: "fiche-10", evaluationId: "eval-1", indicateurRefId: "ind-18", indicateurCode: "REC-01", indicateurName: "Taux de recouvrement global", composanteId: "comp-6", composanteName: "Recouvrement des créances", unit: "%", targetValue: 82, currentValue: 79, performanceRate: 96.3, status: "approuve", observations: "Difficultés économiques des usagers", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-11", evaluationId: "eval-1", indicateurRefId: "ind-19", indicateurCode: "REC-02", indicateurName: "Délai moyen de recouvrement", composanteId: "comp-6", composanteName: "Recouvrement des créances", unit: "jours", targetValue: 75, currentValue: 80, performanceRate: 93.8, status: "approuve", observations: "En légère amélioration", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-12", evaluationId: "eval-1", indicateurRefId: "ind-22", indicateurCode: "REL-01", indicateurName: "Taux de satisfaction client", composanteId: "comp-7", composanteName: "Relation client", unit: "%", targetValue: 75, currentValue: 77, performanceRate: 102.7, status: "approuve", observations: "Amélioration du service client", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-13", evaluationId: "eval-1", indicateurRefId: "ind-25", indicateurCode: "FACT-01", indicateurName: "Taux de relève des compteurs", composanteId: "comp-8", composanteName: "Facturation", unit: "%", targetValue: 88, currentValue: 91, performanceRate: 103.4, status: "approuve", observations: "Modernisation des outils de relève", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-14", evaluationId: "eval-1", indicateurRefId: "ind-28", indicateurCode: "ACCES-01", indicateurName: "Taux d'accès à l'eau potable", composanteId: "comp-9", composanteName: "Accès au service", unit: "%", targetValue: 68, currentValue: 66, performanceRate: 97.1, status: "approuve", observations: "Retards sur certains projets", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  
  // Performance Financière
  { id: "fiche-15", evaluationId: "eval-1", indicateurRefId: "ind-31", indicateurCode: "FIN-01", indicateurName: "Ratio de couverture des charges", composanteId: "comp-10", composanteName: "Équilibre d'exploitation", unit: "%", targetValue: 100, currentValue: 102, performanceRate: 102.0, status: "approuve", observations: "Équilibre atteint", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-16", evaluationId: "eval-1", indicateurRefId: "ind-34", indicateurCode: "INV-01", indicateurName: "Capacité d'autofinancement", composanteId: "comp-11", composanteName: "Capacité d'investissement", unit: "MFCFA", targetValue: 1200, currentValue: 1150, performanceRate: 95.8, status: "approuve", observations: "Légèrement en dessous", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-17", evaluationId: "eval-1", indicateurRefId: "ind-35", indicateurCode: "INV-02", indicateurName: "Taux d'exécution du plan d'investissement", composanteId: "comp-11", composanteName: "Capacité d'investissement", unit: "%", targetValue: 80, currentValue: 78, performanceRate: 97.5, status: "approuve", observations: "Retards administratifs", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  
  // Performance Institutionnelle
  { id: "fiche-18", evaluationId: "eval-1", indicateurRefId: "ind-38", indicateurCode: "GOUV-01", indicateurName: "Taux de réalisation du plan d'action annuel", composanteId: "comp-13", composanteName: "Gouvernance", unit: "%", targetValue: 82, currentValue: 85, performanceRate: 103.7, status: "approuve", observations: "Bonne exécution du PTA", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  { id: "fiche-19", evaluationId: "eval-1", indicateurRefId: "ind-42", indicateurCode: "RH-02", indicateurName: "Taux de réalisation du plan de formation", composanteId: "comp-14", composanteName: "Ressources humaines", unit: "%", targetValue: 75, currentValue: 70, performanceRate: 93.3, status: "approuve", observations: "Report de certaines formations", approvedAt: "2024-12-20", approvedBy: "DG OFOR" },
  
  // ===== Année 2025 - En cours de suivi =====
  { id: "fiche-20", evaluationId: "eval-2", indicateurRefId: "ind-1", indicateurCode: "QUAL-01", indicateurName: "Taux de conformité microbiologique", composanteId: "comp-1", composanteName: "Qualité de l'eau", unit: "%", targetValue: 93, currentValue: 91, performanceRate: 97.8, status: "soumis", observations: "Données S1 2025", submittedAt: "2025-07-15", submittedBy: "Chef Service Qualité" },
  { id: "fiche-21", evaluationId: "eval-2", indicateurRefId: "ind-2", indicateurCode: "QUAL-02", indicateurName: "Taux de conformité physico-chimique", composanteId: "comp-1", composanteName: "Qualité de l'eau", unit: "%", targetValue: 94, currentValue: 92, performanceRate: 97.9, status: "valide", observations: "En progression", validatedAt: "2025-07-20", validatedBy: "Directeur Technique" },
  { id: "fiche-22", evaluationId: "eval-2", indicateurRefId: "ind-5", indicateurCode: "CONT-01", indicateurName: "Taux de disponibilité du service", composanteId: "comp-2", composanteName: "Continuité du service", unit: "%", targetValue: 88, currentValue: 86, performanceRate: 97.7, status: "soumis", observations: "Données S1 2025", submittedAt: "2025-07-12", submittedBy: "Chef Service Exploitation" },
  { id: "fiche-23", evaluationId: "eval-2", indicateurRefId: "ind-6", indicateurCode: "CONT-02", indicateurName: "Durée moyenne des interruptions", composanteId: "comp-2", composanteName: "Continuité du service", unit: "heures", targetValue: 4, currentValue: 4.5, performanceRate: 88.9, status: "valide", observations: "Tendance positive", validatedAt: "2025-07-22", validatedBy: "Directeur Technique" },
  { id: "fiche-24", evaluationId: "eval-2", indicateurRefId: "ind-9", indicateurCode: "REND-01", indicateurName: "Rendement du réseau de distribution", composanteId: "comp-3", composanteName: "Rendement du réseau", unit: "%", targetValue: 78, currentValue: 77, performanceRate: 98.7, status: "soumis", observations: "Progression continue", submittedAt: "2025-07-18", submittedBy: "Chef Service Exploitation" },
  { id: "fiche-25", evaluationId: "eval-2", indicateurRefId: "ind-10", indicateurCode: "REND-02", indicateurName: "Indice linéaire de pertes", composanteId: "comp-3", composanteName: "Rendement du réseau", unit: "m³/km/j", targetValue: 8, currentValue: 8.6, performanceRate: 93.0, status: "soumis", observations: "Programme anti-fuites en cours", submittedAt: "2025-07-18", submittedBy: "Chef Service Exploitation" },
  { id: "fiche-26", evaluationId: "eval-2", indicateurRefId: "ind-12", indicateurCode: "MAINT-01", indicateurName: "Taux de résolution des pannes sous 24h", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", unit: "%", targetValue: 82, currentValue: 78, performanceRate: 95.1, status: "soumis", observations: "Manque ponctuel de pièces", submittedAt: "2025-07-15", submittedBy: "Chef Maintenance" },
  { id: "fiche-27", evaluationId: "eval-2", indicateurRefId: "ind-13", indicateurCode: "MAINT-02", indicateurName: "Taux d'exécution du plan de maintenance préventive", composanteId: "comp-4", composanteName: "Maintenance des infrastructures", unit: "%", targetValue: 80, currentValue: 76, performanceRate: 95.0, status: "valide", observations: "Léger retard rattrapable", validatedAt: "2025-07-25", validatedBy: "Directeur Technique" },
  { id: "fiche-28", evaluationId: "eval-2", indicateurRefId: "ind-16", indicateurCode: "EXT-01", indicateurName: "Linéaire de réseau posé", composanteId: "comp-5", composanteName: "Extension du réseau", unit: "km", targetValue: 180, currentValue: 95, performanceRate: 52.8, status: "soumis", observations: "Avancement S1 2025", submittedAt: "2025-07-20", submittedBy: "Chef Travaux" },
  { id: "fiche-29", evaluationId: "eval-2", indicateurRefId: "ind-18", indicateurCode: "REC-01", indicateurName: "Taux de recouvrement global", composanteId: "comp-6", composanteName: "Recouvrement des créances", unit: "%", targetValue: 87, currentValue: 81, performanceRate: 93.1, status: "soumis", observations: "Renforcement des actions de recouvrement", submittedAt: "2025-07-10", submittedBy: "Chef Service Commercial" },
  { id: "fiche-30", evaluationId: "eval-2", indicateurRefId: "ind-19", indicateurCode: "REC-02", indicateurName: "Délai moyen de recouvrement", composanteId: "comp-6", composanteName: "Recouvrement des créances", unit: "jours", targetValue: 60, currentValue: 72, performanceRate: 83.3, status: "brouillon" },
  { id: "fiche-31", evaluationId: "eval-2", indicateurRefId: "ind-22", indicateurCode: "REL-01", indicateurName: "Taux de satisfaction client", composanteId: "comp-7", composanteName: "Relation client", unit: "%", targetValue: 80, currentValue: 78, performanceRate: 97.5, status: "soumis", observations: "Enquête S1 2025", submittedAt: "2025-07-05", submittedBy: "Chef Relation Client" },
  { id: "fiche-32", evaluationId: "eval-2", indicateurRefId: "ind-25", indicateurCode: "FACT-01", indicateurName: "Taux de relève des compteurs", composanteId: "comp-8", composanteName: "Facturation", unit: "%", targetValue: 93, currentValue: 92, performanceRate: 98.9, status: "valide", observations: "Modernisation porte ses fruits", validatedAt: "2025-07-22", validatedBy: "Directeur Commercial" },
  { id: "fiche-33", evaluationId: "eval-2", indicateurRefId: "ind-28", indicateurCode: "ACCES-01", indicateurName: "Taux d'accès à l'eau potable", composanteId: "comp-9", composanteName: "Accès au service", unit: "%", targetValue: 75, currentValue: 71, performanceRate: 94.7, status: "soumis", observations: "Extensions en cours", submittedAt: "2025-07-15", submittedBy: "Chef Projets" },
  { id: "fiche-34", evaluationId: "eval-2", indicateurRefId: "ind-31", indicateurCode: "FIN-01", indicateurName: "Ratio de couverture des charges", composanteId: "comp-10", composanteName: "Équilibre d'exploitation", unit: "%", targetValue: 105, currentValue: 103, performanceRate: 98.1, status: "soumis", observations: "Équilibre maintenu", submittedAt: "2025-07-30", submittedBy: "DAF" },
  { id: "fiche-35", evaluationId: "eval-2", indicateurRefId: "ind-34", indicateurCode: "INV-01", indicateurName: "Capacité d'autofinancement", composanteId: "comp-11", composanteName: "Capacité d'investissement", unit: "MFCFA", targetValue: 1500, currentValue: 1380, performanceRate: 92.0, status: "valide", observations: "Performance correcte", validatedAt: "2025-07-30", validatedBy: "DAF" },
  { id: "fiche-36", evaluationId: "eval-2", indicateurRefId: "ind-35", indicateurCode: "INV-02", indicateurName: "Taux d'exécution du plan d'investissement", composanteId: "comp-11", composanteName: "Capacité d'investissement", unit: "%", targetValue: 85, currentValue: 78, performanceRate: 91.8, status: "soumis", observations: "Quelques marchés en retard", submittedAt: "2025-07-30", submittedBy: "DAF" },
  { id: "fiche-37", evaluationId: "eval-2", indicateurRefId: "ind-38", indicateurCode: "GOUV-01", indicateurName: "Taux de réalisation du plan d'action annuel", composanteId: "comp-13", composanteName: "Gouvernance", unit: "%", targetValue: 88, currentValue: 84, performanceRate: 95.5, status: "soumis", observations: "Bonne dynamique", submittedAt: "2025-07-28", submittedBy: "DPSE" },
  { id: "fiche-38", evaluationId: "eval-2", indicateurRefId: "ind-42", indicateurCode: "RH-02", indicateurName: "Taux de réalisation du plan de formation", composanteId: "comp-14", composanteName: "Ressources humaines", unit: "%", targetValue: 85, currentValue: 72, performanceRate: 84.7, status: "brouillon" },

  // ===== Année 2026 - démarrage évaluation =====
  { id: "fiche-2026-1", evaluationId: "eval-3", indicateurRefId: "ind-1", indicateurCode: "QUAL-01", indicateurName: "Taux de conformité microbiologique", composanteId: "comp-1", composanteName: "Qualité de l'eau", unit: "%", targetValue: 95, currentValue: 93, performanceRate: 97.9, status: "soumis", observations: "Données T1 2026", submittedAt: "2026-04-10", submittedBy: "Chef Service Qualité" },
  { id: "fiche-2026-2", evaluationId: "eval-3", indicateurRefId: "ind-5", indicateurCode: "CONT-01", indicateurName: "Taux de disponibilité du service", composanteId: "comp-2", composanteName: "Continuité du service", unit: "%", targetValue: 92, currentValue: 89, performanceRate: 96.7, status: "brouillon" },
  { id: "fiche-2026-3", evaluationId: "eval-3", indicateurRefId: "ind-9", indicateurCode: "REND-01", indicateurName: "Rendement du réseau de distribution", composanteId: "comp-3", composanteName: "Rendement du réseau", unit: "%", targetValue: 82, status: "brouillon" },
  { id: "fiche-2026-4", evaluationId: "eval-3", indicateurRefId: "ind-18", indicateurCode: "REC-01", indicateurName: "Taux de recouvrement global", composanteId: "comp-6", composanteName: "Recouvrement des créances", unit: "%", targetValue: 92, status: "brouillon" },
  { id: "fiche-2026-5", evaluationId: "eval-3", indicateurRefId: "ind-28", indicateurCode: "ACCES-01", indicateurName: "Taux d'accès à l'eau potable", composanteId: "comp-9", composanteName: "Accès au service", unit: "%", targetValue: 82, status: "brouillon" },
  { id: "fiche-2026-6", evaluationId: "eval-3", indicateurRefId: "ind-31", indicateurCode: "FIN-01", indicateurName: "Ratio de couverture des charges", composanteId: "comp-10", composanteName: "Équilibre d'exploitation", unit: "%", targetValue: 110, status: "brouillon" },
  { id: "fiche-2026-7", evaluationId: "eval-3", indicateurRefId: "ind-38", indicateurCode: "GOUV-01", indicateurName: "Taux de réalisation du plan d'action annuel", composanteId: "comp-13", composanteName: "Gouvernance", unit: "%", targetValue: 93, status: "brouillon" },
];