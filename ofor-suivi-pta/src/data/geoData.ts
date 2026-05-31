// Référentiel géographique du Sénégal

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

// Structure géographique complète du Sénégal
export const SENEGAL_GEO: Region[] = [
  {
    code: "DK",
    name: "Dakar",
    departements: [
      {
        code: "DK-DK",
        name: "Dakar",
        communes: [
          { code: "DK-DK-001", name: "Dakar-Plateau" },
          { code: "DK-DK-002", name: "Gorée" },
          { code: "DK-DK-003", name: "Fann-Point E-Amitié" },
          { code: "DK-DK-004", name: "Gueule Tapée-Fass-Colobane" },
          { code: "DK-DK-005", name: "Médina" },
          { code: "DK-DK-006", name: "Grand Dakar" },
          { code: "DK-DK-007", name: "Biscuiterie" },
          { code: "DK-DK-008", name: "Hann Bel-Air" },
        ],
      },
      {
        code: "DK-GU",
        name: "Guédiawaye",
        communes: [
          { code: "DK-GU-001", name: "Golf Sud" },
          { code: "DK-GU-002", name: "Sam Notaire" },
          { code: "DK-GU-003", name: "Ndiarème Limamoulaye" },
          { code: "DK-GU-004", name: "Wakhinane Nimzatt" },
          { code: "DK-GU-005", name: "Médina Gounass" },
        ],
      },
      {
        code: "DK-PI",
        name: "Pikine",
        communes: [
          { code: "DK-PI-001", name: "Pikine-Est" },
          { code: "DK-PI-002", name: "Pikine-Ouest" },
          { code: "DK-PI-003", name: "Pikine-Nord" },
          { code: "DK-PI-004", name: "Dalifort" },
          { code: "DK-PI-005", name: "Djida Thiaroye Kao" },
          { code: "DK-PI-006", name: "Guinaw Rails Nord" },
          { code: "DK-PI-007", name: "Guinaw Rails Sud" },
          { code: "DK-PI-008", name: "Thiaroye sur Mer" },
          { code: "DK-PI-009", name: "Tivaouane Diacksao" },
          { code: "DK-PI-010", name: "Diamaguène Sicap Mbao" },
          { code: "DK-PI-011", name: "Mbao" },
          { code: "DK-PI-012", name: "Thiaroye Gare" },
          { code: "DK-PI-013", name: "Yeumbeul Nord" },
          { code: "DK-PI-014", name: "Yeumbeul Sud" },
          { code: "DK-PI-015", name: "Keur Massar" },
          { code: "DK-PI-016", name: "Malika" },
        ],
      },
      {
        code: "DK-RU",
        name: "Rufisque",
        communes: [
          { code: "DK-RU-001", name: "Rufisque-Est" },
          { code: "DK-RU-002", name: "Rufisque-Ouest" },
          { code: "DK-RU-003", name: "Rufisque-Nord" },
          { code: "DK-RU-004", name: "Bargny" },
          { code: "DK-RU-005", name: "Diamniadio" },
          { code: "DK-RU-006", name: "Sébikotane" },
          { code: "DK-RU-007", name: "Sendou" },
          { code: "DK-RU-008", name: "Sangalkam" },
          { code: "DK-RU-009", name: "Bambilor" },
          { code: "DK-RU-010", name: "Tivaouane Peul" },
          { code: "DK-RU-011", name: "Jaxaay-Parcelles" },
          { code: "DK-RU-012", name: "Yène" },
        ],
      },
    ],
  },
  {
    code: "TH",
    name: "Thiès",
    departements: [
      {
        code: "TH-TH",
        name: "Thiès",
        communes: [
          { code: "TH-TH-001", name: "Thiès-Est" },
          { code: "TH-TH-002", name: "Thiès-Ouest" },
          { code: "TH-TH-003", name: "Thiès-Nord" },
          { code: "TH-TH-004", name: "Kayar" },
          { code: "TH-TH-005", name: "Diender Guedj" },
          { code: "TH-TH-006", name: "Fandène" },
          { code: "TH-TH-007", name: "Keur Moussa" },
          { code: "TH-TH-008", name: "Ndieyène Sirakh" },
          { code: "TH-TH-009", name: "Tassette" },
          { code: "TH-TH-010", name: "Pout" },
        ],
      },
      {
        code: "TH-MB",
        name: "Mbour",
        communes: [
          { code: "TH-MB-001", name: "Mbour" },
          { code: "TH-MB-002", name: "Joal-Fadiouth" },
          { code: "TH-MB-003", name: "Saly Portudal" },
          { code: "TH-MB-004", name: "Nguékhokh" },
          { code: "TH-MB-005", name: "Somone" },
          { code: "TH-MB-006", name: "Popenguine-Ndayane" },
          { code: "TH-MB-007", name: "Sindia" },
          { code: "TH-MB-008", name: "Malicounda" },
          { code: "TH-MB-009", name: "Thiadiaye" },
          { code: "TH-MB-010", name: "Fissel" },
          { code: "TH-MB-011", name: "Ndiaganiao" },
          { code: "TH-MB-012", name: "Sessène" },
        ],
      },
      {
        code: "TH-TV",
        name: "Tivaouane",
        communes: [
          { code: "TH-TV-001", name: "Tivaouane" },
          { code: "TH-TV-002", name: "Mékhé" },
          { code: "TH-TV-003", name: "Méouane" },
          { code: "TH-TV-004", name: "Pambal" },
          { code: "TH-TV-005", name: "Pékesse" },
          { code: "TH-TV-006", name: "Mont Rolland" },
          { code: "TH-TV-007", name: "Notto Diobass" },
        ],
      },
    ],
  },
  {
    code: "SL",
    name: "Saint-Louis",
    departements: [
      {
        code: "SL-SL",
        name: "Saint-Louis",
        communes: [
          { code: "SL-SL-001", name: "Saint-Louis" },
          { code: "SL-SL-002", name: "Gandon" },
          { code: "SL-SL-003", name: "Fass Ngom" },
          { code: "SL-SL-004", name: "Mpal" },
          { code: "SL-SL-005", name: "Ndiébène Gandiol" },
        ],
      },
      {
        code: "SL-DA",
        name: "Dagana",
        communes: [
          { code: "SL-DA-001", name: "Dagana" },
          { code: "SL-DA-002", name: "Richard-Toll" },
          { code: "SL-DA-003", name: "Ross Béthio" },
          { code: "SL-DA-004", name: "Rosso-Sénégal" },
          { code: "SL-DA-005", name: "Bokhol" },
          { code: "SL-DA-006", name: "Gaé" },
          { code: "SL-DA-007", name: "Mbane" },
          { code: "SL-DA-008", name: "Ndombo Sandjiry" },
          { code: "SL-DA-009", name: "Ronkh" },
        ],
      },
      {
        code: "SL-PO",
        name: "Podor",
        communes: [
          { code: "SL-PO-001", name: "Podor" },
          { code: "SL-PO-002", name: "Ndioum" },
          { code: "SL-PO-003", name: "Galoya Toucouleur" },
          { code: "SL-PO-004", name: "Gamadji Saré" },
          { code: "SL-PO-005", name: "Guédé Village" },
          { code: "SL-PO-006", name: "Aéré Lao" },
          { code: "SL-PO-007", name: "Fanaye" },
          { code: "SL-PO-008", name: "Ndiayène Pendao" },
          { code: "SL-PO-009", name: "Doumga Lao" },
        ],
      },
    ],
  },
  {
    code: "DI",
    name: "Diourbel",
    departements: [
      {
        code: "DI-DI",
        name: "Diourbel",
        communes: [
          { code: "DI-DI-001", name: "Diourbel" },
          { code: "DI-DI-002", name: "Ndindy" },
          { code: "DI-DI-003", name: "Ndoulo" },
          { code: "DI-DI-004", name: "Tocky Gare" },
          { code: "DI-DI-005", name: "Patar" },
        ],
      },
      {
        code: "DI-BA",
        name: "Bambey",
        communes: [
          { code: "DI-BA-001", name: "Bambey" },
          { code: "DI-BA-002", name: "Dinguiraye" },
          { code: "DI-BA-003", name: "Ngogom" },
          { code: "DI-BA-004", name: "Ngoye" },
          { code: "DI-BA-005", name: "Lambaye" },
        ],
      },
      {
        code: "DI-MB",
        name: "Mbacké",
        communes: [
          { code: "DI-MB-001", name: "Mbacké" },
          { code: "DI-MB-002", name: "Touba Mosquée" },
          { code: "DI-MB-003", name: "Darou Moukhty" },
          { code: "DI-MB-004", name: "Ndame" },
          { code: "DI-MB-005", name: "Sadio" },
          { code: "DI-MB-006", name: "Taif" },
          { code: "DI-MB-007", name: "Touba Fall" },
        ],
      },
    ],
  },
  {
    code: "FA",
    name: "Fatick",
    departements: [
      {
        code: "FA-FA",
        name: "Fatick",
        communes: [
          { code: "FA-FA-001", name: "Fatick" },
          { code: "FA-FA-002", name: "Diakhao" },
          { code: "FA-FA-003", name: "Diaoulé" },
          { code: "FA-FA-004", name: "Diouroup" },
          { code: "FA-FA-005", name: "Fimela" },
          { code: "FA-FA-006", name: "Loul Sessène" },
          { code: "FA-FA-007", name: "Mbellacadiao" },
          { code: "FA-FA-008", name: "Ndiob" },
          { code: "FA-FA-009", name: "Palmarin Facao" },
          { code: "FA-FA-010", name: "Tattaguine" },
        ],
      },
      {
        code: "FA-FO",
        name: "Foundiougne",
        communes: [
          { code: "FA-FO-001", name: "Foundiougne" },
          { code: "FA-FO-002", name: "Sokone" },
          { code: "FA-FO-003", name: "Karang Poste" },
          { code: "FA-FO-004", name: "Djilor" },
          { code: "FA-FO-005", name: "Keur Saloum Diané" },
          { code: "FA-FO-006", name: "Niodior" },
          { code: "FA-FO-007", name: "Passy" },
          { code: "FA-FO-008", name: "Toubacouta" },
        ],
      },
      {
        code: "FA-GO",
        name: "Gossas",
        communes: [
          { code: "FA-GO-001", name: "Gossas" },
          { code: "FA-GO-002", name: "Colobane" },
          { code: "FA-GO-003", name: "Mbar" },
          { code: "FA-GO-004", name: "Ouadiour" },
          { code: "FA-GO-005", name: "Patar Lia" },
        ],
      },
    ],
  },
  {
    code: "KA",
    name: "Kaolack",
    departements: [
      {
        code: "KA-KA",
        name: "Kaolack",
        communes: [
          { code: "KA-KA-001", name: "Kaolack" },
          { code: "KA-KA-002", name: "Kahone" },
          { code: "KA-KA-003", name: "Keur Baka" },
          { code: "KA-KA-004", name: "Latmingué" },
          { code: "KA-KA-005", name: "Ndiaffate" },
          { code: "KA-KA-006", name: "Ndiédieng" },
          { code: "KA-KA-007", name: "Thiomby" },
        ],
      },
      {
        code: "KA-GU",
        name: "Guinguinéo",
        communes: [
          { code: "KA-GU-001", name: "Guinguinéo" },
          { code: "KA-GU-002", name: "Mboss" },
          { code: "KA-GU-003", name: "Ndiago" },
          { code: "KA-GU-004", name: "Ngathie Naoudé" },
          { code: "KA-GU-005", name: "Ourour" },
        ],
      },
      {
        code: "KA-NI",
        name: "Nioro du Rip",
        communes: [
          { code: "KA-NI-001", name: "Nioro du Rip" },
          { code: "KA-NI-002", name: "Gainthe Pathé" },
          { code: "KA-NI-003", name: "Keur Madiabel" },
          { code: "KA-NI-004", name: "Médina Sabakh" },
          { code: "KA-NI-005", name: "Ngayokhème" },
          { code: "KA-NI-006", name: "Paoskoto" },
          { code: "KA-NI-007", name: "Porokhane" },
          { code: "KA-NI-008", name: "Taïba Niassène" },
          { code: "KA-NI-009", name: "Wack Ngouna" },
        ],
      },
    ],
  },
  {
    code: "KF",
    name: "Kaffrine",
    departements: [
      {
        code: "KF-KF",
        name: "Kaffrine",
        communes: [
          { code: "KF-KF-001", name: "Kaffrine" },
          { code: "KF-KF-002", name: "Boulel" },
          { code: "KF-KF-003", name: "Diamagadio" },
          { code: "KF-KF-004", name: "Gniby" },
          { code: "KF-KF-005", name: "Kahi" },
          { code: "KF-KF-006", name: "Kathiotte" },
          { code: "KF-KF-007", name: "Ndiognick" },
          { code: "KF-KF-008", name: "Nganda" },
        ],
      },
      {
        code: "KF-BI",
        name: "Birkelane",
        communes: [
          { code: "KF-BI-001", name: "Birkelane" },
          { code: "KF-BI-002", name: "Diamal" },
          { code: "KF-BI-003", name: "Keur Mboucki" },
          { code: "KF-BI-004", name: "Mabo" },
          { code: "KF-BI-005", name: "Ndiobène Samba Lamo" },
          { code: "KF-BI-006", name: "Ségré Gatta" },
        ],
      },
      {
        code: "KF-KO",
        name: "Koungheul",
        communes: [
          { code: "KF-KO-001", name: "Koungheul" },
          { code: "KF-KO-002", name: "Fass Thiékène" },
          { code: "KF-KO-003", name: "Ida Mouride" },
          { code: "KF-KO-004", name: "Lour Escale" },
          { code: "KF-KO-005", name: "Missirah Wadène" },
          { code: "KF-KO-006", name: "Ribot Escale" },
          { code: "KF-KO-007", name: "Saly Escale" },
        ],
      },
      {
        code: "KF-MA",
        name: "Malem-Hodar",
        communes: [
          { code: "KF-MA-001", name: "Malem-Hodar" },
          { code: "KF-MA-002", name: "Darou Minam II" },
          { code: "KF-MA-003", name: "Khelcom" },
          { code: "KF-MA-004", name: "Ndioum Ngainth" },
          { code: "KF-MA-005", name: "Sagna" },
        ],
      },
    ],
  },
  {
    code: "LO",
    name: "Louga",
    departements: [
      {
        code: "LO-LO",
        name: "Louga",
        communes: [
          { code: "LO-LO-001", name: "Louga" },
          { code: "LO-LO-002", name: "Coki" },
          { code: "LO-LO-003", name: "Gande" },
          { code: "LO-LO-004", name: "Guet Ardo" },
          { code: "LO-LO-005", name: "Keur Momar Sarr" },
          { code: "LO-LO-006", name: "Léona" },
          { code: "LO-LO-007", name: "Mbédiène" },
          { code: "LO-LO-008", name: "Ndiagne" },
          { code: "LO-LO-009", name: "Nguidilé" },
          { code: "LO-LO-010", name: "Pété Ouarack" },
          { code: "LO-LO-011", name: "Sakal" },
        ],
      },
      {
        code: "LO-KE",
        name: "Kébémer",
        communes: [
          { code: "LO-KE-001", name: "Kébémer" },
          { code: "LO-KE-002", name: "Darou Mousty" },
          { code: "LO-KE-003", name: "Guéoul" },
          { code: "LO-KE-004", name: "Mbacké Cayor" },
          { code: "LO-KE-005", name: "Ndande" },
          { code: "LO-KE-006", name: "Sagatta Gueth" },
          { code: "LO-KE-007", name: "Sam Yabal" },
          { code: "LO-KE-008", name: "Thieppe" },
          { code: "LO-KE-009", name: "Touba Mérina" },
        ],
      },
      {
        code: "LO-LI",
        name: "Linguère",
        communes: [
          { code: "LO-LI-001", name: "Linguère" },
          { code: "LO-LI-002", name: "Dahra" },
          { code: "LO-LI-003", name: "Barkedji" },
          { code: "LO-LI-004", name: "Boulal" },
          { code: "LO-LI-005", name: "Déali" },
          { code: "LO-LI-006", name: "Dodji" },
          { code: "LO-LI-007", name: "Gassane" },
          { code: "LO-LI-008", name: "Kamb" },
          { code: "LO-LI-009", name: "Mbeuleukhé" },
          { code: "LO-LI-010", name: "Ouarkhokh" },
          { code: "LO-LI-011", name: "Sagatta Djolof" },
          { code: "LO-LI-012", name: "Thiel" },
          { code: "LO-LI-013", name: "Yang-Yang" },
        ],
      },
    ],
  },
  {
    code: "MA",
    name: "Matam",
    departements: [
      {
        code: "MA-MA",
        name: "Matam",
        communes: [
          { code: "MA-MA-001", name: "Matam" },
          { code: "MA-MA-002", name: "Agnam Civol" },
          { code: "MA-MA-003", name: "Nabadji Civol" },
          { code: "MA-MA-004", name: "Ogo" },
          { code: "MA-MA-005", name: "Ourossogui" },
          { code: "MA-MA-006", name: "Oréfondé" },
          { code: "MA-MA-007", name: "Thilogne" },
        ],
      },
      {
        code: "MA-KA",
        name: "Kanel",
        communes: [
          { code: "MA-KA-001", name: "Kanel" },
          { code: "MA-KA-002", name: "Dembancané" },
          { code: "MA-KA-003", name: "Hamady Hounaré" },
          { code: "MA-KA-004", name: "Ndendory" },
          { code: "MA-KA-005", name: "Odobéré" },
          { code: "MA-KA-006", name: "Orkadière" },
          { code: "MA-KA-007", name: "Semmé" },
          { code: "MA-KA-008", name: "Waoundé" },
        ],
      },
      {
        code: "MA-RA",
        name: "Ranérou",
        communes: [
          { code: "MA-RA-001", name: "Ranérou Ferlo" },
          { code: "MA-RA-002", name: "Lougré Thioly" },
          { code: "MA-RA-003", name: "Oudalaye" },
          { code: "MA-RA-004", name: "Vélingara" },
        ],
      },
    ],
  },
  {
    code: "TA",
    name: "Tambacounda",
    departements: [
      {
        code: "TA-TA",
        name: "Tambacounda",
        communes: [
          { code: "TA-TA-001", name: "Tambacounda" },
          { code: "TA-TA-002", name: "Dialakoto" },
          { code: "TA-TA-003", name: "Koussanar" },
          { code: "TA-TA-004", name: "Makacolibantang" },
          { code: "TA-TA-005", name: "Missirah" },
          { code: "TA-TA-006", name: "Nétéboulou" },
          { code: "TA-TA-007", name: "Ndoga Babacar" },
          { code: "TA-TA-008", name: "Sinthiou Malème" },
        ],
      },
      {
        code: "TA-BA",
        name: "Bakel",
        communes: [
          { code: "TA-BA-001", name: "Bakel" },
          { code: "TA-BA-002", name: "Diawara" },
          { code: "TA-BA-003", name: "Kéniéba" },
          { code: "TA-BA-004", name: "Kidira" },
          { code: "TA-BA-005", name: "Moudéry" },
          { code: "TA-BA-006", name: "Sadatou" },
          { code: "TA-BA-007", name: "Sinthiou Fissa" },
          { code: "TA-BA-008", name: "Gabou" },
        ],
      },
      {
        code: "TA-GO",
        name: "Goudiry",
        communes: [
          { code: "TA-GO-001", name: "Goudiry" },
          { code: "TA-GO-002", name: "Bala" },
          { code: "TA-GO-003", name: "Boynguel Bamba" },
          { code: "TA-GO-004", name: "Dougué" },
          { code: "TA-GO-005", name: "Kothiary" },
          { code: "TA-GO-006", name: "Koulor" },
          { code: "TA-GO-007", name: "Sinthiou Mamadou Boubou" },
        ],
      },
      {
        code: "TA-KO",
        name: "Koumpentoum",
        communes: [
          { code: "TA-KO-001", name: "Koumpentoum" },
          { code: "TA-KO-002", name: "Bamba Thialène" },
          { code: "TA-KO-003", name: "Kahène" },
          { code: "TA-KO-004", name: "Kouthiaba Wolof" },
          { code: "TA-KO-005", name: "Méréto" },
          { code: "TA-KO-006", name: "Ndame" },
          { code: "TA-KO-007", name: "Payar" },
        ],
      },
    ],
  },
  {
    code: "KD",
    name: "Kédougou",
    departements: [
      {
        code: "KD-KD",
        name: "Kédougou",
        communes: [
          { code: "KD-KD-001", name: "Kédougou" },
          { code: "KD-KD-002", name: "Bandafassi" },
          { code: "KD-KD-003", name: "Dimboli" },
          { code: "KD-KD-004", name: "Fongolimbi" },
          { code: "KD-KD-005", name: "Ninéfécha" },
          { code: "KD-KD-006", name: "Tomboronkoto" },
        ],
      },
      {
        code: "KD-SA",
        name: "Salémata",
        communes: [
          { code: "KD-SA-001", name: "Salémata" },
          { code: "KD-SA-002", name: "Dar Salam" },
          { code: "KD-SA-003", name: "Ethiolo" },
          { code: "KD-SA-004", name: "Kévoye" },
          { code: "KD-SA-005", name: "Oubadji" },
        ],
      },
      {
        code: "KD-SA2",
        name: "Saraya",
        communes: [
          { code: "KD-SA2-001", name: "Saraya" },
          { code: "KD-SA2-002", name: "Bembou" },
          { code: "KD-SA2-003", name: "Khossanto" },
          { code: "KD-SA2-004", name: "Médina Baffe" },
          { code: "KD-SA2-005", name: "Sabodala" },
        ],
      },
    ],
  },
  {
    code: "KO",
    name: "Kolda",
    departements: [
      {
        code: "KO-KO",
        name: "Kolda",
        communes: [
          { code: "KO-KO-001", name: "Kolda" },
          { code: "KO-KO-002", name: "Bagadadji" },
          { code: "KO-KO-003", name: "Dabo" },
          { code: "KO-KO-004", name: "Dioulacolon" },
          { code: "KO-KO-005", name: "Guiro Yéro Bocar" },
          { code: "KO-KO-006", name: "Médina Chérif" },
          { code: "KO-KO-007", name: "Médina El Hadji" },
          { code: "KO-KO-008", name: "Salikégné" },
          { code: "KO-KO-009", name: "Tankanto Escale" },
          { code: "KO-KO-010", name: "Thietty" },
        ],
      },
      {
        code: "KO-ME",
        name: "Médina Yoro Foulah",
        communes: [
          { code: "KO-ME-001", name: "Médina Yoro Foulah" },
          { code: "KO-ME-002", name: "Badion" },
          { code: "KO-ME-003", name: "Bourouco" },
          { code: "KO-ME-004", name: "Dinguiraye" },
          { code: "KO-ME-005", name: "Fafacourou" },
          { code: "KO-ME-006", name: "Kéréwane" },
          { code: "KO-ME-007", name: "Ndorna" },
          { code: "KO-ME-008", name: "Niaming" },
          { code: "KO-ME-009", name: "Pata" },
        ],
      },
      {
        code: "KO-VE",
        name: "Vélingara",
        communes: [
          { code: "KO-VE-001", name: "Vélingara" },
          { code: "KO-VE-002", name: "Bonconto" },
          { code: "KO-VE-003", name: "Diaobé-Kabendou" },
          { code: "KO-VE-004", name: "Kandia" },
          { code: "KO-VE-005", name: "Kounkané" },
          { code: "KO-VE-006", name: "Linkéring" },
          { code: "KO-VE-007", name: "Médina Gounass" },
          { code: "KO-VE-008", name: "Némataba" },
          { code: "KO-VE-009", name: "Pakour" },
          { code: "KO-VE-010", name: "Paroumba" },
          { code: "KO-VE-011", name: "Sinthiang Koundara" },
        ],
      },
    ],
  },
  {
    code: "SE",
    name: "Sédhiou",
    departements: [
      {
        code: "SE-SE",
        name: "Sédhiou",
        communes: [
          { code: "SE-SE-001", name: "Sédhiou" },
          { code: "SE-SE-002", name: "Bambali" },
          { code: "SE-SE-003", name: "Bemet Bidjini" },
          { code: "SE-SE-004", name: "Diannah Malary" },
          { code: "SE-SE-005", name: "Diendé" },
          { code: "SE-SE-006", name: "Djibabouya" },
          { code: "SE-SE-007", name: "Djirédji" },
          { code: "SE-SE-008", name: "Koussy" },
          { code: "SE-SE-009", name: "Marsassoum" },
          { code: "SE-SE-010", name: "Oudoucar" },
          { code: "SE-SE-011", name: "Same Kanta Peulh" },
          { code: "SE-SE-012", name: "Sakar" },
        ],
      },
      {
        code: "SE-BO",
        name: "Bounkiling",
        communes: [
          { code: "SE-BO-001", name: "Bounkiling" },
          { code: "SE-BO-002", name: "Boghal" },
          { code: "SE-BO-003", name: "Bona" },
          { code: "SE-BO-004", name: "Diacounda" },
          { code: "SE-BO-005", name: "Diaroumé" },
          { code: "SE-BO-006", name: "Inor" },
          { code: "SE-BO-007", name: "Kandion Mangana" },
          { code: "SE-BO-008", name: "Madina Wandifa" },
          { code: "SE-BO-009", name: "Ndiamalathiel" },
          { code: "SE-BO-010", name: "Tankon" },
        ],
      },
      {
        code: "SE-GO",
        name: "Goudomp",
        communes: [
          { code: "SE-GO-001", name: "Goudomp" },
          { code: "SE-GO-002", name: "Djibanar" },
          { code: "SE-GO-003", name: "Kaour" },
          { code: "SE-GO-004", name: "Karantaba" },
          { code: "SE-GO-005", name: "Mangaroungou Santo" },
          { code: "SE-GO-006", name: "Niagha" },
          { code: "SE-GO-007", name: "Samine" },
          { code: "SE-GO-008", name: "Simbandi Balante" },
          { code: "SE-GO-009", name: "Simbandi Brassou" },
          { code: "SE-GO-010", name: "Tanaff" },
          { code: "SE-GO-011", name: "Yarang Balante" },
        ],
      },
    ],
  },
  {
    code: "ZG",
    name: "Ziguinchor",
    departements: [
      {
        code: "ZG-ZG",
        name: "Ziguinchor",
        communes: [
          { code: "ZG-ZG-001", name: "Ziguinchor" },
          { code: "ZG-ZG-002", name: "Adéane" },
          { code: "ZG-ZG-003", name: "Boutoupa Camaracounda" },
          { code: "ZG-ZG-004", name: "Niaguis" },
          { code: "ZG-ZG-005", name: "Niassia" },
        ],
      },
      {
        code: "ZG-BI",
        name: "Bignona",
        communes: [
          { code: "ZG-BI-001", name: "Bignona" },
          { code: "ZG-BI-002", name: "Balingore" },
          { code: "ZG-BI-003", name: "Coubalan" },
          { code: "ZG-BI-004", name: "Diégoune" },
          { code: "ZG-BI-005", name: "Djiléne" },
          { code: "ZG-BI-006", name: "Djinaky" },
          { code: "ZG-BI-007", name: "Kafountine" },
          { code: "ZG-BI-008", name: "Kataba 1" },
          { code: "ZG-BI-009", name: "Kartiack" },
          { code: "ZG-BI-010", name: "Mangagoulack" },
          { code: "ZG-BI-011", name: "Mlomp" },
          { code: "ZG-BI-012", name: "Ouonck" },
          { code: "ZG-BI-013", name: "Sindian" },
          { code: "ZG-BI-014", name: "Tenghory" },
          { code: "ZG-BI-015", name: "Thionk Essyl" },
        ],
      },
      {
        code: "ZG-OU",
        name: "Oussouye",
        communes: [
          { code: "ZG-OU-001", name: "Oussouye" },
          { code: "ZG-OU-002", name: "Diembéring" },
          { code: "ZG-OU-003", name: "Mlomp (Oussouye)" },
          { code: "ZG-OU-004", name: "Oukout" },
          { code: "ZG-OU-005", name: "Santhiaba Manjaque" },
        ],
      },
    ],
  },
];

