import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  getExportHeaderConfig, 
  getBaseExportStyles, 
  generateExportHeader, 
  generateExportFooter,
  ExportHeaderConfig
} from "./exportSettings";

// Formater un montant avec séparateur de milliers (espace)
export const formatMontantReport = (amount: number): string => {
  return new Intl.NumberFormat("fr-FR", { useGrouping: true }).format(amount).replace(/\s/g, " ");
};

// Formater le budget en version courte
export const formatBudgetShort = (amount: number): string => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
  return formatMontantReport(amount);
};

// Générer un nom de fichier avec date
export const generateReportFileName = (reportType: string, extension: string): string => {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: fr });
  return `Rapport_${reportType}_${date}.${extension}`;
};

// Types pour les rapports
export interface ReportKPI {
  label: string;
  value: string | number;
  color?: string;
  trend?: "up" | "down" | "stable";
}

export interface ReportColumn {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  format?: "number" | "budget" | "percent" | "text";
}

export interface ReportChartData {
  type: "pie" | "bar" | "line";
  title: string;
  data: { name: string; value: number; color?: string }[];
}

export interface ReportSummarySection {
  title: string;
  items: { label: string; value: string | number; color?: string }[];
}

export interface ReportBreakdownSection {
  title: string;
  columns: ReportColumn[];
  data: Record<string, any>[];
  showTotal?: boolean;
}

export interface ReportHeaderSettings {
  showLogo: boolean;
  logoUrl?: string;
  showOrganizationName: boolean;
  showSlogan: boolean;
  headerTitle: string;
  headerSubtitle: string;
  headerColor: string;
  headerSecondaryColor?: string;
  bannerStyle?: "simple" | "gradient" | "modern" | "classic";
  footerLeftText: string;
  footerRightText: string;
  showPageNumbers: boolean;
  showGenerationDate: boolean;
  confidentialityNotice: string;
  organizationName: string;
  organizationAcronym: string;
  organizationSlogan: string;
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  period?: string;
  filters?: { label: string; value: string }[];
  kpis?: ReportKPI[];
  columns: ReportColumn[];
  data: Record<string, any>[];
  totals?: Record<string, any>;
  charts?: ReportChartData[];
  headerSettings?: ReportHeaderSettings;
  // Nouvelles sections enrichies
  summaries?: ReportSummarySection[];
  breakdowns?: ReportBreakdownSection[];
  planningData?: {
    byStatus?: Record<string, number>;
    byPeriod?: { period: string; planned: number; realized: number; rate: number }[];
    byCategory?: { name: string; count: number; budget?: number; realized?: number; rate?: number }[];
  };
  executionData?: {
    globalRate?: number;
    budgetTotal?: number;
    budgetSpent?: number;
    budgetAvailable?: number;
    activitiesTotal?: number;
    activitiesCompleted?: number;
    deliverablesTotal?: number;
    deliverablesCompleted?: number;
  };
}

// Formater une valeur selon le type
const formatValue = (value: any, format?: string): string => {
  if (value === null || value === undefined) return "-";
  switch (format) {
    case "number": return typeof value === "number" ? formatMontantReport(value) : String(value);
    case "budget": return typeof value === "number" ? formatMontantReport(value) + " FCFA" : String(value);
    case "percent": return typeof value === "number" ? `${value}%` : String(value);
    default: return String(value);
  }
};

// Générer le badge de performance
const getPerformanceBadge = (value: number): string => {
  if (value >= 100) return `<span class="badge badge-green">Atteint</span>`;
  if (value >= 80) return `<span class="badge badge-amber">En cours</span>`;
  return `<span class="badge badge-red">En retard</span>`;
};

// Générer le badge de statut
const getStatusBadge = (status: string): string => {
  const statusMap: Record<string, { class: string; label: string }> = {
    en_cours: { class: "badge-blue", label: "En cours" },
    termine: { class: "badge-green", label: "Terminé" },
    retard: { class: "badge-red", label: "En retard" },
    planifie: { class: "badge-gray", label: "Planifié" },
    annule: { class: "badge-gray", label: "Annulé" },
    actif: { class: "badge-green", label: "Actif" },
    brouillon: { class: "badge-gray", label: "Brouillon" },
    cloture: { class: "badge-blue", label: "Clôturé" },
  };
  const config = statusMap[status] || { class: "badge-gray", label: status };
  return `<span class="badge ${config.class}">${config.label}</span>`;
};

