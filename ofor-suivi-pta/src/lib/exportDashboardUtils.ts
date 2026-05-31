import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getExportHeaderConfig,
  getBaseExportStyles,
  generateExportHeader,
  generateExportFooter,
  ExportHeaderConfig,
} from "./exportSettings";
import { formatMontantReport, ReportHeaderSettings } from "./exportReportUtils";

// === UTILITAIRES COMMUNS ===

const formatBudgetShort = (amount: number): string => {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)} Mds`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)} M`;
  return formatMontantReport(amount);
};

const generateFileName = (baseName: string, extension: string): string => {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: fr });
  return `${baseName}_${date}.${extension}`;
};

// Impression directe via iframe caché (sans popup)
const printDirectly = (htmlContent: string): void => {
  // Supprimer un iframe précédent s'il existe
  const existingFrame = document.getElementById("print-frame");
  if (existingFrame) {
    existingFrame.remove();
  }

  // Créer un iframe caché
  const iframe = document.createElement("iframe");
  iframe.id = "print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Attendre le chargement puis imprimer
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Nettoyer après impression
        setTimeout(() => {
          iframe.remove();
        }, 1000);
      }, 250);
    };
  }
};

const getPerformanceBadgeHTML = (value: number): string => {
  if (value >= 100) return `<span class="badge badge-green">${value}%</span>`;
  if (value >= 80) return `<span class="badge badge-amber">${value}%</span>`;
  return `<span class="badge badge-red">${value}%</span>`;
};

const getStatusBadgeHTML = (status: string): string => {
  const map: Record<string, { class: string; label: string }> = {
    en_cours: { class: "badge-blue", label: "En cours" },
    termine: { class: "badge-green", label: "Terminé" },
    retard: { class: "badge-red", label: "En retard" },
    planifie: { class: "badge-gray", label: "Planifié" },
  };
  const config = map[status] || { class: "badge-gray", label: status };
  return `<span class="badge ${config.class}">${config.label}</span>`;
};

const getProgressBarHTML = (value: number): string => {
  const colorClass = value >= 80 ? "green" : value >= 50 ? "amber" : "red";
  return `<span class="progress-bar"><span class="progress-fill ${colorClass}" style="width: ${Math.min(100, value)}%"></span></span>${value}%`;
};

// Générer une ligne de stats boxes avant un tableau
interface StatItem {
  icon?: string;
  color: "blue" | "green" | "amber" | "red" | "purple" | "gray";
  value: string | number;
  label: string;
}

const generateStatsRow = (stats: StatItem[]): string => {
  return `<div class="stats-row">${stats.map(s => `
    <div class="stat-box">
      <div class="stat-icon ${s.color}">${s.icon || (s.color === "green" ? "✓" : s.color === "red" ? "!" : s.color === "blue" ? "#" : "•")}</div>
      <div class="stat-content">
        <span class="stat-value">${s.value}</span>
        <span class="stat-label">${s.label}</span>
      </div>
    </div>
  `).join("")}</div>`;
};

const getDashboardExportStyles = (config: ExportHeaderConfig) => `
  <style>
    /* Filtres contextuels */
    .context-filters { display: flex; gap: 15px; margin-bottom: 12px; padding: 8px 12px; background: linear-gradient(90deg, #f8f9fa, #e9ecef); border-radius: 6px; flex-wrap: wrap; border: 1px solid #dee2e6; }
    .filter-item { font-size: 9px; }
    .filter-label { color: #666; margin-right: 4px; }
    .filter-value { color: #1a1a1a; font-weight: 600; }
    
    /* KPIs en grille */
    .kpi-grid { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
    .kpi-card { flex: 1; min-width: 80px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 1px solid #dee2e6; border-radius: 8px; padding: 8px 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .kpi-value { font-size: 16px; font-weight: bold; color: ${config.primaryColor}; }
    .kpi-value.green { color: #22c55e; }
    .kpi-value.amber { color: #f59e0b; }
    .kpi-value.red { color: #ef4444; }
    .kpi-value.blue { color: #3b82f6; }
    .kpi-value.purple { color: #8b5cf6; }
    .kpi-label { font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; font-weight: 600; }
    
    /* Badges */
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7px; font-weight: 600; text-transform: uppercase; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-gray { background: #f3f4f6; color: #4b5563; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; }
    
    /* Barre de progression */
    .progress-bar { width: 50px; height: 5px; background: #e9ecef; border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 4px; }
    .progress-fill { height: 100%; border-radius: 3px; }
    .progress-fill.green { background: #22c55e; }
    .progress-fill.amber { background: #f59e0b; }
    .progress-fill.red { background: #ef4444; }

    /* Sections */
    .section-title { font-size: 11px; font-weight: bold; color: ${config.primaryColor}; margin: 15px 0 8px 0; padding: 6px 10px; background: linear-gradient(90deg, ${config.primaryColor}15, transparent); border-left: 3px solid ${config.primaryColor}; }
    
    /* Tableau groupé */
    .grouped-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 8px; }
    .grouped-table th { background: ${config.primaryColor}; color: white; padding: 6px 8px; text-align: left; font-size: 7px; text-transform: uppercase; }
    .grouped-table th.amount { text-align: right; }
    .grouped-table td { padding: 4px 8px; border-bottom: 1px solid #e9ecef; }
    .grouped-table td.amount { text-align: right; font-family: 'Courier New', monospace; }
    .grouped-table tr:nth-child(even) { background: #fafafa; }
    .grouped-table tr.group-header { background: ${config.primaryColor}15; font-weight: 600; }
    .grouped-table tr.group-header td { border-top: 2px solid ${config.primaryColor}; color: ${config.primaryColor}; }
    .grouped-table tr.total-row { background: #e9ecef; font-weight: bold; }
    .grouped-table tr.total-row td { border-top: 2px solid ${config.primaryColor}; }
    
    /* Catégories collapsées (CDP) */
    .category-header { background: ${config.primaryColor}10; padding: 8px 12px; margin-top: 10px; border-radius: 4px 4px 0 0; border: 1px solid ${config.primaryColor}30; display: flex; justify-content: space-between; align-items: center; }
    .category-name { font-weight: 600; font-size: 10px; color: ${config.primaryColor}; }
    .category-stats { display: flex; gap: 10px; font-size: 8px; }
    .composante-header { background: #f8f9fa; padding: 4px 12px 4px 20px; border-left: 1px solid #e9ecef; border-right: 1px solid #e9ecef; font-size: 9px; display: flex; justify-content: space-between; }
    
    /* Synthèse box */
    .summary-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 10px; margin-bottom: 10px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 8px; padding: 3px 0; border-bottom: 1px dotted #dee2e6; }
    .summary-row:last-child { border-bottom: none; }

    /* Mini stats boxes avant tableaux */
    .stats-row { display: flex; gap: 8px; margin: 8px 0; flex-wrap: wrap; }
    .stat-box { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border: 1px solid #dee2e6; border-radius: 6px; padding: 6px 10px; font-size: 8px; }
    .stat-box .stat-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 9px; font-weight: bold; }
    .stat-box .stat-icon.blue { background: #dbeafe; color: #1e40af; }
    .stat-box .stat-icon.green { background: #dcfce7; color: #166534; }
    .stat-box .stat-icon.amber { background: #fef3c7; color: #92400e; }
    .stat-box .stat-icon.red { background: #fee2e2; color: #991b1b; }
    .stat-box .stat-icon.purple { background: #f3e8ff; color: #6b21a8; }
    .stat-box .stat-icon.gray { background: #f3f4f6; color: #4b5563; }
    .stat-box .stat-content { display: flex; flex-direction: column; }
    .stat-box .stat-value { font-weight: bold; font-size: 10px; color: #1a1a1a; }
    .stat-box .stat-label { font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: 0.3px; }

    /* Légende */
    .legend { display: flex; gap: 15px; margin: 10px 0; padding: 6px 10px; background: #f8f9fa; border-radius: 4px; font-size: 7px; }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-dot.green { background: #22c55e; }
    .legend-dot.amber { background: #f59e0b; }
    .legend-dot.red { background: #ef4444; }

    .page-break { page-break-before: always; margin-top: 15px; }
  </style>
`;

