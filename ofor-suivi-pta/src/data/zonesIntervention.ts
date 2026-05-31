// Interface pour une zone d'intervention
export interface ZoneIntervention {
  id: string;
  code: string;
  nom: string;
  type: ZoneType;
  region?: string;
  departement?: string;
  population?: number;
  superficie?: number; // en km²
  description?: string;
  actif: boolean;
}

export type ZoneType = 
  | "region" 
  | "departement" 
  | "commune" 
  | "village" 
  | "zone_rurale"
  | "autre";

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  region: "Région",
  departement: "Département",
  commune: "Commune",
  village: "Village",
  zone_rurale: "Zone rurale",
  autre: "Autre",
};

// Données mock des zones d'intervention
export const mockZonesIntervention: ZoneIntervention[] = [
  {
    id: "zone-1",
    code: "DK",
    nom: "Dakar",
    type: "region",
    population: 3732284,
    superficie: 550,
    actif: true,
  },
  {
    id: "zone-2",
    code: "TH",
    nom: "Thiès",
    type: "region",
    population: 1788864,
    superficie: 6601,
    actif: true,
  },
  {
    id: "zone-3",
    code: "SL",
    nom: "Saint-Louis",
    type: "region",
    population: 1001077,
    superficie: 19241,
    actif: true,
  },
  {
    id: "zone-4",
    code: "DL",
    nom: "Diourbel",
    type: "region",
    population: 1801055,
    superficie: 4359,
    actif: true,
  },
  {
    id: "zone-5",
    code: "KL",
    nom: "Kaolack",
    type: "region",
    population: 1066375,
    superficie: 5357,
    actif: true,
  },
  {
    id: "zone-6",
    code: "TIV",
    nom: "Tivaouane",
    type: "departement",
    region: "Thiès",
    population: 412850,
    actif: true,
  },
  {
    id: "zone-7",
    code: "MBR",
    nom: "Mbour",
    type: "departement",
    region: "Thiès",
    population: 892615,
    actif: true,
  },
  {
    id: "zone-8",
    code: "RF",
    nom: "Rufisque",
    type: "departement",
    region: "Dakar",
    population: 503874,
    actif: true,
  },
  {
    id: "zone-9",
    code: "TBK",
    nom: "Tambacounda",
    type: "region",
    population: 731194,
    superficie: 42364,
    actif: true,
  },
  {
    id: "zone-10",
    code: "ZG",
    nom: "Ziguinchor",
    type: "region",
    population: 654884,
    superficie: 7339,
    actif: false,
  },
];

// Fonction utilitaire pour obtenir une zone par ID
export const getZoneById = (id: string): ZoneIntervention | undefined => {
  return mockZonesIntervention.find((z) => z.id === id);
};

// Fonction pour obtenir les zones par type
export const getZonesByType = (type: ZoneType): ZoneIntervention[] => {
  return mockZonesIntervention.filter((z) => z.type === type && z.actif);
};
