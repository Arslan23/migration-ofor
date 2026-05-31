import { AppSettings, defaultSettings } from "@/types/settings";

// Récupérer les paramètres depuis le localStorage
export const getExportSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem("ofor_app_settings");
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Impossible de charger les paramètres d'export:", e);
  }
  return defaultSettings;
};

// Interface pour les paramètres d'entête
export interface ExportHeaderConfig {
  organizationName: string;
  organizationAcronym: string;
  organizationSlogan: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  bannerStyle: "simple" | "gradient" | "modern" | "classic";
  footerLeft: string;
  footerRight: string;
  showLogo: boolean;
  showOrganizationName: boolean;
  showSlogan: boolean;
  showGenerationDate: boolean;
  confidentialityNotice: string;
}

// Obtenir la configuration d'entête pour les exports
export const getExportHeaderConfig = (): ExportHeaderConfig => {
  const settings = getExportSettings();
  return {
    organizationName: settings.organization.name,
    organizationAcronym: settings.organization.acronym,
    organizationSlogan: settings.organization.slogan,
    logoUrl: settings.reportHeader.logoUrl || "",
    primaryColor: settings.reportHeader.headerColor,
    secondaryColor: settings.reportHeader.headerSecondaryColor || settings.reportHeader.headerColor,
    bannerStyle: settings.reportHeader.bannerStyle || "modern",
    footerLeft: settings.reportHeader.footerLeftText,
    footerRight: settings.reportHeader.footerRightText,
    showLogo: settings.reportHeader.showLogo,
    showOrganizationName: settings.reportHeader.showOrganizationName,
    showSlogan: settings.reportHeader.showSlogan,
    showGenerationDate: settings.reportHeader.showGenerationDate,
    confidentialityNotice: settings.reportHeader.confidentialityNotice,
  };
};

// Fonction pour ajuster la luminosité d'une couleur hex
export const adjustColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

// Générer les styles CSS de base pour les exports PDF avec bannière élaborée
export const getBaseExportStyles = (config: ExportHeaderConfig, orientation: "portrait" | "landscape" = "landscape") => `
  <style>
    @page { margin: 0.8cm; size: A4 ${orientation}; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
      font-size: 9px; 
      color: #1a1a1a; 
      line-height: 1.4;
      margin: 0;
      padding: 8px;
    }
    
    /* Bannière d'en-tête élaborée */
    .header-banner {
      position: relative;
      margin: -8px -8px 15px -8px;
      padding: 0;
      overflow: hidden;
    }
    
    /* Style Simple */
    .banner-simple {
      background: ${config.primaryColor};
      padding: 15px 20px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    /* Style Dégradé */
    .banner-gradient {
      background: linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 50%, ${adjustColor(config.secondaryColor, -15)} 100%);
      padding: 18px 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    /* Style Moderne */
    .banner-modern {
      background: linear-gradient(90deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, 15)} 100%);
      padding: 12px 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      border-bottom: 4px solid ${config.secondaryColor};
      position: relative;
    }
    .banner-modern::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 100%);
    }
    .banner-modern::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, ${config.secondaryColor} 0%, ${adjustColor(config.secondaryColor, 30)} 100%);
    }
    
    /* Style Classique */
    .banner-classic {
      background: #fff;
      border: 3px solid ${config.primaryColor};
      border-top: 8px solid ${config.primaryColor};
      padding: 15px 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      margin: 8px 8px 20px 8px;
    }
    .banner-classic .banner-text h1,
    .banner-classic .banner-text .org-name,
    .banner-classic .banner-text .org-slogan { color: ${config.primaryColor} !important; }
    
    /* Logo dans la bannière */
    .banner-logo {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .banner-logo img {
      max-height: 55px;
      max-width: 120px;
      object-fit: contain;
    }
    .banner-logo-fallback {
      width: 55px;
      height: 55px;
      background: rgba(255,255,255,0.95);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      color: ${config.primaryColor};
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .banner-classic .banner-logo-fallback {
      background: ${config.primaryColor};
      color: white;
    }
    
    /* Texte dans la bannière */
    .banner-text {
      flex: 1;
      min-width: 0;
    }
    .banner-text .org-name {
      font-size: 11px;
      color: rgba(255,255,255,0.9);
      font-weight: 500;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .banner-text h1 {
      font-size: 18px;
      color: white;
      margin: 3px 0;
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .banner-text .org-slogan {
      font-size: 9px;
      color: rgba(255,255,255,0.8);
      font-style: italic;
      margin: 0;
    }
    .banner-text .subtitle {
      font-size: 10px;
      color: rgba(255,255,255,0.85);
      margin: 2px 0 0 0;
    }
    
    /* Métadonnées dans la bannière */
    .banner-meta {
      flex-shrink: 0;
      text-align: right;
      padding-left: 15px;
      border-left: 1px solid rgba(255,255,255,0.3);
    }
    .banner-classic .banner-meta {
      border-left-color: ${adjustColor(config.primaryColor, 60)};
    }
    .banner-meta .date {
      font-size: 9px;
      color: rgba(255,255,255,0.9);
      margin: 0 0 3px 0;
    }
    .banner-classic .banner-meta .date { color: #555; }
    .banner-meta .confidentiality {
      font-size: 8px;
      color: rgba(255,255,255,0.7);
      font-style: italic;
      margin: 0;
      max-width: 150px;
    }
    .banner-classic .banner-meta .confidentiality { color: #888; }
    
    /* Séparateur décoratif */
    .header-separator {
      height: 3px;
      background: linear-gradient(90deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, 40)} 50%, ${config.secondaryColor} 100%);
      margin: 0 0 15px 0;
      border-radius: 2px;
    }
    
    /* Résumé */
    .summary { 
      display: flex; 
      gap: 12px; 
      margin-bottom: 12px; 
      padding: 10px; 
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
      border-radius: 6px; 
      flex-wrap: wrap;
      border: 1px solid #dee2e6;
    }
    .summary-item { 
      text-align: center; 
      flex: 1; 
      min-width: 70px;
      padding: 5px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .summary-label { font-size: 7px; color: #666; text-transform: uppercase; font-weight: 600; }
    .summary-value { font-size: 13px; font-weight: bold; color: ${config.primaryColor}; }
    
    /* Tableau */
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { 
      background: linear-gradient(180deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
      color: white; 
      padding: 7px 5px; 
      text-align: left; 
      font-weight: 600; 
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td { padding: 5px; border-bottom: 1px solid #e0e0e0; font-size: 9px; }
    tr:nth-child(even) { background: #f9fafb; }
    tr:hover { background: ${adjustColor(config.primaryColor, 88)}; }
    .amount { text-align: right; font-family: 'Courier New', monospace; font-weight: 500; }
    .total-row { 
      background: linear-gradient(90deg, ${adjustColor(config.primaryColor, 85)} 0%, ${adjustColor(config.primaryColor, 90)} 100%) !important;
      font-weight: bold;
      border-top: 2px solid ${config.primaryColor};
    }
    
    /* Pied de page élaboré */
    .footer { 
      margin-top: 15px; 
      padding: 10px 15px;
      background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
      border-top: 2px solid ${config.primaryColor};
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #555;
      border-radius: 0 0 4px 4px;
    }
    .footer-left { 
      font-weight: 500;
      color: ${config.primaryColor};
    }
    .footer-center {
      font-style: italic;
      color: #888;
    }
    .footer-right { 
      text-align: right;
      color: #666;
    }
    
    .page-break { page-break-before: always; }
  </style>
`;

