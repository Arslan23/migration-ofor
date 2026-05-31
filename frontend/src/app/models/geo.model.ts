export interface Commune {
    code: string;
    name: string;
}

export interface Departement {
    code: string;
    name: string;
    communes: Commune[];
}

export interface Region {
    code: string;
    name: string;
    departements: Departement[];
}

export interface ZoneIntervention {
    type: "region" | "departement" | "commune";
    regionCode: string;
    regionName: string;
    departementCode?: string;
    departementName?: string;
    communeCode?: string;
    communeName?: string;
}
