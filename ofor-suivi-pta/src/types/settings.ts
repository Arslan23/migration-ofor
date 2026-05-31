// Types pour les paramètres de l'application

export interface OrganizationSettings {
  name: string;
  acronym: string;
  slogan: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  country: string;
  city: string;
}

export interface ReportHeaderSettings {
  showLogo: boolean;
  logoUrl: string; // URL ou base64 du logo
  showOrganizationName: boolean;
  showSlogan: boolean;
  headerTitle: string;
  headerSubtitle: string;
  headerColor: string;
  headerSecondaryColor: string; // Couleur secondaire pour dégradé
  bannerStyle: "simple" | "gradient" | "modern" | "classic"; // Style de bannière
  footerLeftText: string;
  footerRightText: string;
  showPageNumbers: boolean;
  showGenerationDate: boolean;
  confidentialityNotice: string;
}

export interface TechnicalSupportSettings {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  supportHours: string;
  ticketUrl: string;
  documentationUrl: string;
  emergencyPhone: string;
}

export interface MailingSettings {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  notifications: {
    newProject: boolean;
    activityDeadline: boolean;
    cdpReminder: boolean;
    weeklyDigest: boolean;
    monthlyReport: boolean;
    budgetAlert: boolean;
  };
  recipientGroups: {
    id: string;
    name: string;
    emails: string[];
    active: boolean;
  }[];
}

export interface SystemSettings {
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  currencySymbol: string;
  fiscalYearStart: number; // Mois (1-12)
  sessionTimeout: number; // Minutes
  maxUploadSize: number; // MB
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number; // Minutes
  twoFactorEnabled: boolean;
  sessionExpiry: number; // Heures
  ipWhitelist: string[];
}

export interface AppSettings {
  organization: OrganizationSettings;
  reportHeader: ReportHeaderSettings;
  technicalSupport: TechnicalSupportSettings;
  mailing: MailingSettings;
  system: SystemSettings;
  security: SecuritySettings;
}

// Valeurs par défaut
export const defaultSettings: AppSettings = {
  organization: {
    name: "Office des Forages Ruraux",
    acronym: "OFOR",
    slogan: "L'eau pour tous en milieu rural",
    logo: "",
    address: "Dakar, Sénégal",
    phone: "+221 33 XXX XX XX",
    email: "contact@ofor.sn",
    website: "www.ofor.sn",
    country: "Sénégal",
    city: "Dakar",
  },
  reportHeader: {
    showLogo: true,
    logoUrl: "",
    showOrganizationName: true,
    showSlogan: false,
    headerTitle: "Rapport",
    headerSubtitle: "Système de Suivi des Projets et Programmes",
    headerColor: "#0066b2",
    headerSecondaryColor: "#004080",
    bannerStyle: "modern",
    footerLeftText: "OFOR - Office des Forages Ruraux",
    footerRightText: "Système de Suivi des Projets et Programmes",
    showPageNumbers: true,
    showGenerationDate: true,
    confidentialityNotice: "Document à usage interne",
  },
  technicalSupport: {
    contactName: "Support Technique OFOR",
    contactEmail: "support@ofor.sn",
    contactPhone: "+221 33 XXX XX XX",
    supportHours: "Lundi - Vendredi, 8h00 - 17h00",
    ticketUrl: "",
    documentationUrl: "",
    emergencyPhone: "+221 77 XXX XX XX",
  },
  mailing: {
    enabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    senderName: "OFOR - Système de Suivi",
    senderEmail: "noreply@ofor.sn",
    replyToEmail: "support@ofor.sn",
    notifications: {
      newProject: true,
      activityDeadline: true,
      cdpReminder: true,
      weeklyDigest: false,
      monthlyReport: true,
      budgetAlert: true,
    },
    recipientGroups: [
      {
        id: "1",
        name: "Direction",
        emails: ["directeur@ofor.sn"],
        active: true,
      },
      {
        id: "2",
        name: "Chefs de Projet",
        emails: [],
        active: true,
      },
    ],
  },
  system: {
    defaultLanguage: "fr",
    timezone: "Africa/Dakar",
    dateFormat: "dd/MM/yyyy",
    numberFormat: "fr-FR",
    currencySymbol: "FCFA",
    fiscalYearStart: 1,
    sessionTimeout: 60,
    maxUploadSize: 10,
    maintenanceMode: false,
    maintenanceMessage: "",
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    twoFactorEnabled: false,
    sessionExpiry: 24,
    ipWhitelist: [],
  },
};
