// Types pour les services/directions
export type ServiceType = 
  | "direction" 
  | "departement" 
  | "division" 
  | "service" 
  | "bureau" 
  | "cellule" 
  | "unite";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  direction: "Direction",
  departement: "Département",
  division: "Division",
  service: "Service",
  bureau: "Bureau",
  cellule: "Cellule",
  unite: "Unité",
};

// Interface pour un service
export interface Service {
  id: string;
  code: string;
  nom: string;
  type: ServiceType;
  entiteId: string;
  parentServiceId?: string; // Pour la hiérarchie interne
  responsable?: string;
  email?: string;
  telephone?: string;
  description?: string;
  actif: boolean;
}

// Interface pour une entité d'exécution
export interface EntiteExecution {
  id: string;
  code: string;
  nom: string;
  type: EntiteType;
  adresse?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  responsable?: string;
  description?: string;
  actif: boolean;
}

export type EntiteType = 
  | "administration" 
  | "entreprise" 
  | "bureau_etudes" 
  | "ong" 
  | "collectivite" 
  | "partenaire" 
  | "autre";

export const ENTITE_TYPE_LABELS: Record<EntiteType, string> = {
  administration: "Administration publique",
  entreprise: "Entreprise privée",
  bureau_etudes: "Bureau d'études",
  ong: "ONG",
  collectivite: "Collectivité locale",
  partenaire: "Partenaire technique",
  autre: "Autre",
};

// Données mock des entités d'exécution
export const mockEntitesExecution: EntiteExecution[] = [
  {
    id: "ent-1",
    code: "OFOR",
    nom: "Office des Forages Ruraux",
    type: "administration",
    adresse: "Dakar, Sénégal",
    telephone: "+221 33 XXX XX XX",
    email: "contact@ofor.sn",
    siteWeb: "www.ofor.sn",
    responsable: "Directeur Général",
    description: "Établissement public en charge de la gestion des forages ruraux au Sénégal",
    actif: true,
  },
  {
    id: "ent-2",
    code: "HYDRO-SN",
    nom: "Hydro Services Sénégal",
    type: "entreprise",
    adresse: "Thiès, Sénégal",
    telephone: "+221 33 XXX XX XX",
    email: "contact@hydro-sn.com",
    responsable: "Directeur Technique",
    description: "Entreprise spécialisée dans les travaux hydrauliques",
    actif: true,
  },
  {
    id: "ent-3",
    code: "BET-EAU",
    nom: "Bureau d'Études Eau & Assainissement",
    type: "bureau_etudes",
    adresse: "Dakar, Sénégal",
    email: "info@bet-eau.sn",
    description: "Bureau d'études spécialisé en hydraulique et assainissement",
    actif: true,
  },
  {
    id: "ent-4",
    code: "ENDA",
    nom: "ENDA Tiers Monde",
    type: "ong",
    adresse: "Dakar, Sénégal",
    email: "contact@enda.sn",
    description: "Organisation internationale de développement",
    actif: true,
  },
  {
    id: "ent-5",
    code: "DGPRE",
    nom: "Direction de la Gestion et de la Planification des Ressources en Eau",
    type: "administration",
    adresse: "Dakar, Sénégal",
    description: "Direction ministérielle en charge de la gestion des ressources en eau",
    actif: true,
  },
  {
    id: "ent-6",
    code: "FORAGE-PLUS",
    nom: "Forage Plus SARL",
    type: "entreprise",
    adresse: "Saint-Louis, Sénégal",
    telephone: "+221 33 XXX XX XX",
    description: "Entreprise de réalisation de forages",
    actif: true,
  },
  {
    id: "ent-7",
    code: "AQUA-CONSULT",
    nom: "Aqua Consult International",
    type: "bureau_etudes",
    adresse: "Dakar, Sénégal",
    email: "contact@aquaconsult.sn",
    description: "Consultant international en ressources en eau",
    actif: false,
  },
];

