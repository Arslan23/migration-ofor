export const OPERATION_NATURES = [
  "Infrastructure",
  "Maintenance",
  "Équipement",
  "Formation",
  "Étude",
  "Sensibilisation",
  "Suivi-évaluation",
  "Travaux",
] as const;

export type OperationNature = typeof OPERATION_NATURES[number];

export interface Operation {
  id: string;
  code: string;
  libelle: string;
  serviceId: string;
  nature?: OperationNature;
  description?: string;
  actif: boolean;
}

export const mockOperations: Operation[] = [
  // Direction Générale (srv-1)
  { id: "op-dg-1", code: "DG-PIL", libelle: "Pilotage stratégique et coordination", serviceId: "srv-1", nature: "Suivi-évaluation", actif: true },
  { id: "op-dg-2", code: "DG-GOUV", libelle: "Gouvernance et instances", serviceId: "srv-1", nature: "Suivi-évaluation", actif: true },

  // DAF (srv-2)
  { id: "op-daf-1", code: "DAF-BUDG", libelle: "Élaboration et exécution budgétaire", serviceId: "srv-2", nature: "Étude", actif: true },
  { id: "op-daf-2", code: "DAF-AUDIT", libelle: "Audit interne et contrôle qualité", serviceId: "srv-2", nature: "Suivi-évaluation", actif: true },
  { id: "op-daf-3", code: "DAF-MARCH", libelle: "Passation et suivi des marchés", serviceId: "srv-2", nature: "Suivi-évaluation", actif: true },
  { id: "op-daf-4", code: "DAF-EQUIP", libelle: "Acquisition véhicules et équipements", serviceId: "srv-2", nature: "Équipement", actif: true },

  // Direction Technique (srv-3)
  { id: "op-dt-1", code: "DT-SIG", libelle: "Schéma directeur SIG hydraulique", serviceId: "srv-3", nature: "Étude", actif: true },
  { id: "op-dt-2", code: "DT-NORM", libelle: "Normes techniques et standards", serviceId: "srv-3", nature: "Étude", actif: true },
  { id: "op-dt-3", code: "DT-VEILLE", libelle: "Veille technologique et innovation", serviceId: "srv-3", nature: "Étude", actif: true },

  // DPSE (srv-4)
  { id: "op-dpse-1", code: "DPSE-SUP", libelle: "Supervision nationale des chantiers", serviceId: "srv-4", nature: "Suivi-évaluation", actif: true },
  { id: "op-dpse-2", code: "DPSE-EVAL", libelle: "Évaluation à mi-parcours du portefeuille", serviceId: "srv-4", nature: "Suivi-évaluation", actif: true },
  { id: "op-dpse-3", code: "DPSE-REP", libelle: "Reporting institutionnel et tableaux de bord", serviceId: "srv-4", nature: "Suivi-évaluation", actif: true },

  // Département Finance (srv-5)
  { id: "op-fin-1", code: "FIN-TRES", libelle: "Gestion de la trésorerie", serviceId: "srv-5", nature: "Étude", actif: true },
  { id: "op-fin-2", code: "FIN-COMPT", libelle: "Tenue comptable et états financiers", serviceId: "srv-5", nature: "Étude", actif: true },

  // Département RH (srv-6)
  { id: "op-rh-1", code: "RH-FORM", libelle: "Plan annuel de formation interne", serviceId: "srv-6", nature: "Formation", actif: true },
  { id: "op-rh-2", code: "RH-RECRUT", libelle: "Recrutement et intégration", serviceId: "srv-6", nature: "Étude", actif: true },
  { id: "op-rh-3", code: "RH-PERF", libelle: "Évaluation des performances", serviceId: "srv-6", nature: "Suivi-évaluation", actif: true },

  // Division Projets (srv-7)
  { id: "op-com-1", code: "COM-CAMP", libelle: "Campagnes de communication institutionnelles", serviceId: "srv-7", nature: "Sensibilisation", actif: true },
  { id: "op-com-2", code: "COM-MEDIA", libelle: "Relations médias et presse", serviceId: "srv-7", nature: "Sensibilisation", actif: true },

  // Division Maintenance (srv-8)
  { id: "op-maint-1", code: "MAINT-PREV", libelle: "Maintenance préventive du parc", serviceId: "srv-8", nature: "Maintenance", actif: true },
  { id: "op-maint-2", code: "MAINT-CURA", libelle: "Maintenance curative et dépannages", serviceId: "srv-8", nature: "Maintenance", actif: true },

  // Cellule SI (srv-9)
  { id: "op-si-1", code: "SI-INFRA", libelle: "Administration des infrastructures SI", serviceId: "srv-9", nature: "Maintenance", actif: true },
  { id: "op-si-2", code: "SI-APPS", libelle: "Maintenance des applications métiers", serviceId: "srv-9", nature: "Maintenance", actif: true },

  // DGPRE — DRE (srv-10)
  { id: "op-dre-1", code: "DRE-SUIVI", libelle: "Suivi des ressources en eau", serviceId: "srv-10", nature: "Suivi-évaluation", actif: true },

  // DGPRE — DPE (srv-11)
  { id: "op-dpe-1", code: "DPE-PLAN", libelle: "Planification sectorielle eau", serviceId: "srv-11", nature: "Étude", actif: true },
];

export const getOperationById = (id: string): Operation | undefined =>
  mockOperations.find(o => o.id === id);

export const getOperationsByService = (serviceId: string): Operation[] =>
  mockOperations.filter(o => o.serviceId === serviceId && o.actif);