// Générer la barre de progression
const getProgressBar = (value: number, primaryColor: string): string => {
  const colorClass = value >= 80 ? "green" : value >= 50 ? "amber" : "red";
  return `<span class="progress-bar"><span class="progress-fill ${colorClass}" style="width: ${Math.min(100, value)}%"></span></span>${value}%`;
};

// Styles additionnels pour les rapports enrichis
const getReportAdditionalStyles = (config: ExportHeaderConfig) => `
  <style>
    /* Filtres appliqués */
    .report-filters { display: flex; gap: 15px; margin-bottom: 12px; padding: 8px 12px; background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 6px; flex-wrap: wrap; border: 1px solid #dee2e6; }
    .filter-item { font-size: 9px; }
    .filter-label { color: #666; margin-right: 4px; }
    .filter-value { color: #1a1a1a; font-weight: 600; }
    
    /* KPIs */
    .report-kpis { display: flex; gap: 12px; margin-bottom: 15px; flex-wrap: wrap; }
    .kpi-card { flex: 1; min-width: 90px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 8px; padding: 10px 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .kpi-value { font-size: 18px; font-weight: bold; color: ${config.primaryColor}; }
    .kpi-value.green { color: #22c55e; }
    .kpi-value.amber { color: #f59e0b; }
    .kpi-value.red { color: #ef4444; }
    .kpi-value.blue { color: #3b82f6; }
    .kpi-label { font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; font-weight: 600; }
    
    /* Badges de statut */
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7px; font-weight: 600; text-transform: uppercase; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-gray { background: #f3f4f6; color: #4b5563; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; }
    
    /* Barre de progression */
    .progress-bar { width: 50px; height: 5px; background: #e9ecef; border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 4px; }
    .progress-fill { height: 100%; background: ${config.primaryColor}; border-radius: 3px; }
    .progress-fill.green { background: #22c55e; }
    .progress-fill.amber { background: #f59e0b; }
    .progress-fill.red { background: #ef4444; }

    /* Sections de synthèse enrichies */
    .section-title { font-size: 11px; font-weight: bold; color: ${config.primaryColor}; margin: 15px 0 8px 0; padding-bottom: 4px; border-bottom: 2px solid ${config.primaryColor}; display: flex; align-items: center; gap: 6px; }
    .section-title::before { content: "▪"; font-size: 14px; }
    
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px; }
    .summary-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 10px; }
    .summary-box-title { font-size: 9px; font-weight: 600; color: ${config.primaryColor}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-item { display: flex; justify-content: space-between; font-size: 8px; padding: 3px 0; border-bottom: 1px dotted #dee2e6; }
    .summary-item:last-child { border-bottom: none; }
    .summary-item-label { color: #666; }
    .summary-item-value { font-weight: 600; color: #1a1a1a; }
    .summary-item-value.green { color: #22c55e; }
    .summary-item-value.amber { color: #f59e0b; }
    .summary-item-value.red { color: #ef4444; }
    .summary-item-value.blue { color: #3b82f6; }

    /* Tableau de synthèse compact */
    .breakdown-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 8px; }
    .breakdown-table th { background: ${config.primaryColor}; color: white; padding: 6px 8px; text-align: left; font-size: 7px; text-transform: uppercase; }
    .breakdown-table td { padding: 5px 8px; border-bottom: 1px solid #e9ecef; }
    .breakdown-table tr:nth-child(even) { background: #f8f9fa; }
    .breakdown-table tr.highlight { background: #fef3c7; font-weight: 600; }
    .breakdown-table .total-row { background: #e9ecef; font-weight: bold; }

    /* Indicateurs visuels */
    .indicator-bar { display: flex; align-items: center; gap: 5px; }
    .mini-bar { width: 40px; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden; }
    .mini-bar-fill { height: 100%; border-radius: 2px; }

    /* Grille de données planification/réalisation */
    .planning-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px; }
    .planning-card { background: white; border: 1px solid #e9ecef; border-radius: 6px; padding: 8px; text-align: center; }
    .planning-card.highlight { border-left: 3px solid ${config.primaryColor}; }
    .planning-card-title { font-size: 7px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
    .planning-card-value { font-size: 14px; font-weight: bold; }
    .planning-card-sub { font-size: 7px; color: #888; margin-top: 2px; }

    /* Légende et notes */
    .legend { display: flex; gap: 15px; margin: 10px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 7px; }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-dot.green { background: #22c55e; }
    .legend-dot.amber { background: #f59e0b; }
    .legend-dot.red { background: #ef4444; }
    .legend-dot.blue { background: #3b82f6; }

    /* Séparateur de section */
    .section-divider { border: none; border-top: 1px dashed #dee2e6; margin: 15px 0; }

    /* Page break pour impression */
    .page-break { page-break-before: always; margin-top: 20px; }
  </style>
`;