// === EXPORT PROJETS PERFORMANCE ===

export interface ProjectExportData {
  id: string;
  code: string;
  name: string;
  region: string;
  status: string;
  timeProgress: number;
  budgetExecutionRate: number;
  activityProgress: number;
  deliverableProgress: number;
  operationalRate: number;
  budget: number;
  spent: number;
  activities: {
    code: string;
    name: string;
    status: string;
    timeProgress: number;
    progress: number;
    budget: number;
    spent: number;
    budgetExecutionRate: number;
    deliverables: { name: string; target: number; current: number; performance: number }[];
  }[];
  indicators: {
    code: string;
    name: string;
    unit: string;
    baseline: number;
    target: number;
    current: number;
    performance: number;
  }[];
  deliverables: {
    name: string;
    activityName: string;
    unit: string;
    target: number;
    current: number;
    performance: number;
  }[];
}

export interface ProjectExportFilters {
  year?: number;
  region?: string;
  projectName?: string;
  serviceName?: string;
  period?: string; // T1-T4 ou "annuel"
}

export const exportProjectsPerformanceToPDF = (
  projects: ProjectExportData[],
  globalKPIs: {
    total: number;
    avgTimeProgress: number;
    avgBudgetRate: number;
    avgActivityProgress: number;
    avgDeliverableProgress: number;
    avgOperationalRate: number;
    onTrack: number;
    delayed: number;
  },
  filters: ProjectExportFilters,
  headerSettings?: ReportHeaderSettings
) => {
  const config = getExportHeaderConfig();
  if (headerSettings?.headerColor) config.primaryColor = headerSettings.headerColor;
  if (headerSettings?.logoUrl) config.logoUrl = headerSettings.logoUrl;
  if (headerSettings?.organizationName) config.organizationName = headerSettings.organizationName;
  if (headerSettings?.organizationAcronym) config.organizationAcronym = headerSettings.organizationAcronym;

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const totalActivities = projects.reduce((s, p) => s + p.activities.length, 0);
  const totalDeliverables = projects.reduce((s, p) => s + p.deliverables.length, 0);
  const totalIndicators = projects.reduce((s, p) => s + p.indicators.length, 0);

  // Filtres appliqués
  const filtersHTML = `
    <div class="context-filters">
      <div class="filter-item"><span class="filter-label">Année:</span><span class="filter-value">${filters.year || new Date().getFullYear()}</span></div>
      ${filters.period ? `<div class="filter-item"><span class="filter-label">Période:</span><span class="filter-value">${filters.period}</span></div>` : ""}
      ${filters.serviceName ? `<div class="filter-item"><span class="filter-label">Service:</span><span class="filter-value">${filters.serviceName}</span></div>` : ""}
      ${filters.region ? `<div class="filter-item"><span class="filter-label">Région:</span><span class="filter-value">${filters.region}</span></div>` : ""}
      ${filters.projectName ? `<div class="filter-item"><span class="filter-label">Projet:</span><span class="filter-value">${filters.projectName}</span></div>` : ""}
      <div class="filter-item"><span class="filter-label">Généré le:</span><span class="filter-value">${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}</span></div>
    </div>
  `;

  // KPIs
  const kpisHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">${globalKPIs.total}</div><div class="kpi-label">Projets</div></div>
      <div class="kpi-card"><div class="kpi-value amber">${globalKPIs.avgTimeProgress}%</div><div class="kpi-label">Délai consommé</div></div>
      <div class="kpi-card"><div class="kpi-value blue">${globalKPIs.avgBudgetRate}%</div><div class="kpi-label">Exéc. Budget</div></div>
      <div class="kpi-card"><div class="kpi-value green">${globalKPIs.avgActivityProgress}%</div><div class="kpi-label">Avanc. Activités</div></div>
      <div class="kpi-card"><div class="kpi-value purple">${globalKPIs.avgDeliverableProgress}%</div><div class="kpi-label">Avanc. Livrables</div></div>
      <div class="kpi-card"><div class="kpi-value green">${globalKPIs.avgOperationalRate}%</div><div class="kpi-label">Taux Opérationnel</div></div>
      <div class="kpi-card"><div class="kpi-value green">${globalKPIs.onTrack}</div><div class="kpi-label">Dans les délais</div></div>
      <div class="kpi-card"><div class="kpi-value red">${globalKPIs.delayed}</div><div class="kpi-label">En retard</div></div>
    </div>
  `;

  // Synthèse exécution
  const summaryHTML = `
    <div class="summary-box">
      <div class="summary-row"><span>Budget total</span><span>${formatMontantReport(totalBudget)} FCFA</span></div>
      <div class="summary-row"><span>Budget dépensé</span><span style="color:#22c55e">${formatMontantReport(totalSpent)} FCFA</span></div>
      <div class="summary-row"><span>Activités totales</span><span>${totalActivities}</span></div>
      <div class="summary-row"><span>Livrables totaux</span><span>${totalDeliverables}</span></div>
      <div class="summary-row"><span>Indicateurs totaux</span><span>${totalIndicators}</span></div>
    </div>
  `;

  // Stats avant tableau synthèse projets
  const projectsStatsHTML = generateStatsRow([
    { color: "blue", value: projects.length, label: "Projets" },
    { color: "green", value: `${formatBudgetShort(totalBudget)}`, label: "Budget total" },
    { color: "green", value: `${formatBudgetShort(totalSpent)}`, label: "Dépensé" },
    { color: "amber", value: `${globalKPIs.avgTimeProgress}%`, label: "Délai moy." },
    { color: "purple", value: `${globalKPIs.avgOperationalRate}%`, label: "Taux opérationnel" },
  ]);

  // Tableau synthèse projets
  const projectsTableHTML = `
    <div class="section-title">Synthèse par projet</div>
    ${projectsStatsHTML}
    <table class="grouped-table">
      <thead><tr>
        <th style="width:60px">Code</th>
        <th style="width:200px">Projet</th>
        <th style="width:70px">Région</th>
        <th style="width:60px" class="amount">Délai</th>
        <th style="width:70px" class="amount">Activités</th>
        <th style="width:70px" class="amount">Livrables</th>
        <th style="width:70px" class="amount">Budget</th>
        <th style="width:80px" class="amount">Opérationnel</th>
      </tr></thead>
      <tbody>
        ${projects.map(p => `
          <tr>
            <td>${p.code}</td>
            <td>${p.name.length > 40 ? p.name.substring(0, 40) + "..." : p.name}</td>
            <td>${p.region}</td>
            <td class="amount">${getPerformanceBadgeHTML(p.timeProgress)}</td>
            <td class="amount">${getPerformanceBadgeHTML(p.activityProgress)}</td>
            <td class="amount">${getPerformanceBadgeHTML(p.deliverableProgress)}</td>
            <td class="amount">${getPerformanceBadgeHTML(p.budgetExecutionRate)}</td>
            <td class="amount">${getPerformanceBadgeHTML(p.operationalRate)}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td colspan="3"><strong>${projects.length} projet(s)</strong></td>
          <td class="amount">${globalKPIs.avgTimeProgress}%</td>
          <td class="amount">${globalKPIs.avgActivityProgress}%</td>
          <td class="amount">${globalKPIs.avgDeliverableProgress}%</td>
          <td class="amount">${globalKPIs.avgBudgetRate}%</td>
          <td class="amount">${globalKPIs.avgOperationalRate}%</td>
        </tr>
      </tbody>
    </table>
  `;

  // Calculer les stats pour les activités
  const actCompletedCount = projects.reduce((s, p) => s + p.activities.filter(a => a.status === "termine").length, 0);
  const actInProgressCount = projects.reduce((s, p) => s + p.activities.filter(a => a.status === "en_cours").length, 0);
  const actTotalBudget = projects.reduce((s, p) => s + p.activities.reduce((sa, a) => sa + a.budget, 0), 0);
  const actTotalSpent = projects.reduce((s, p) => s + p.activities.reduce((sa, a) => sa + a.spent, 0), 0);
  const actAvgProgress = totalActivities > 0 ? Math.round(projects.reduce((s, p) => s + p.activities.reduce((sa, a) => sa + a.progress, 0), 0) / totalActivities) : 0;

  // Stats avant détail activités
  const activitiesStatsHTML = generateStatsRow([
    { color: "blue", value: totalActivities, label: "Total activités" },
    { color: "green", value: actCompletedCount, label: "Terminées" },
    { color: "amber", value: actInProgressCount, label: "En cours" },
    { color: "purple", value: `${actAvgProgress}%`, label: "Avancement moy." },
    { color: "blue", value: formatBudgetShort(actTotalBudget), label: "Budget total" },
    { color: "green", value: formatBudgetShort(actTotalSpent), label: "Dépensé" },
  ]);

  // Détail par projet avec activités
  let detailHTML = `<div class="page-break"></div><div class="section-title">Détail des activités par projet</div>${activitiesStatsHTML}`;
  projects.forEach(p => {
    detailHTML += `
      <table class="grouped-table">
        <thead><tr class="group-header">
          <td colspan="4"><strong>${p.code}</strong> - ${p.name.length > 50 ? p.name.substring(0, 50) + "..." : p.name}</td>
          <td class="amount">Budget: ${formatBudgetShort(p.budget)}</td>
          <td class="amount">Exéc: ${p.budgetExecutionRate}%</td>
        </tr></thead>
        <thead><tr>
          <th style="width:70px">Code</th>
          <th style="width:200px">Activité</th>
          <th style="width:60px">Statut</th>
          <th style="width:60px" class="amount">Avancement</th>
          <th style="width:90px" class="amount">Budget</th>
          <th style="width:60px" class="amount">Exéc.</th>
        </tr></thead>
        <tbody>
          ${p.activities.map(a => `
            <tr>
              <td>${a.code}</td>
              <td>${a.name.length > 40 ? a.name.substring(0, 40) + "..." : a.name}</td>
              <td>${getStatusBadgeHTML(a.status)}</td>
              <td class="amount">${getProgressBarHTML(a.progress)}</td>
              <td class="amount">${formatMontantReport(a.budget)}</td>
              <td class="amount">${getPerformanceBadgeHTML(a.budgetExecutionRate)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  });

  // Calculer stats livrables
  const delCompletedCount = projects.reduce((s, p) => s + p.deliverables.filter(d => d.performance >= 100).length, 0);
  const delInProgressCount = projects.reduce((s, p) => s + p.deliverables.filter(d => d.performance >= 80 && d.performance < 100).length, 0);
  const delDelayedCount = projects.reduce((s, p) => s + p.deliverables.filter(d => d.performance < 80).length, 0);
  const delAvgPerf = totalDeliverables > 0 ? Math.round(projects.reduce((s, p) => s + p.deliverables.reduce((sd, d) => sd + d.performance, 0), 0) / totalDeliverables) : 0;

  // Stats avant livrables
  const deliverablesStatsHTML = generateStatsRow([
    { color: "blue", value: totalDeliverables, label: "Total livrables" },
    { color: "green", value: delCompletedCount, label: "Atteints (≥100%)" },
    { color: "amber", value: delInProgressCount, label: "En cours (80-99%)" },
    { color: "red", value: delDelayedCount, label: "En retard (<80%)" },
    { color: "purple", value: `${delAvgPerf}%`, label: "Performance moy." },
  ]);

  // Détail livrables par projet
  detailHTML += `<div class="page-break"></div><div class="section-title">Livrables par projet</div>${deliverablesStatsHTML}`;
  projects.forEach(p => {
    if (p.deliverables.length === 0) return;
    detailHTML += `
      <table class="grouped-table">
        <thead><tr class="group-header">
          <td colspan="5"><strong>${p.code}</strong> - ${p.name.length > 50 ? p.name.substring(0, 50) + "..." : p.name} (${p.deliverables.length} livrables)</td>
        </tr></thead>
        <thead><tr>
          <th style="width:180px">Livrable</th>
          <th style="width:150px">Activité</th>
          <th style="width:60px">Unité</th>
          <th style="width:70px" class="amount">Cible</th>
          <th style="width:70px" class="amount">Réalisé</th>
          <th style="width:70px" class="amount">Performance</th>
        </tr></thead>
        <tbody>
          ${p.deliverables.map(d => `
            <tr>
              <td>${d.name.length > 35 ? d.name.substring(0, 35) + "..." : d.name}</td>
              <td>${d.activityName.length > 30 ? d.activityName.substring(0, 30) + "..." : d.activityName}</td>
              <td>${d.unit}</td>
              <td class="amount">${formatMontantReport(d.target)}</td>
              <td class="amount">${formatMontantReport(d.current)}</td>
              <td class="amount">${getPerformanceBadgeHTML(d.performance)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  });

  // Calculer stats indicateurs
  const indAtteints = projects.reduce((s, p) => s + p.indicators.filter(i => i.performance >= 100).length, 0);
  const indEnProgres = projects.reduce((s, p) => s + p.indicators.filter(i => i.performance >= 80 && i.performance < 100).length, 0);
  const indEnRetard = projects.reduce((s, p) => s + p.indicators.filter(i => i.performance < 80).length, 0);
  const indAvgPerf = totalIndicators > 0 ? Math.round(projects.reduce((s, p) => s + p.indicators.reduce((si, i) => si + i.performance, 0), 0) / totalIndicators) : 0;

  // Stats avant indicateurs
  const indicatorsStatsHTML = generateStatsRow([
    { color: "blue", value: totalIndicators, label: "Total indicateurs" },
    { color: "green", value: indAtteints, label: "Atteints (≥100%)" },
    { color: "amber", value: indEnProgres, label: "En progression" },
    { color: "red", value: indEnRetard, label: "En retard (<80%)" },
    { color: "purple", value: `${indAvgPerf}%`, label: "Performance moy." },
  ]);

  // Détail indicateurs par projet
  detailHTML += `<div class="page-break"></div><div class="section-title">Indicateurs de performance par projet</div>${indicatorsStatsHTML}`;
  projects.forEach(p => {
    if (p.indicators.length === 0) return;
    detailHTML += `
      <table class="grouped-table">
        <thead><tr class="group-header">
          <td colspan="7"><strong>${p.code}</strong> - ${p.name.length > 50 ? p.name.substring(0, 50) + "..." : p.name} (${p.indicators.length} indicateurs)</td>
        </tr></thead>
        <thead><tr>
          <th style="width:60px">Code</th>
          <th style="width:180px">Indicateur</th>
          <th style="width:60px">Unité</th>
          <th style="width:60px" class="amount">Réf.</th>
          <th style="width:60px" class="amount">Cible</th>
          <th style="width:60px" class="amount">Réalisé</th>
          <th style="width:70px" class="amount">Perf.</th>
        </tr></thead>
        <tbody>
          ${p.indicators.map(i => `
            <tr>
              <td>${i.code}</td>
              <td>${i.name.length > 35 ? i.name.substring(0, 35) + "..." : i.name}</td>
              <td>${i.unit}</td>
              <td class="amount">${formatMontantReport(i.baseline)}</td>
              <td class="amount">${formatMontantReport(i.target)}</td>
              <td class="amount">${formatMontantReport(i.current)}</td>
              <td class="amount">${getPerformanceBadgeHTML(i.performance)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  });

  const legendHTML = `
    <div class="legend">
      <div class="legend-item"><span class="legend-dot green"></span> ≥80% - Performant</div>
      <div class="legend-item"><span class="legend-dot amber"></span> 50-79% - En cours</div>
      <div class="legend-item"><span class="legend-dot red"></span> <50% - En retard</div>
    </div>
  `;

  const headerHtml = generateExportHeader(config, "Avancement des Projets", "Tableau de bord - Performance globale et détaillée");
  const footerHtml = generateExportFooter(config);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Avancement Projets</title>
    ${getBaseExportStyles(config, "landscape")}
    ${getDashboardExportStyles(config)}
  </head><body>
    ${headerHtml}
    ${filtersHTML}
    ${kpisHTML}
    ${summaryHTML}
    ${projectsTableHTML}
    ${detailHTML}
    ${legendHTML}
    ${footerHtml}
  </body></html>`;

  // Impression directe sans popup
  printDirectly(html);
};

export const exportProjectsPerformanceToCSV = (
  projects: ProjectExportData[],
  globalKPIs: any,
  filters: ProjectExportFilters
) => {
  const BOM = "\uFEFF";
  let content = BOM;

  // En-tête
  content += `"RAPPORT AVANCEMENT PROJETS"\n`;
  content += `"Généré le: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}"\n`;
  if (filters.year) content += `"Année: ${filters.year}"\n`;
  if (filters.period) content += `"Période: ${filters.period}"\n`;
  if (filters.serviceName) content += `"Service: ${filters.serviceName}"\n`;
  if (filters.region) content += `"Région: ${filters.region}"\n`;
  if (filters.projectName) content += `"Projet: ${filters.projectName}"\n`;
  content += "\n";

  // KPIs
  content += `"=== INDICATEURS GLOBAUX ==="\n`;
  content += `"Projets";${globalKPIs.total}\n`;
  content += `"Délai consommé moyen";${globalKPIs.avgTimeProgress}%\n`;
  content += `"Exécution budgétaire moyenne";${globalKPIs.avgBudgetRate}%\n`;
  content += `"Avancement activités moyen";${globalKPIs.avgActivityProgress}%\n`;
  content += `"Avancement livrables moyen";${globalKPIs.avgDeliverableProgress}%\n`;
  content += `"Taux opérationnel moyen";${globalKPIs.avgOperationalRate}%\n`;
  content += "\n";

  // Synthèse projets
  content += `"=== SYNTHÈSE PAR PROJET ==="\n`;
  content += `"Code";"Projet";"Région";"Statut";"Délai %";"Activités %";"Livrables %";"Budget %";"Opérationnel %";"Budget (FCFA)";"Dépensé (FCFA)"\n`;
  projects.forEach(p => {
    content += `"${p.code}";"${p.name}";"${p.region}";"${p.status}";${p.timeProgress};${p.activityProgress};${p.deliverableProgress};${p.budgetExecutionRate};${p.operationalRate};${formatMontantReport(p.budget)};${formatMontantReport(p.spent)}\n`;
  });
  content += "\n";

  // Détail activités
  content += `"=== DÉTAIL ACTIVITÉS ==="\n`;
  content += `"Projet";"Code";"Activité";"Statut";"Avancement %";"Budget (FCFA)";"Dépensé (FCFA)";"Exécution %";"Nb Livrables"\n`;
  projects.forEach(p => {
    p.activities.forEach(a => {
      content += `"${p.name}";"${a.code}";"${a.name}";"${a.status}";${a.progress};${formatMontantReport(a.budget)};${formatMontantReport(a.spent)};${a.budgetExecutionRate};${a.deliverables.length}\n`;
    });
  });
  content += "\n";

  // Détail livrables
  content += `"=== DÉTAIL LIVRABLES ==="\n`;
  content += `"Projet";"Livrable";"Activité";"Unité";"Cible";"Réalisé";"Performance %"\n`;
  projects.forEach(p => {
    p.deliverables.forEach(d => {
      content += `"${p.name}";"${d.name}";"${d.activityName}";"${d.unit}";${formatMontantReport(d.target)};${formatMontantReport(d.current)};${d.performance}\n`;
    });
  });
  content += "\n";

  // Détail indicateurs
  content += `"=== INDICATEURS ==="\n`;
  content += `"Projet";"Code";"Indicateur";"Unité";"Référence";"Cible";"Réalisé";"Performance %"\n`;
  projects.forEach(p => {
    p.indicators.forEach(i => {
      content += `"${p.name}";"${i.code}";"${i.name}";"${i.unit}";${formatMontantReport(i.baseline)};${formatMontantReport(i.target)};${formatMontantReport(i.current)};${i.performance}\n`;
    });
  });

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = generateFileName("Avancement_Projets", "csv");
  link.click();
  URL.revokeObjectURL(link.href);
};

// === EXPORT PTA ===

export interface PTAExportData {
  ptaName: string;
  ptaCode: string;
  year: number;
  selectedPeriod: string;
  periodLabel: string;
  totalPlan: number;
  totalReal: number;
  executionRate: number;
  byNature: { name: string; plan: number; real: number; rate: number }[];
  byProject: {
    name: string;
    plan: number;
    real: number;
    type?: "projet" | "operation";
    serviceName?: string;
    activities: {
      name: string;
      nature: string;
      planValue: number;
      realValue: number;
      deliverables: { unit: string; target: number; realized: number }[];
    }[];
  }[];
  // Hiérarchie optionnelle Service > (Projet | Opération)
  byService?: {
    serviceName: string;
    plan: number;
    real: number;
    rate: number;
    buckets: {
      type: "projet" | "operation";
      name: string;
      plan: number;
      real: number;
      activitiesCount: number;
    }[];
  }[];
  deliverables: {
    project: string;
    activityName: string;
    unit: string;
    target: number;
    realized: number;
  }[];
  delStats: { completed: number; inProgress: number; delayed: number; total: number };
}

export interface PTAExportFilters {
  ptaId: string;
  period: string;
  projectId: string;
  projectName?: string;
  serviceName?: string;
  operationName?: string;
}

export const exportPTADashboardToPDF = (
  data: PTAExportData,
  filters: PTAExportFilters,
  headerSettings?: ReportHeaderSettings
) => {
  const config = getExportHeaderConfig();
  if (headerSettings?.headerColor) config.primaryColor = headerSettings.headerColor;
  if (headerSettings?.logoUrl) config.logoUrl = headerSettings.logoUrl;
  if (headerSettings?.organizationName) config.organizationName = headerSettings.organizationName;

  const filtersHTML = `
    <div class="context-filters">
      <div class="filter-item"><span class="filter-label">PTA:</span><span class="filter-value">${data.ptaCode} - ${data.ptaName}</span></div>
      <div class="filter-item"><span class="filter-label">Période:</span><span class="filter-value">${data.periodLabel}</span></div>
      ${filters.serviceName ? `<div class="filter-item"><span class="filter-label">Service:</span><span class="filter-value">${filters.serviceName}</span></div>` : ""}
      ${filters.projectName ? `<div class="filter-item"><span class="filter-label">Projet:</span><span class="filter-value">${filters.projectName}</span></div>` : ""}
      ${filters.operationName ? `<div class="filter-item"><span class="filter-label">Opération:</span><span class="filter-value">${filters.operationName}</span></div>` : ""}
      <div class="filter-item"><span class="filter-label">Généré le:</span><span class="filter-value">${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}</span></div>
    </div>
  `;

  const kpisHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">${data.periodLabel}</div><div class="kpi-label">Période</div></div>
      <div class="kpi-card"><div class="kpi-value blue">${formatBudgetShort(data.totalPlan)}</div><div class="kpi-label">Budget prévu</div></div>
      <div class="kpi-card"><div class="kpi-value green">${formatBudgetShort(data.totalReal)}</div><div class="kpi-label">Budget réalisé</div></div>
      <div class="kpi-card"><div class="kpi-value ${data.executionRate >= 80 ? "green" : data.executionRate >= 60 ? "amber" : "red"}">${data.executionRate}%</div><div class="kpi-label">Taux exécution</div></div>
      <div class="kpi-card"><div class="kpi-value">${data.byProject.reduce((s, p) => s + p.activities.length, 0)}</div><div class="kpi-label">Activités</div></div>
      <div class="kpi-card"><div class="kpi-value">${data.delStats.total}</div><div class="kpi-label">Livrables</div></div>
      <div class="kpi-card"><div class="kpi-value green">${data.delStats.completed}</div><div class="kpi-label">Atteints</div></div>
      <div class="kpi-card"><div class="kpi-value red">${data.delStats.delayed}</div><div class="kpi-label">En retard</div></div>
    </div>
  `;

  // Stats avant budget par nature
  const natureStatsHTML = generateStatsRow([
    { color: "blue", value: data.byNature.length, label: "Natures" },
    { color: "blue", value: formatBudgetShort(data.totalPlan), label: "Budget prévu" },
    { color: "green", value: formatBudgetShort(data.totalReal), label: "Budget réalisé" },
    { color: data.executionRate >= 80 ? "green" : data.executionRate >= 60 ? "amber" : "red", value: `${data.executionRate}%`, label: "Taux exécution" },
  ]);

  // Budget par nature
  const natureTableHTML = `
    <div class="section-title">Exécution budgétaire par nature - ${data.periodLabel}</div>
    ${natureStatsHTML}
    <table class="grouped-table">
      <thead><tr>
        <th style="width:200px">Nature</th>
        <th style="width:100px" class="amount">Budget prévu</th>
        <th style="width:100px" class="amount">Budget réalisé</th>
        <th style="width:80px" class="amount">Taux</th>
      </tr></thead>
      <tbody>
        ${data.byNature.map(n => `
          <tr>
            <td>${n.name}</td>
            <td class="amount">${formatMontantReport(n.plan)}</td>
            <td class="amount">${formatMontantReport(n.real)}</td>
            <td class="amount">${getPerformanceBadgeHTML(n.rate)}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td><strong>TOTAL</strong></td>
          <td class="amount">${formatMontantReport(data.totalPlan)}</td>
          <td class="amount">${formatMontantReport(data.totalReal)}</td>
          <td class="amount">${data.executionRate}%</td>
        </tr>
      </tbody>
    </table>
  `;

  // Calculer stats activités PTA
  const ptaTotalActivities = data.byProject.reduce((s, p) => s + p.activities.length, 0);
  const ptaTotalBudgetPlan = data.byProject.reduce((s, p) => s + p.plan, 0);
  const ptaTotalBudgetReal = data.byProject.reduce((s, p) => s + p.real, 0);
  const ptaAvgExec = ptaTotalBudgetPlan > 0 ? Math.round((ptaTotalBudgetReal / ptaTotalBudgetPlan) * 100) : 0;
  const ptaTotalDeliverables = data.byProject.reduce((s, p) => s + p.activities.reduce((sa, a) => sa + a.deliverables.length, 0), 0);

  // Stats avant activités
  const activitiesStatsHTML = generateStatsRow([
    { color: "blue", value: ptaTotalActivities, label: "Activités" },
    { color: "gray", value: data.byProject.length, label: "Projets" },
    { color: "blue", value: formatBudgetShort(ptaTotalBudgetPlan), label: "Budget prévu" },
    { color: "green", value: formatBudgetShort(ptaTotalBudgetReal), label: "Budget réalisé" },
    { color: ptaAvgExec >= 80 ? "green" : "amber", value: `${ptaAvgExec}%`, label: "Taux moy." },
    { color: "purple", value: ptaTotalDeliverables, label: "Livrables" },
  ]);

  // Synthèse hiérarchique Service > Projet/Opération (si fournie)
  let serviceHierarchyHTML = "";
  if (data.byService && data.byService.length > 0) {
    serviceHierarchyHTML = `
      <div class="section-title">Synthèse par service responsable - ${data.periodLabel}</div>
      <table class="grouped-table">
        <thead><tr>
          <th style="width:35%">Service / Rattachement</th>
          <th style="width:10%">Type</th>
          <th style="width:10%" class="amount">Activités</th>
          <th style="width:15%" class="amount">Prévu</th>
          <th style="width:15%" class="amount">Réalisé</th>
          <th style="width:15%" class="amount">Taux</th>
        </tr></thead>
        <tbody>
          ${data.byService.map(s => `
            <tr class="group-header">
              <td colspan="2"><strong>${s.serviceName}</strong></td>
              <td class="amount">${s.buckets.reduce((n, b) => n + b.activitiesCount, 0)}</td>
              <td class="amount">${formatMontantReport(s.plan)}</td>
              <td class="amount">${formatMontantReport(s.real)}</td>
              <td class="amount">${getPerformanceBadgeHTML(s.rate)}</td>
            </tr>
            ${s.buckets.map(b => {
              const rate = b.plan > 0 ? Math.round((b.real / b.plan) * 100) : 0;
              return `
                <tr>
                  <td style="padding-left:18px">${b.name.length > 50 ? b.name.substring(0, 50) + "..." : b.name}</td>
                  <td><span class="badge ${b.type === "operation" ? "badge-purple" : "badge-blue"}">${b.type === "operation" ? "Opération" : "Projet"}</span></td>
                  <td class="amount">${b.activitiesCount}</td>
                  <td class="amount">${formatMontantReport(b.plan)}</td>
                  <td class="amount">${formatMontantReport(b.real)}</td>
                  <td class="amount">${getPerformanceBadgeHTML(rate)}</td>
                </tr>
              `;
            }).join("")}
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // Activités par projet/opération
  let activitiesHTML = `<div class="section-title">Exécution des activités par rattachement - ${data.periodLabel}</div>${activitiesStatsHTML}`;
  data.byProject.forEach(proj => {
    const projRate = proj.plan > 0 ? Math.round((proj.real / proj.plan) * 100) : 0;
    const typeLabel = proj.type === "operation" ? "Opération" : "Projet";
    const typeBadge = proj.type === "operation" ? "badge-purple" : "badge-blue";
    activitiesHTML += `
      <table class="grouped-table">
        <thead><tr class="group-header">
          <td colspan="3"><span class="badge ${typeBadge}">${typeLabel}</span> ${proj.name.length > 50 ? proj.name.substring(0, 50) + "..." : proj.name}${proj.serviceName ? ` <span style="color:#666;font-size:7px"> · ${proj.serviceName}</span>` : ""}</td>
          <td class="amount">Prévu: ${formatBudgetShort(proj.plan)}</td>
          <td class="amount">Réalisé: ${formatBudgetShort(proj.real)}</td>
          <td class="amount">Taux: ${projRate}%</td>
        </tr></thead>
        <thead><tr>
          <th style="width:200px">Activité</th>
          <th style="width:80px">Nature</th>
          <th style="width:100px" class="amount">Prévu</th>
          <th style="width:100px" class="amount">Réalisé</th>
          <th style="width:70px" class="amount">Taux</th>
          <th style="width:60px" class="amount">Livrables</th>
        </tr></thead>
        <tbody>
          ${proj.activities.map(a => {
            const aRate = a.planValue > 0 ? Math.round((a.realValue / a.planValue) * 100) : 0;
            return `
              <tr>
                <td>${a.name.length > 40 ? a.name.substring(0, 40) + "..." : a.name}</td>
                <td><span class="badge badge-gray">${a.nature}</span></td>
                <td class="amount">${formatMontantReport(a.planValue)}</td>
                <td class="amount">${formatMontantReport(a.realValue)}</td>
                <td class="amount">${getPerformanceBadgeHTML(aRate)}</td>
                <td class="amount">${a.deliverables.length}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  });

  // Stats avant livrables PTA
  const ptaDelStatsHTML = generateStatsRow([
    { color: "blue", value: data.delStats.total, label: "Total livrables" },
    { color: "green", value: data.delStats.completed, label: "Atteints" },
    { color: "amber", value: data.delStats.inProgress, label: "En cours" },
    { color: "red", value: data.delStats.delayed, label: "En retard" },
  ]);

  // Livrables
  let deliverablesHTML = `<div class="page-break"></div><div class="section-title">Exécution des livrables - ${data.periodLabel}</div>${ptaDelStatsHTML}`;
  const delByProject: Record<string, typeof data.deliverables> = {};
  data.deliverables.forEach(d => {
    if (!delByProject[d.project]) delByProject[d.project] = [];
    delByProject[d.project].push(d);
  });
  Object.entries(delByProject).forEach(([projName, dels]) => {
    deliverablesHTML += `
      <table class="grouped-table">
        <thead><tr class="group-header">
          <td colspan="5">${projName.length > 50 ? projName.substring(0, 50) + "..." : projName} (${dels.length} livrables)</td>
        </tr></thead>
        <thead><tr>
          <th style="width:150px">Activité</th>
          <th style="width:80px">Unité</th>
          <th style="width:80px" class="amount">Cible</th>
          <th style="width:80px" class="amount">Réalisé</th>
          <th style="width:80px" class="amount">Performance</th>
        </tr></thead>
        <tbody>
          ${dels.map(d => {
            const perf = d.target > 0 ? Math.round((d.realized / d.target) * 100) : 0;
            return `
              <tr>
                <td>${d.activityName.length > 30 ? d.activityName.substring(0, 30) + "..." : d.activityName}</td>
                <td>${d.unit}</td>
                <td class="amount">${formatMontantReport(d.target)}</td>
                <td class="amount">${formatMontantReport(d.realized)}</td>
                <td class="amount">${getPerformanceBadgeHTML(perf)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  });

  const legendHTML = `
    <div class="legend">
      <div class="legend-item"><span class="legend-dot green"></span> ≥80% - Performant</div>
      <div class="legend-item"><span class="legend-dot amber"></span> 50-79% - En cours</div>
      <div class="legend-item"><span class="legend-dot red"></span> <50% - En retard</div>
    </div>
  `;

  const headerHtml = generateExportHeader(config, `Suivi PTA ${data.year}`, `${data.ptaName} - ${data.periodLabel}`);
  const footerHtml = generateExportFooter(config);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Suivi PTA</title>
    ${getBaseExportStyles(config, "landscape")}
    ${getDashboardExportStyles(config)}
  </head><body>
    ${headerHtml}
    ${filtersHTML}
    ${kpisHTML}
    ${natureTableHTML}
    ${serviceHierarchyHTML}
    ${activitiesHTML}
    ${deliverablesHTML}
    ${legendHTML}
    ${footerHtml}
  </body></html>`;

  // Impression directe sans popup
  printDirectly(html);
};

export const exportPTADashboardToCSV = (
  data: PTAExportData,
  filters: PTAExportFilters
) => {
  const BOM = "\uFEFF";
  let content = BOM;

  content += `"RAPPORT SUIVI PTA"\n`;
  content += `"PTA: ${data.ptaCode} - ${data.ptaName}"\n`;
  content += `"Période: ${data.periodLabel}"\n`;
  if (filters.serviceName) content += `"Service: ${filters.serviceName}"\n`;
  if (filters.projectName) content += `"Projet: ${filters.projectName}"\n`;
  if (filters.operationName) content += `"Opération: ${filters.operationName}"\n`;
  content += `"Généré le: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}"\n\n`;

  content += `"=== INDICATEURS GLOBAUX ==="\n`;
  content += `"Budget prévu";${formatMontantReport(data.totalPlan)}\n`;
  content += `"Budget réalisé";${formatMontantReport(data.totalReal)}\n`;
  content += `"Taux exécution";${data.executionRate}%\n`;
  content += `"Livrables atteints";${data.delStats.completed}\n`;
  content += `"Livrables en retard";${data.delStats.delayed}\n\n`;

  content += `"=== BUDGET PAR NATURE ==="\n`;
  content += `"Nature";"Prévu (FCFA)";"Réalisé (FCFA)";"Taux"\n`;
  data.byNature.forEach(n => {
    content += `"${n.name}";${formatMontantReport(n.plan)};${formatMontantReport(n.real)};${n.rate}%\n`;
  });
  content += "\n";

  if (data.byService && data.byService.length > 0) {
    content += `"=== SYNTHÈSE PAR SERVICE ==="\n`;
    content += `"Service";"Type";"Rattachement";"Activités";"Prévu (FCFA)";"Réalisé (FCFA)";"Taux"\n`;
    data.byService.forEach(s => {
      s.buckets.forEach(b => {
        const rate = b.plan > 0 ? Math.round((b.real / b.plan) * 100) : 0;
        content += `"${s.serviceName}";"${b.type === "operation" ? "Opération" : "Projet"}";"${b.name}";${b.activitiesCount};${formatMontantReport(b.plan)};${formatMontantReport(b.real)};${rate}%\n`;
      });
    });
    content += "\n";
  }

  content += `"=== ACTIVITÉS PAR RATTACHEMENT ==="\n`;
  content += `"Type";"Service";"Rattachement";"Activité";"Nature";"Budget prévu";"Budget réalisé";"Taux";"Nb Livrables"\n`;
  data.byProject.forEach(proj => {
    const typeLabel = proj.type === "operation" ? "Opération" : "Projet";
    proj.activities.forEach(a => {
      const rate = a.planValue > 0 ? Math.round((a.realValue / a.planValue) * 100) : 0;
      content += `"${typeLabel}";"${proj.serviceName || ""}";"${proj.name}";"${a.name}";"${a.nature}";${formatMontantReport(a.planValue)};${formatMontantReport(a.realValue)};${rate}%;${a.deliverables.length}\n`;
    });
  });
  content += "\n";

  content += `"=== LIVRABLES ==="\n`;
  content += `"Rattachement";"Activité";"Unité";"Cible";"Réalisé";"Performance"\n`;
  data.deliverables.forEach(d => {
    const perf = d.target > 0 ? Math.round((d.realized / d.target) * 100) : 0;
    content += `"${d.project}";"${d.activityName}";"${d.unit}";${formatMontantReport(d.target)};${formatMontantReport(d.realized)};${perf}%\n`;
  });

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = generateFileName(`Suivi_PTA_${data.ptaCode}_${data.selectedPeriod}`, "csv");
  link.click();
  URL.revokeObjectURL(link.href);
};

// === EXPORT CDP ===

export interface CDPExportData {
  cdpName: string;
  cdpCode: string;
  year: number;
  avgPerformance: number;
  atteints: number;
  enProgres: number;
  enRetard: number;
  totalIndicateurs: number;
  categories: {
    code: string;
    name: string;
    avgPerformance: number;
    atteints: number;
    enRetard: number;
    composantes: {
      code: string;
      name: string;
      avgPerformance: number;
      indicateurs: {
        code: string;
        name: string;
        unit: string;
        target: number;
        current: number;
        performance: number;
      }[];
    }[];
  }[];
}

export interface CDPExportFilters {
  cdpId: string;
  year: number;
  categoryId: string;
  categoryName?: string;
  componentId: string;
  componentName?: string;
}

export const exportCDPDashboardToPDF = (
  data: CDPExportData,
  filters: CDPExportFilters,
  headerSettings?: ReportHeaderSettings
) => {
  const config = getExportHeaderConfig();
  if (headerSettings?.headerColor) config.primaryColor = headerSettings.headerColor;
  if (headerSettings?.logoUrl) config.logoUrl = headerSettings.logoUrl;
  if (headerSettings?.organizationName) config.organizationName = headerSettings.organizationName;

  const filtersHTML = `
    <div class="context-filters">
      <div class="filter-item"><span class="filter-label">CDP:</span><span class="filter-value">${data.cdpCode}</span></div>
      <div class="filter-item"><span class="filter-label">Année:</span><span class="filter-value">${data.year}</span></div>
      ${filters.categoryName ? `<div class="filter-item"><span class="filter-label">Catégorie:</span><span class="filter-value">${filters.categoryName}</span></div>` : ""}
      ${filters.componentName ? `<div class="filter-item"><span class="filter-label">Composante:</span><span class="filter-value">${filters.componentName}</span></div>` : ""}
      <div class="filter-item"><span class="filter-label">Généré le:</span><span class="filter-value">${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}</span></div>
    </div>
  `;

  const kpisHTML = `
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-value">${data.totalIndicateurs}</div><div class="kpi-label">Indicateurs</div></div>
      <div class="kpi-card"><div class="kpi-value ${data.avgPerformance >= 80 ? "green" : "amber"}">${data.avgPerformance}%</div><div class="kpi-label">Performance moyenne</div></div>
      <div class="kpi-card"><div class="kpi-value green">${data.atteints}</div><div class="kpi-label">Atteints</div></div>
      <div class="kpi-card"><div class="kpi-value amber">${data.enProgres}</div><div class="kpi-label">En progression</div></div>
      <div class="kpi-card"><div class="kpi-value red">${data.enRetard}</div><div class="kpi-label">En retard</div></div>
    </div>
  `;

  // Stats avant le tableau des indicateurs CDP
  const cdpIndStatsHTML = generateStatsRow([
    { color: "blue", value: data.totalIndicateurs, label: "Indicateurs" },
    { color: "gray", value: data.categories.length, label: "Catégories" },
    { color: data.avgPerformance >= 80 ? "green" : "amber", value: `${data.avgPerformance}%`, label: "Perf. moy." },
    { color: "green", value: data.atteints, label: "Atteints" },
    { color: "amber", value: data.enProgres, label: "En progression" },
    { color: "red", value: data.enRetard, label: "En retard" },
  ]);

  // Tableau hiérarchique par catégorie et composante
  let categoriesHTML = `<div class="section-title">Indicateurs par catégorie et composante - ${data.year}</div>${cdpIndStatsHTML}`;
  
  data.categories.forEach(cat => {
    categoriesHTML += `
      <div class="category-header">
        <div class="category-name"><span class="badge badge-gray">${cat.code}</span> ${cat.name}</div>
        <div class="category-stats">
          <span>Atteints: <strong style="color:#22c55e">${cat.atteints}</strong></span>
          <span>En retard: <strong style="color:#ef4444">${cat.enRetard}</strong></span>
          <span>Performance: <strong>${cat.avgPerformance}%</strong></span>
        </div>
      </div>
    `;
    
    cat.composantes.forEach(comp => {
      categoriesHTML += `
        <div class="composante-header">
          <span><span class="badge badge-blue">${comp.code}</span> ${comp.name}</span>
          <span>Performance: <strong>${comp.avgPerformance}%</strong></span>
        </div>
        <table class="grouped-table" style="margin-bottom:0">
          <thead><tr>
            <th style="width:80px">Code</th>
            <th style="width:250px">Indicateur</th>
            <th style="width:70px">Unité</th>
            <th style="width:80px" class="amount">Cible</th>
            <th style="width:80px" class="amount">Réalisé</th>
            <th style="width:80px" class="amount">Performance</th>
          </tr></thead>
          <tbody>
            ${comp.indicateurs.map(ind => `
              <tr>
                <td>${ind.code}</td>
                <td>${ind.name.length > 50 ? ind.name.substring(0, 50) + "..." : ind.name}</td>
                <td>${ind.unit}</td>
                <td class="amount">${formatMontantReport(ind.target)}</td>
                <td class="amount">${ind.current !== undefined ? formatMontantReport(ind.current) : "-"}</td>
                <td class="amount">${ind.performance !== undefined ? getPerformanceBadgeHTML(ind.performance) : "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    });
  });

  const legendHTML = `
    <div class="legend">
      <div class="legend-item"><span class="legend-dot green"></span> ≥100% - Atteint</div>
      <div class="legend-item"><span class="legend-dot amber"></span> 80-99% - En progression</div>
      <div class="legend-item"><span class="legend-dot red"></span> <80% - En retard</div>
    </div>
  `;

  const headerHtml = generateExportHeader(config, `Suivi CDP ${data.year}`, `${data.cdpName} - Performance des indicateurs`);
  const footerHtml = generateExportFooter(config);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Suivi CDP</title>
    ${getBaseExportStyles(config, "landscape")}
    ${getDashboardExportStyles(config)}
  </head><body>
    ${headerHtml}
    ${filtersHTML}
    ${kpisHTML}
    ${categoriesHTML}
    ${legendHTML}
    ${footerHtml}
  </body></html>`;

  // Impression directe sans popup
  printDirectly(html);
};

export const exportCDPDashboardToCSV = (
  data: CDPExportData,
  filters: CDPExportFilters
) => {
  const BOM = "\uFEFF";
  let content = BOM;

  content += `"RAPPORT SUIVI CDP"\n`;
  content += `"CDP: ${data.cdpCode} - ${data.cdpName}"\n`;
  content += `"Année: ${data.year}"\n`;
  if (filters.categoryName) content += `"Catégorie: ${filters.categoryName}"\n`;
  if (filters.componentName) content += `"Composante: ${filters.componentName}"\n`;
  content += `"Généré le: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}"\n\n`;

  content += `"=== INDICATEURS GLOBAUX ==="\n`;
  content += `"Indicateurs";${data.totalIndicateurs}\n`;
  content += `"Performance moyenne";${data.avgPerformance}%\n`;
  content += `"Atteints";${data.atteints}\n`;
  content += `"En progression";${data.enProgres}\n`;
  content += `"En retard";${data.enRetard}\n\n`;

  content += `"=== SYNTHÈSE PAR CATÉGORIE ==="\n`;
  content += `"Code";"Catégorie";"Performance %";"Atteints";"En retard"\n`;
  data.categories.forEach(cat => {
    content += `"${cat.code}";"${cat.name}";${cat.avgPerformance};${cat.atteints};${cat.enRetard}\n`;
  });
  content += "\n";

  content += `"=== DÉTAIL DES INDICATEURS ==="\n`;
  content += `"Catégorie";"Composante";"Code";"Indicateur";"Unité";"Cible";"Réalisé";"Performance %"\n`;
  data.categories.forEach(cat => {
    cat.composantes.forEach(comp => {
      comp.indicateurs.forEach(ind => {
        content += `"${cat.name}";"${comp.name}";"${ind.code}";"${ind.name}";"${ind.unit}";${formatMontantReport(ind.target)};${ind.current !== undefined ? formatMontantReport(ind.current) : ""};${ind.performance !== undefined ? ind.performance : ""}\n`;
      });
    });
  });

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = generateFileName(`Suivi_CDP_${data.cdpCode}_${data.year}`, "csv");
  link.click();
  URL.revokeObjectURL(link.href);
};