// Données mock des services
export const mockServices: Service[] = [
  // Services OFOR
  {
    id: "srv-1",
    code: "DG",
    nom: "Direction Générale",
    type: "direction",
    entiteId: "ent-1",
    responsable: "Directeur Général",
    email: "dg@ofor.sn",
    actif: true,
  },
  {
    id: "srv-2",
    code: "DAF",
    nom: "Direction Administrative et Financière",
    type: "direction",
    entiteId: "ent-1",
    responsable: "Directeur DAF",
    email: "daf@ofor.sn",
    actif: true,
  },
  {
    id: "srv-3",
    code: "DT",
    nom: "Direction Technique",
    type: "direction",
    entiteId: "ent-1",
    responsable: "Directeur Technique",
    email: "dt@ofor.sn",
    actif: true,
  },
  {
    id: "srv-4",
    code: "DPSE",
    nom: "Direction de la Planification, du Suivi et de l'Évaluation",
    type: "direction",
    entiteId: "ent-1",
    responsable: "Directeur DPSE",
    email: "dpse@ofor.sn",
    actif: true,
  },
  {
    id: "srv-5",
    code: "DEP-FIN",
    nom: "Département Finance",
    type: "departement",
    entiteId: "ent-1",
    parentServiceId: "srv-2",
    responsable: "Chef Département",
    actif: true,
  },
  {
    id: "srv-6",
    code: "DEP-RH",
    nom: "Département Ressources Humaines",
    type: "departement",
    entiteId: "ent-1",
    parentServiceId: "srv-2",
    responsable: "Chef Département RH",
    actif: true,
  },
  {
    id: "srv-7",
    code: "DIV-PROJ",
    nom: "Division Projets",
    type: "division",
    entiteId: "ent-1",
    parentServiceId: "srv-3",
    responsable: "Chef Division",
    actif: true,
  },
  {
    id: "srv-8",
    code: "DIV-MAINT",
    nom: "Division Maintenance",
    type: "division",
    entiteId: "ent-1",
    parentServiceId: "srv-3",
    responsable: "Chef Division",
    actif: true,
  },
  {
    id: "srv-9",
    code: "CEL-SI",
    nom: "Cellule Systèmes d'Information",
    type: "cellule",
    entiteId: "ent-1",
    parentServiceId: "srv-1",
    responsable: "Chef Cellule SI",
    email: "si@ofor.sn",
    actif: true,
  },
  // Services DGPRE
  {
    id: "srv-10",
    code: "DRE",
    nom: "Division Ressources en Eau",
    type: "division",
    entiteId: "ent-5",
    responsable: "Chef Division",
    actif: true,
  },
  {
    id: "srv-11",
    code: "DPE",
    nom: "Division Planification",
    type: "division",
    entiteId: "ent-5",
    responsable: "Chef Division",
    actif: true,
  },
];

// Fonction utilitaire pour obtenir une entité par ID
export const getEntiteById = (id: string): EntiteExecution | undefined => {
  return mockEntitesExecution.find((e) => e.id === id);
};

// Fonction utilitaire pour obtenir une entité par code
export const getEntiteByCode = (code: string): EntiteExecution | undefined => {
  return mockEntitesExecution.find((e) => e.code === code);
};

// Fonction utilitaire pour obtenir les services d'une entité
export const getServicesByEntite = (entiteId: string): Service[] => {
  return mockServices.filter((s) => s.entiteId === entiteId);
};

// Fonction utilitaire pour obtenir un service par ID
export const getServiceById = (id: string): Service | undefined => {
  return mockServices.find((s) => s.id === id);
};

// Fonction utilitaire pour obtenir les sous-services d'un service parent
export const getChildServices = (parentServiceId: string): Service[] => {
  return mockServices.filter((s) => s.parentServiceId === parentServiceId);
};

// Obtenir le chemin hiérarchique d'un service
export const getServicePath = (serviceId: string): Service[] => {
  const path: Service[] = [];
  let current = getServiceById(serviceId);
  while (current) {
    path.unshift(current);
    current = current.parentServiceId ? getServiceById(current.parentServiceId) : undefined;
  }
  return path;
};