// Helper functions
export const getAllRegions = () => SENEGAL_GEO.map((r) => ({ code: r.code, name: r.name }));

export const getDepartementsByRegion = (regionCode: string) => {
  const region = SENEGAL_GEO.find((r) => r.code === regionCode);
  return region ? region.departements.map((d) => ({ code: d.code, name: d.name })) : [];
};

export const getCommunesByDepartement = (departementCode: string) => {
  for (const region of SENEGAL_GEO) {
    const dept = region.departements.find((d) => d.code === departementCode);
    if (dept) {
      return dept.communes.map((c) => ({ code: c.code, name: c.name }));
    }
  }
  return [];
};

export const getRegionByCode = (code: string) => SENEGAL_GEO.find((r) => r.code === code);

export const getDepartementByCode = (code: string) => {
  for (const region of SENEGAL_GEO) {
    const dept = region.departements.find((d) => d.code === code);
    if (dept) return { ...dept, regionCode: region.code, regionName: region.name };
  }
  return null;
};

export const getCommuneByCode = (code: string) => {
  for (const region of SENEGAL_GEO) {
    for (const dept of region.departements) {
      const commune = dept.communes.find((c) => c.code === code);
      if (commune) {
        return {
          ...commune,
          regionCode: region.code,
          regionName: region.name,
          departementCode: dept.code,
          departementName: dept.name,
        };
      }
    }
  }
  return null;
};

// Format zone for display
export const formatZoneIntervention = (zone: ZoneIntervention): string => {
  if (zone.type === "commune" && zone.communeName) {
    return `${zone.communeName} (${zone.departementName})`;
  }
  if (zone.type === "departement" && zone.departementName) {
    return `${zone.departementName} (${zone.regionName})`;
  }
  return zone.regionName;
};

// Get zone label by type
export const getZoneTypeLabel = (type: ZoneIntervention["type"]): string => {
  const labels = {
    region: "Région",
    departement: "Département",
    commune: "Commune",
  };
  return labels[type];
};
