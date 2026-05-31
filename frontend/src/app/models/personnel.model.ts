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

export interface Personnel {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string;
    fonction: string;
    direction?: string;
    entiteId?: string;
    actif: boolean;
}

export interface AffectationPersonnel {
    personnelId: string;
    role: RoleProjet;
}

export const getPersonnelFullName = (personnel: Personnel): string => {
    return `${personnel.prenom} ${personnel.nom}`;
};