// Générer l'en-tête HTML avec bannière élaborée
export const generateExportHeader = (
  config: ExportHeaderConfig,
  title: string,
  subtitle?: string,
  date?: string
): string => {
  const dateStr = date || new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  
  const bannerClass = `banner-${config.bannerStyle}`;
  
  // Logo: image si URL fournie, sinon fallback avec acronyme
  const logoHtml = config.showLogo ? `
    <div class="banner-logo">
      ${config.logoUrl 
        ? `<img src="${config.logoUrl}" alt="${config.organizationAcronym}" />`
        : `<div class="banner-logo-fallback">${config.organizationAcronym.substring(0, 3)}</div>`
      }
    </div>
  ` : '';
  
  const metaHtml = (config.showGenerationDate || config.confidentialityNotice) ? `
    <div class="banner-meta">
      ${config.showGenerationDate ? `<p class="date">${dateStr}</p>` : ''}
      ${config.confidentialityNotice ? `<p class="confidentiality">${config.confidentialityNotice}</p>` : ''}
    </div>
  ` : '';
  
  return `
    <div class="header-banner">
      <div class="${bannerClass}">
        ${logoHtml}
        <div class="banner-text">
          ${config.showOrganizationName ? `<p class="org-name">${config.organizationName}</p>` : ''}
          <h1>${title}</h1>
          ${config.showSlogan && config.organizationSlogan ? `<p class="org-slogan">${config.organizationSlogan}</p>` : ''}
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        </div>
        ${metaHtml}
      </div>
    </div>
    ${config.bannerStyle === 'simple' ? '<div class="header-separator"></div>' : ''}
  `;
};

// Générer le pied de page HTML
export const generateExportFooter = (config: ExportHeaderConfig): string => {
  return `
    <div class="footer">
      <span class="footer-left">${config.footerLeft}</span>
      <span class="footer-center">Document généré automatiquement</span>
      <span class="footer-right">${config.footerRight}</span>
    </div>
  `;
};
