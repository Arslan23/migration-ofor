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

export interface Service {
  id: string;
  code: string;
  nom: string;
  type: ServiceType;
  entiteId: string;
  parentServiceId?: string;
  responsable?: string;
  email?: string;
  telephone?: string;
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