// Générer HTML pour les sections de synthèse
const generateSummariesHTML = (summaries: ReportSummarySection[]): string => {
  if (!summaries || summaries.length === 0) return "";
  return `
    <div class="summary-grid">
      ${summaries.map(section => `
        <div class="summary-box">
          <div class="summary-box-title">${section.title}</div>
          ${section.items.map(item => `
            <div class="summary-item">
              <span class="summary-item-label">${item.label}</span>
              <span class="summary-item-value ${item.color || ""}">${item.value}</span>
            </div>
          `).join("")}
        </div>
      `).join("")}
    </div>
  `;
};

// Générer HTML pour les tableaux de ventilation
const generateBreakdownsHTML = (breakdowns: ReportBreakdownSection[], config: ExportHeaderConfig): string => {
  if (!breakdowns || breakdowns.length === 0) return "";
  return breakdowns.map(breakdown => `
    <div class="section-title">${breakdown.title}</div>
    <table class="breakdown-table">
      <thead>
        <tr>
          ${breakdown.columns.map(col => `<th style="${col.width ? `width:${col.width};` : ""} ${col.align === 'right' ? 'text-align:right;' : col.align === 'center' ? 'text-align:center;' : ''}">${col.header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${breakdown.data.map(row => `
          <tr>
            ${breakdown.columns.map(col => {
              let cellValue = row[col.key];
              let cellContent = "";
              if (col.key === "status" || col.key === "statut") cellContent = getStatusBadge(cellValue);
              else if (col.key === "performance" || col.key === "rate" || col.key === "execution" || col.key === "taux") cellContent = getProgressBar(typeof cellValue === "number" ? cellValue : 0, config.primaryColor);
              else cellContent = formatValue(cellValue, col.format);
              return `<td style="${col.align === 'right' || col.format === 'number' || col.format === 'budget' ? 'text-align:right;' : ''}">${cellContent}</td>`;
            }).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `).join("");
};

// Générer HTML pour les données de planification
const generatePlanningDataHTML = (planningData: ReportConfig["planningData"], config: ExportHeaderConfig): string => {
  if (!planningData) return "";
  let html = "";

  // Par statut
  if (planningData.byStatus) {
    const statusLabels: Record<string, string> = { planifie: "Planifié", en_cours: "En cours", termine: "Terminé", retard: "En retard", annule: "Annulé" };
    const statusColors: Record<string, string> = { planifie: "#94a3b8", en_cours: "#3b82f6", termine: "#22c55e", retard: "#ef4444", annule: "#6b7280" };
    const total = Object.values(planningData.byStatus).reduce((a, b) => a + b, 0);
    html += `
      <div class="section-title">Répartition par statut</div>
      <div class="planning-grid">
        ${Object.entries(planningData.byStatus).map(([status, count]) => `
          <div class="planning-card">
            <div class="planning-card-title">${statusLabels[status] || status}</div>
            <div class="planning-card-value" style="color: ${statusColors[status] || '#666'}">${count}</div>
            <div class="planning-card-sub">${total > 0 ? Math.round((count / total) * 100) : 0}%</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Par période
  if (planningData.byPeriod && planningData.byPeriod.length > 0) {
    html += `
      <div class="section-title">Planification vs Réalisation par période</div>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Période</th>
            <th style="text-align:right">Planifié</th>
            <th style="text-align:right">Réalisé</th>
            <th style="text-align:center">Taux</th>
          </tr>
        </thead>
        <tbody>
          ${planningData.byPeriod.map(p => `
            <tr>
              <td>${p.period}</td>
              <td style="text-align:right">${formatMontantReport(p.planned)}</td>
              <td style="text-align:right">${formatMontantReport(p.realized)}</td>
              <td style="text-align:center">${getProgressBar(p.rate, config.primaryColor)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // Par catégorie
  if (planningData.byCategory && planningData.byCategory.length > 0) {
    const hasbudget = planningData.byCategory.some(c => c.budget !== undefined);
    html += `
      <div class="section-title">Synthèse par catégorie</div>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Catégorie</th>
            <th style="text-align:center">Nombre</th>
            ${hasbudget ? `<th style="text-align:right">Budget</th><th style="text-align:right">Réalisé</th>` : ""}
            <th style="text-align:center">Taux</th>
          </tr>
        </thead>
        <tbody>
          ${planningData.byCategory.map(c => `
            <tr>
              <td>${c.name}</td>
              <td style="text-align:center">${c.count}</td>
              ${hasbudget ? `<td style="text-align:right">${c.budget ? formatMontantReport(c.budget) + " FCFA" : "-"}</td><td style="text-align:right">${c.realized ? formatMontantReport(c.realized) + " FCFA" : "-"}</td>` : ""}
              <td style="text-align:center">${c.rate !== undefined ? getProgressBar(c.rate, config.primaryColor) : "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  return html;
};

// Générer HTML pour les données d'exécution
const generateExecutionDataHTML = (executionData: ReportConfig["executionData"], config: ExportHeaderConfig): string => {
  if (!executionData) return "";
  
  const items = [];
  if (executionData.budgetTotal !== undefined) {
    items.push({ label: "Budget total", value: formatMontantReport(executionData.budgetTotal) + " FCFA" });
  }
  if (executionData.budgetSpent !== undefined) {
    items.push({ label: "Budget dépensé", value: formatMontantReport(executionData.budgetSpent) + " FCFA", color: "green" });
  }
  if (executionData.budgetAvailable !== undefined) {
    items.push({ label: "Budget disponible", value: formatMontantReport(executionData.budgetAvailable) + " FCFA", color: "amber" });
  }
  if (executionData.globalRate !== undefined) {
    items.push({ label: "Taux d'exécution global", value: `${executionData.globalRate}%`, color: executionData.globalRate >= 80 ? "green" : executionData.globalRate >= 50 ? "amber" : "red" });
  }
  if (executionData.activitiesTotal !== undefined) {
    items.push({ label: "Activités totales", value: executionData.activitiesTotal.toString() });
  }
  if (executionData.activitiesCompleted !== undefined) {
    items.push({ label: "Activités terminées", value: executionData.activitiesCompleted.toString(), color: "green" });
  }
  if (executionData.deliverablesTotal !== undefined) {
    items.push({ label: "Livrables totaux", value: executionData.deliverablesTotal.toString() });
  }
  if (executionData.deliverablesCompleted !== undefined) {
    items.push({ label: "Livrables atteints", value: executionData.deliverablesCompleted.toString(), color: "green" });
  }

  if (items.length === 0) return "";

  return `
    <div class="section-title">Synthèse d'exécution</div>
    <div class="summary-grid">
      <div class="summary-box">
        <div class="summary-box-title">Indicateurs d'exécution</div>
        ${items.map(item => `
          <div class="summary-item">
            <span class="summary-item-label">${item.label}</span>
            <span class="summary-item-value ${item.color || ""}">${item.value}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
};

// Générer le contenu HTML du rapport enrichi
export const generateReportHTML = (reportConfig: ReportConfig): string => {
  const { title, subtitle, period, filters, kpis, columns, data, totals, headerSettings, summaries, breakdowns, planningData, executionData } = reportConfig;

  const config = getExportHeaderConfig();
  if (headerSettings) {
    if (headerSettings.headerColor) config.primaryColor = headerSettings.headerColor;
    if (headerSettings.headerSecondaryColor) config.secondaryColor = headerSettings.headerSecondaryColor;
    if (headerSettings.logoUrl) config.logoUrl = headerSettings.logoUrl;
    if (headerSettings.bannerStyle) config.bannerStyle = headerSettings.bannerStyle;
    if (headerSettings.organizationName) config.organizationName = headerSettings.organizationName;
    if (headerSettings.organizationAcronym) config.organizationAcronym = headerSettings.organizationAcronym;
    if (headerSettings.organizationSlogan) config.organizationSlogan = headerSettings.organizationSlogan;
    if (headerSettings.footerLeftText) config.footerLeft = headerSettings.footerLeftText;
    if (headerSettings.footerRightText) config.footerRight = headerSettings.footerRightText;
  }

  const headerHtml = generateExportHeader(config, title, subtitle);
  const periodHtml = period ? `<div style="text-align: center; margin-bottom: 10px; font-size: 11px; color: ${config.primaryColor}; font-weight: 600;">${period}</div>` : "";
  const filtersHtml = filters && filters.length > 0 ? `<div class="report-filters">${filters.map(f => `<div class="filter-item"><span class="filter-label">${f.label}:</span><span class="filter-value">${f.value}</span></div>`).join("")}</div>` : "";
  const kpisHtml = kpis && kpis.length > 0 ? `<div class="report-kpis">${kpis.map(kpi => `<div class="kpi-card"><div class="kpi-value ${kpi.color || ""}">${kpi.value}</div><div class="kpi-label">${kpi.label}</div></div>`).join("")}</div>` : "";

  // Sections enrichies
  const summariesHtml = generateSummariesHTML(summaries || []);
  const executionHtml = generateExecutionDataHTML(executionData, config);
  const planningHtml = generatePlanningDataHTML(planningData, config);
  const breakdownsHtml = generateBreakdownsHTML(breakdowns || [], config);

  // Tableau principal
  const tableHtml = data.length > 0 ? `
    <div class="section-title">Données détaillées</div>
    <table>
      <thead>
        <tr>
          ${columns.map(col => `<th style="${col.width ? `width:${col.width};` : ""} ${col.align === 'right' ? 'text-align:right;' : col.align === 'center' ? 'text-align:center;' : ''}">${col.header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${columns.map(col => {
              let cellValue = row[col.key];
              let cellContent = "";
              if (col.key === "status" || col.key === "statut") cellContent = getStatusBadge(cellValue);
              else if (col.key === "performance" || col.key === "execution") cellContent = getProgressBar(typeof cellValue === "number" ? cellValue : 0, config.primaryColor);
              else if (col.key === "performanceBadge") cellContent = getPerformanceBadge(row.performance || 0);
              else cellContent = formatValue(cellValue, col.format);
              return `<td class="${col.align === 'right' || col.format === 'number' || col.format === 'budget' ? 'amount' : ''}">${cellContent}</td>`;
            }).join("")}
          </tr>
        `).join("")}
        ${totals ? `
          <tr class="total-row">
            ${columns.map((col, idx) => {
              if (idx === 0) return `<td><strong>TOTAL</strong></td>`;
              const totalValue = totals[col.key];
              if (totalValue !== undefined) return `<td class="${col.format === 'number' || col.format === 'budget' ? 'amount' : ''}">${formatValue(totalValue, col.format)}</td>`;
              return `<td></td>`;
            }).join("")}
          </tr>
        ` : ""}
      </tbody>
    </table>
  ` : "";

  // Légende
  const legendHtml = `
    <div class="legend">
      <div class="legend-item"><span class="legend-dot green"></span> Atteint (≥100%)</div>
      <div class="legend-item"><span class="legend-dot amber"></span> En cours (50-99%)</div>
      <div class="legend-item"><span class="legend-dot red"></span> En retard (<50%)</div>
    </div>
  `;

  const footerHtml = generateExportFooter(config);

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      ${getBaseExportStyles(config, "landscape")}
      ${getReportAdditionalStyles(config)}
    </head>
    <body>
      ${headerHtml}
      ${periodHtml}
      ${filtersHtml}
      ${kpisHtml}
      ${summariesHtml}
      ${executionHtml}
      ${planningHtml}
      ${breakdownsHtml}
      ${tableHtml}
      ${legendHtml}
      ${footerHtml}
    </body>
    </html>
  `;
};

// Exporter vers PDF (via impression)
export const exportReportToPDF = (config: ReportConfig): void => {
  const htmlContent = generateReportHTML(config);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  }
};

// Alias pour impression
export const printReport = exportReportToPDF;

// Exporter vers Excel/CSV avec sections enrichies
export const exportReportToExcel = (config: ReportConfig): void => {
  const { columns, data, totals, title, summaries, breakdowns, planningData, executionData } = config;
  const BOM = "\uFEFF";
  let csvContent = BOM;

  // Section d'exécution
  if (executionData) {
    csvContent += '"SYNTHÈSE D\'EXÉCUTION"\n';
    if (executionData.budgetTotal !== undefined) csvContent += `"Budget total";${formatMontantReport(executionData.budgetTotal)}\n`;
    if (executionData.budgetSpent !== undefined) csvContent += `"Budget dépensé";${formatMontantReport(executionData.budgetSpent)}\n`;
    if (executionData.budgetAvailable !== undefined) csvContent += `"Budget disponible";${formatMontantReport(executionData.budgetAvailable)}\n`;
    if (executionData.globalRate !== undefined) csvContent += `"Taux d'exécution";${executionData.globalRate}%\n`;
    if (executionData.activitiesTotal !== undefined) csvContent += `"Activités totales";${executionData.activitiesTotal}\n`;
    if (executionData.activitiesCompleted !== undefined) csvContent += `"Activités terminées";${executionData.activitiesCompleted}\n`;
    csvContent += "\n";
  }

  // Sections de synthèse
  if (summaries && summaries.length > 0) {
    summaries.forEach(section => {
      csvContent += `"${section.title}"\n`;
      section.items.forEach(item => { csvContent += `"${item.label}";"${item.value}"\n`; });
      csvContent += "\n";
    });
  }

  // Données de planification
  if (planningData?.byPeriod && planningData.byPeriod.length > 0) {
    csvContent += '"PLANIFICATION VS RÉALISATION"\n';
    csvContent += '"Période";"Planifié";"Réalisé";"Taux"\n';
    planningData.byPeriod.forEach(p => { csvContent += `"${p.period}";${formatMontantReport(p.planned)};${formatMontantReport(p.realized)};${p.rate}%\n`; });
    csvContent += "\n";
  }

  if (planningData?.byCategory && planningData.byCategory.length > 0) {
    csvContent += '"SYNTHÈSE PAR CATÉGORIE"\n';
    csvContent += '"Catégorie";"Nombre";"Budget";"Réalisé";"Taux"\n';
    planningData.byCategory.forEach(c => { csvContent += `"${c.name}";${c.count};${c.budget ? formatMontantReport(c.budget) : ""};${c.realized ? formatMontantReport(c.realized) : ""};${c.rate !== undefined ? c.rate + "%" : ""}\n`; });
    csvContent += "\n";
  }

  // Tableaux de ventilation
  if (breakdowns && breakdowns.length > 0) {
    breakdowns.forEach(breakdown => {
      csvContent += `"${breakdown.title}"\n`;
      csvContent += breakdown.columns.map(col => `"${col.header}"`).join(";") + "\n";
      breakdown.data.forEach(row => {
        csvContent += breakdown.columns.map(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return '""';
          if (typeof value === "number") return formatMontantReport(value);
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(";") + "\n";
      });
      csvContent += "\n";
    });
  }

  // Données principales
  csvContent += '"DONNÉES DÉTAILLÉES"\n';
  csvContent += columns.map(col => `"${col.header}"`).join(";") + "\n";
  data.forEach(row => {
    csvContent += columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '""';
      if (typeof value === "number") return col.format === "budget" ? formatMontantReport(value) : formatMontantReport(value);
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(";") + "\n";
  });

  if (totals) {
    csvContent += columns.map((col, idx) => {
      if (idx === 0) return '"TOTAL"';
      const value = totals[col.key];
      if (value !== undefined && typeof value === "number") return formatMontantReport(value);
      return '""';
    }).join(";") + "\n";
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = generateReportFileName(title.replace(/\s+/g, "_"), "csv");
  link.click();
  URL.revokeObjectURL(link.href);
};
