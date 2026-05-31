// Interface pour un bailleur
export interface Bailleur {
  id: string;
  code: string;
  nom: string;
  sigle?: string;
  type: BailleurType;
  pays?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  responsable?: string;
  actif: boolean;
}

export type BailleurType = 
  | "bilateral" 
  | "multilateral" 
  | "institution_financiere" 
  | "fondation" 
  | "ong_internationale"
  | "etat"
  | "prive"
  | "autre";

export const BAILLEUR_TYPE_LABELS: Record<BailleurType, string> = {
  bilateral: "Bilatéral",
  multilateral: "Multilatéral",
  institution_financiere: "Institution financière",
  fondation: "Fondation",
  ong_internationale: "ONG Internationale",
  etat: "État / Budget national",
  prive: "Secteur privé",
  autre: "Autre",
};

// Données mock des bailleurs
export const mockBailleurs: Bailleur[] = [
  {
    id: "bail-1",
    code: "BM",
    nom: "Banque Mondiale",
    sigle: "BM",
    type: "multilateral",
    pays: "International",
    email: "info@worldbank.org",
    siteWeb: "www.worldbank.org",
    actif: true,
  },
  {
    id: "bail-2",
    code: "AFD",
    nom: "Agence Française de Développement",
    sigle: "AFD",
    type: "bilateral",
    pays: "France",
    email: "contact@afd.fr",
    siteWeb: "www.afd.fr",
    actif: true,
  },
  {
    id: "bail-3",
    code: "BAD",
    nom: "Banque Africaine de Développement",
    sigle: "BAD",
    type: "multilateral",
    pays: "Afrique",
    email: "afdb@afdb.org",
    siteWeb: "www.afdb.org",
    actif: true,
  },
  {
    id: "bail-4",
    code: "UE",
    nom: "Union Européenne",
    sigle: "UE",
    type: "multilateral",
    pays: "Europe",
    siteWeb: "europa.eu",
    actif: true,
  },
  {
    id: "bail-5",
    code: "JICA",
    nom: "Japan International Cooperation Agency",
    sigle: "JICA",
    type: "bilateral",
    pays: "Japon",
    email: "info@jica.go.jp",
    siteWeb: "www.jica.go.jp",
    actif: true,
  },
  {
    id: "bail-6",
    code: "KFW",
    nom: "Kreditanstalt für Wiederaufbau",
    sigle: "KfW",
    type: "bilateral",
    pays: "Allemagne",
    siteWeb: "www.kfw.de",
    actif: true,
  },
  {
    id: "bail-7",
    code: "BID",
    nom: "Banque Islamique de Développement",
    sigle: "BID",
    type: "multilateral",
    pays: "International",
    siteWeb: "www.isdb.org",
    actif: true,
  },
  {
    id: "bail-8",
    code: "ETAT-SN",
    nom: "État du Sénégal",
    sigle: "ETAT",
    type: "etat",
    pays: "Sénégal",
    actif: true,
  },
  {
    id: "bail-9",
    code: "USAID",
    nom: "United States Agency for International Development",
    sigle: "USAID",
    type: "bilateral",
    pays: "États-Unis",
    siteWeb: "www.usaid.gov",
    actif: true,
  },
  {
    id: "bail-10",
    code: "BMGF",
    nom: "Bill & Melinda Gates Foundation",
    sigle: "BMGF",
    type: "fondation",
    pays: "États-Unis",
    siteWeb: "www.gatesfoundation.org",
    actif: false,
  },
];

// Fonction utilitaire pour obtenir un bailleur par ID
export const getBailleurById = (id: string): Bailleur | undefined => {
  return mockBailleurs.find((b) => b.id === id);
};

// Fonction pour obtenir les bailleurs actifs
export const getBailleursActifs = (): Bailleur[] => {
  return mockBailleurs.filter((b) => b.actif);
};
