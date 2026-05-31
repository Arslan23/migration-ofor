// Types de rôles disponibles pour les projets
export type RoleProjet = 
  | "chef_projet" 
  | "charge_suivi_operationnel" 
  | "charge_suivi_financier" 
  | "responsable_passation_marche";

export const ROLE_LABELS: Record<RoleProjet, string> = {
  chef_projet: "Chef de projet",
  charge_suivi_operationnel: "Chargé de suivi opérationnel",
  charge_suivi_financier: "Chargé de suivi financier",
  responsable_passation_marche: "Responsable passation de marché",
};

// Interface pour un membre du personnel
export interface Personnel {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  fonction: string;
  direction?: string;
  entiteId?: string; // Lien vers l'entité d'exécution
  actif: boolean;
}

// Interface pour l'affectation d'un personnel à un projet
export interface AffectationPersonnel {
  personnelId: string;
  role: RoleProjet;
}

// Données mock du personnel
export const mockPersonnel: Personnel[] = [
  {
    id: "pers-1",
    matricule: "OFOR-001",
    nom: "Ndiaye",
    prenom: "Yandé",
    email: "yande.ndiaye@ofor.sn",
    telephone: "+221 77 123 45 67",
    fonction: "Chef de projet",
    direction: "Direction des Projets",
    entiteId: "ent-1",
    actif: true,
  },
  {
    id: "pers-2",
    matricule: "OFOR-002",
    nom: "Ba",
    prenom: "Oumar",
    email: "oumar.ba@ofor.sn",
    telephone: "+221 77 234 56 78",
    fonction: "Ingénieur hydraulique",
    direction: "Direction Technique",
    actif: true,
  },
  {
    id: "pers-3",
    matricule: "OFOR-003",
    nom: "Diallo",
    prenom: "Aminata",
    email: "aminata.diallo@ofor.sn",
    telephone: "+221 77 345 67 89",
    fonction: "Chargé de suivi-évaluation",
    direction: "Direction des Projets",
    actif: true,
  },
  {
    id: "pers-4",
    matricule: "OFOR-004",
    nom: "Fall",
    prenom: "Ibrahima",
    email: "ibrahima.fall@ofor.sn",
    telephone: "+221 77 456 78 90",
    fonction: "Comptable projet",
    direction: "Direction Administrative et Financière",
    actif: true,
  },
  {
    id: "pers-5",
    matricule: "OFOR-005",
    nom: "Sow",
    prenom: "Fatou",
    email: "fatou.sow@ofor.sn",
    telephone: "+221 77 567 89 01",
    fonction: "Responsable passation des marchés",
    direction: "Direction Administrative et Financière",
    actif: true,
  },
  {
    id: "pers-6",
    matricule: "OFOR-006",
    nom: "Gueye",
    prenom: "Moussa",
    email: "moussa.gueye@ofor.sn",
    telephone: "+221 77 678 90 12",
    fonction: "Chef de projet adjoint",
    direction: "Direction des Projets",
    actif: true,
  },
  {
    id: "pers-7",
    matricule: "OFOR-007",
    nom: "Diop",
    prenom: "Cheikh",
    email: "cheikh.diop@ofor.sn",
    telephone: "+221 77 789 01 23",
    fonction: "Contrôleur de gestion",
    direction: "Direction Administrative et Financière",
    actif: true,
  },
  {
    id: "pers-8",
    matricule: "OFOR-008",
    nom: "Sy",
    prenom: "Aïssatou",
    email: "aissatou.sy@ofor.sn",
    telephone: "+221 77 890 12 34",
    fonction: "Spécialiste environnement",
    direction: "Direction Technique",
    actif: true,
  },
  {
    id: "pers-9",
    matricule: "OFOR-009",
    nom: "Mbaye",
    prenom: "Mamadou",
    email: "mamadou.mbaye@ofor.sn",
    fonction: "Ingénieur travaux",
    direction: "Direction Technique",
    actif: false,
  },
  {
    id: "pers-10",
    matricule: "OFOR-010",
    nom: "Sarr",
    prenom: "Abdoulaye",
    email: "abdoulaye.sarr@ofor.sn",
    telephone: "+221 77 012 34 56",
    fonction: "Directeur des Projets",
    direction: "Direction des Projets",
    actif: true,
  },
];

// Fonction utilitaire pour obtenir le nom complet d'un personnel
export const getPersonnelFullName = (personnel: Personnel): string => {
  return `${personnel.prenom} ${personnel.nom}`;
};

// Fonction utilitaire pour trouver un personnel par ID
export const getPersonnelById = (id: string): Personnel | undefined => {
  return mockPersonnel.find(p => p.id === id);
};
