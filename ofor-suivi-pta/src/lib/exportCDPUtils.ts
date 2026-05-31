import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CDP, 
  CDPFicheSuiviIndicateur, 
  CDPEvaluationAnnuelle, 
  mockCDPCategories, 
  mockCDPComposantes,
  CDP_FICHE_STATUS_LABELS
} from "@/types/cdp";
import { formatMontant } from "./exportUtils";
import { 
  getExportHeaderConfig, 
  getBaseExportStyles, 
  generateExportHeader, 
  generateExportFooter,
  adjustColor 
} from "./exportSettings";

interface CDPReportData {
  cdp: CDP;
  evaluations: CDPEvaluationAnnuelle[];
  fiches: CDPFicheSuiviIndicateur[];
  selectedYear: number;
}

interface CategorySummary {
  id: string;
  code: string;
  name: string;
  totalIndicateurs: number;
  fichesWithData: number;
  avgPerformance: number;
  atteints: number;
  enProgres: number;
  enRetard: number;
  composantes: ComposanteSummary[];
}

interface ComposanteSummary {
  id: string;
  code: string;
  name: string;
  totalIndicateurs: number;
  fichesWithData: number;
  avgPerformance: number;
  atteints: number;
  enProgres: number;
  enRetard: number;
  fiches: CDPFicheSuiviIndicateur[];
}

const getPerformanceColor = (rate: number): string => {
  if (rate >= 100) return "#10b981"; // green
  if (rate >= 80) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

const calculateSummaries = (data: CDPReportData): { global: any; categories: CategorySummary[] } => {
  const yearEval = data.evaluations.find(e => e.year === data.selectedYear);
  const yearFiches = data.fiches.filter(f => f.evaluationId === yearEval?.id);
  const fichesWithData = yearFiches.filter(f => f.currentValue !== undefined);

  // Global summary
  const globalAvgPerf = fichesWithData.length > 0
    ? Math.round(fichesWithData.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / fichesWithData.length)
    : 0;
  const globalAtteints = fichesWithData.filter(f => (f.performanceRate || 0) >= 100).length;
  const globalEnProgres = fichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length;
  const globalEnRetard = fichesWithData.filter(f => (f.performanceRate || 0) < 80).length;

  // Categories summary
  const categories: CategorySummary[] = mockCDPCategories.map(cat => {
    const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
    const catFiches = yearFiches.filter(f => catComposantes.some(c => c.id === f.composanteId));
    const catFichesWithData = catFiches.filter(f => f.currentValue !== undefined);

    const composantes: ComposanteSummary[] = catComposantes.map(comp => {
      const compFiches = yearFiches.filter(f => f.composanteId === comp.id);
      const compFichesWithData = compFiches.filter(f => f.currentValue !== undefined);
      const compAvgPerf = compFichesWithData.length > 0
        ? Math.round(compFichesWithData.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / compFichesWithData.length)
        : 0;

      return {
        id: comp.id,
        code: comp.code,
        name: comp.name,
        totalIndicateurs: compFiches.length,
        fichesWithData: compFichesWithData.length,
        avgPerformance: compAvgPerf,
        atteints: compFichesWithData.filter(f => (f.performanceRate || 0) >= 100).length,
        enProgres: compFichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length,
        enRetard: compFichesWithData.filter(f => (f.performanceRate || 0) < 80).length,
        fiches: compFiches,
      };
    }).filter(c => c.totalIndicateurs > 0);

    const catAvgPerf = catFichesWithData.length > 0
      ? Math.round(catFichesWithData.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / catFichesWithData.length)
      : 0;

    return {
      id: cat.id,
      code: cat.code,
      name: cat.name,
      totalIndicateurs: catFiches.length,
      fichesWithData: catFichesWithData.length,
      avgPerformance: catAvgPerf,
      atteints: catFichesWithData.filter(f => (f.performanceRate || 0) >= 100).length,
      enProgres: catFichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length,
      enRetard: catFichesWithData.filter(f => (f.performanceRate || 0) < 80).length,
      composantes,
    };
  }).filter(c => c.totalIndicateurs > 0);

  return {
    global: {
      totalIndicateurs: yearFiches.length,
      fichesWithData: fichesWithData.length,
      avgPerformance: globalAvgPerf,
      atteints: globalAtteints,
      enProgres: globalEnProgres,
      enRetard: globalEnRetard,
    },
    categories,
  };
};

const generateCDPReportHTML = (data: CDPReportData): string => {
  const { global, categories } = calculateSummaries(data);
  const config = getExportHeaderConfig();
  
  const additionalStyles = `
    <style>
      /* Global Summary Cards */
      .global-summary {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
        flex-wrap: wrap;
      }
      .summary-card {
        flex: 1;
        min-width: 100px;
        padding: 10px;
        border-radius: 6px;
        text-align: center;
        border: 1px solid #e0e0e0;
      }
      .summary-card.primary { background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%); color: white; }
      .summary-card.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
      .summary-card.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
      .summary-card.danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
      .summary-card .value { font-size: 20px; font-weight: bold; }
      .summary-card .label { font-size: 8px; opacity: 0.9; text-transform: uppercase; }
      
      /* Category Summary */
      .category-summary { margin-bottom: 15px; page-break-inside: avoid; }
      .category-header {
        background: linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%);
        padding: 8px 12px;
        border-left: 4px solid ${config.primaryColor};
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 0 4px 4px 0;
      }
      .category-title { font-size: 11px; font-weight: bold; color: ${config.primaryColor}; }
      .category-code { 
        font-size: 9px; 
        color: #666; 
        font-family: monospace; 
        background: ${config.primaryColor}20; 
        padding: 2px 6px; 
        border-radius: 3px; 
      }
      .category-stats { display: flex; gap: 15px; font-size: 8px; }
      .stat-item { display: flex; align-items: center; gap: 3px; }
      .stat-dot { width: 8px; height: 8px; border-radius: 50%; }
      .stat-dot.green { background: #10b981; }
      .stat-dot.amber { background: #f59e0b; }
      .stat-dot.red { background: #ef4444; }
      
      /* Perf Bar */
      .perf-bar-container {
        background: #e5e7eb;
        border-radius: 4px;
        height: 20px;
        overflow: hidden;
        margin: 5px 0 10px 0;
        display: flex;
        align-items: center;
        position: relative;
      }
      .perf-bar { height: 100%; border-radius: 4px 0 0 4px; }
      .perf-bar-label { position: absolute; right: 8px; font-size: 10px; font-weight: bold; color: #333; }
      
      /* Composante */
      .composante-section { margin-bottom: 10px; }
      .composante-header {
        background: #f1f5f9;
        padding: 5px 8px;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }
      .composante-title { font-size: 9px; font-weight: 600; }
      .composante-code { font-size: 8px; color: #666; font-family: monospace; }
      .composante-perf { font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 10px; color: white; }
      
      /* Status badges */
      .code-cell { font-family: monospace; font-size: 7px; color: #666; }
      .perf-cell { text-align: center; font-weight: bold; }
      .status-badge { display: inline-block; padding: 1px 5px; border-radius: 8px; font-size: 7px; font-weight: 500; }
      .status-approuve { background: #dcfce7; color: #166534; }
      .status-valide { background: #dbeafe; color: #1e40af; }
      .status-soumis { background: #fef3c7; color: #92400e; }
      .status-brouillon { background: #f1f5f9; color: #475569; }
      
      /* Radar */
      .radar-summary { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
      .radar-item { flex: 1; min-width: 100px; text-align: center; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
      .radar-circle {
        width: 55px; height: 55px; border-radius: 50%; margin: 0 auto 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: bold; color: white;
      }
      .radar-label { font-size: 8px; color: #666; }
      .radar-name { font-size: 9px; font-weight: 600; margin-top: 3px; }
    </style>
  `;

  // Header avec bannière
  const headerHtml = generateExportHeader(
    config,
    "Rapport de Performance CDP",
    `${data.cdp.name} | Période : ${data.cdp.startYear} - ${data.cdp.endYear} | Année d'évaluation : ${data.selectedYear}`
  );

  // Global Summary Cards
  const globalSummaryHtml = `
    <div class="global-summary">
      <div class="summary-card primary">
        <div class="value">${global.totalIndicateurs}</div>
        <div class="label">Total indicateurs</div>
      </div>
      <div class="summary-card primary">
        <div class="value">${global.avgPerformance}%</div>
        <div class="label">Performance moyenne</div>
      </div>
      <div class="summary-card success">
        <div class="value">${global.atteints}</div>
        <div class="label">Objectifs atteints</div>
      </div>
      <div class="summary-card warning">
        <div class="value">${global.enProgres}</div>
        <div class="label">En progression</div>
      </div>
      <div class="summary-card danger">
        <div class="value">${global.enRetard}</div>
        <div class="label">En retard</div>
      </div>
    </div>
  `;

  // Radar summary by category
  const radarHtml = `
    <div class="radar-summary">
      ${categories.map(cat => `
        <div class="radar-item">
          <div class="radar-circle" style="background: ${getPerformanceColor(cat.avgPerformance)};">
            ${cat.avgPerformance}%
          </div>
          <div class="radar-label">${cat.code}</div>
          <div class="radar-name">${cat.name}</div>
        </div>
      `).join('')}
    </div>
  `;

  // Categories detail
  const categoriesHtml = categories.map(cat => `
    <div class="category-summary">
      <div class="category-header">
        <div>
          <span class="category-code">${cat.code}</span>
          <span class="category-title" style="margin-left: 8px;">${cat.name}</span>
        </div>
        <div class="category-stats">
          <div class="stat-item"><span class="stat-dot green"></span> ${cat.atteints} atteints</div>
          <div class="stat-item"><span class="stat-dot amber"></span> ${cat.enProgres} en cours</div>
          <div class="stat-item"><span class="stat-dot red"></span> ${cat.enRetard} en retard</div>
        </div>
      </div>
      <div class="perf-bar-container">
        <div class="perf-bar" style="width: ${Math.min(cat.avgPerformance, 100)}%; background: ${getPerformanceColor(cat.avgPerformance)};"></div>
        <span class="perf-bar-label">${cat.avgPerformance}%</span>
      </div>
      
      ${cat.composantes.map(comp => `
        <div class="composante-section">
          <div class="composante-header">
            <div>
              <span class="composante-code">${comp.code}</span>
              <span class="composante-title" style="margin-left: 6px;">${comp.name}</span>
            </div>
            <span class="composante-perf" style="background: ${getPerformanceColor(comp.avgPerformance)};">
              ${comp.avgPerformance}%
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">Code</th>
                <th>Indicateur</th>
                <th style="width: 50px;">Unité</th>
                <th style="width: 70px;">Cible</th>
                <th style="width: 70px;">Réalisé</th>
                <th style="width: 50px;">Perf.</th>
                <th style="width: 60px;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${comp.fiches.map(fiche => {
                const perfRate = fiche.performanceRate || 0;
                const statusClass = fiche.status === 'approuve' ? 'status-approuve' : 
                                   fiche.status === 'valide' ? 'status-valide' :
                                   fiche.status === 'soumis' ? 'status-soumis' : 'status-brouillon';
                return `
                  <tr>
                    <td class="code-cell">${fiche.indicateurCode}</td>
                    <td>${fiche.indicateurName}</td>
                    <td>${fiche.unit}</td>
                    <td class="amount">${formatMontant(fiche.targetValue)}</td>
                    <td class="amount">${fiche.currentValue !== undefined ? formatMontant(fiche.currentValue) : '-'}</td>
                    <td class="perf-cell" style="color: ${getPerformanceColor(perfRate)};">${perfRate > 0 ? perfRate + '%' : '-'}</td>
                    <td><span class="status-badge ${statusClass}">${CDP_FICHE_STATUS_LABELS[fiche.status]}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
  `).join('');

  const footerHtml = generateExportFooter(config);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${getBaseExportStyles(config, "portrait")}${additionalStyles}</head><body>${headerHtml}${globalSummaryHtml}${radarHtml}${categoriesHtml}${footerHtml}</body></html>`;
};

export const exportCDPReport = (data: CDPReportData) => {
  const htmlContent = generateCDPReportHTML(data);
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Export CSV for CDP data
export const exportCDPToCSV = (data: CDPReportData) => {
  const yearEval = data.evaluations.find(e => e.year === data.selectedYear);
  const yearFiches = data.fiches.filter(f => f.evaluationId === yearEval?.id);

  // Add category and composante info
  const enrichedFiches = yearFiches.map(fiche => {
    const composante = mockCDPComposantes.find(c => c.id === fiche.composanteId);
    const category = composante 
      ? mockCDPCategories.find(cat => cat.id === composante.categorieId)
      : null;
    
    return {
      ...fiche,
      categoryCode: category?.code || '',
      categoryName: category?.name || '',
      composanteCode: composante?.code || '',
      composanteName: composante?.name || '',
    };
  });

  const BOM = "\uFEFF";
  
  const headers = [
    "Catégorie",
    "Composante", 
    "Code Indicateur",
    "Indicateur",
    "Unité",
    "Cible",
    "Réalisé",
    "Performance (%)",
    "Statut"
  ].map(h => `"${h}"`).join(";");
  
  const rows = enrichedFiches.map(f => [
    `"${f.categoryName}"`,
    `"${f.composanteName}"`,
    `"${f.indicateurCode}"`,
    `"${f.indicateurName}"`,
    `"${f.unit}"`,
    formatMontant(f.targetValue),
    f.currentValue !== undefined ? formatMontant(f.currentValue) : '"-"',
    f.performanceRate !== undefined ? `${f.performanceRate}%` : '"-"',
    `"${CDP_FICHE_STATUS_LABELS[f.status]}"`
  ].join(";"));
  
  const csvContent = BOM + headers + "\n" + rows.join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `CDP_${data.cdp.code}_${data.selectedYear}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export PDF catégorisé pour les fiches de suivi CDP
interface FichesSuiviExportData {
  cdpName: string;
  year: number;
  fiches: CDPFicheSuiviIndicateur[];
}

export const exportFichesSuiviToPDF = (data: FichesSuiviExportData) => {
  const config = getExportHeaderConfig();
  
  // Regrouper les fiches par catégorie et composante
  const fichesByCategory = mockCDPCategories.map(cat => {
    const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
    const composantesWithFiches = catComposantes.map(comp => {
      const compFiches = data.fiches.filter(f => f.composanteId === comp.id);
      const fichesWithPerf = compFiches.filter(f => f.performanceRate !== undefined);
      const avgPerf = fichesWithPerf.length > 0
        ? Math.round(fichesWithPerf.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / fichesWithPerf.length)
        : 0;
      return { composante: comp, fiches: compFiches, avgPerf };
    }).filter(c => c.fiches.length > 0);
    
    const catFiches = composantesWithFiches.flatMap(c => c.fiches);
    const catFichesWithPerf = catFiches.filter(f => f.performanceRate !== undefined);
    const catAvgPerf = catFichesWithPerf.length > 0
      ? Math.round(catFichesWithPerf.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / catFichesWithPerf.length)
      : 0;
    
    return { 
      categorie: cat, 
      composantes: composantesWithFiches,
      totalFiches: catFiches.length,
      avgPerf: catAvgPerf
    };
  }).filter(c => c.composantes.length > 0);

  const additionalStyles = `
    <style>
      .category-section { margin-bottom: 12px; page-break-inside: avoid; }
      .category-header {
        background: linear-gradient(90deg, ${config.primaryColor}15 0%, ${config.primaryColor}05 100%);
        padding: 8px 12px;
        border-left: 4px solid ${config.primaryColor};
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 0 4px 4px 0;
      }
      .category-title { font-size: 11px; font-weight: bold; color: ${config.primaryColor}; }
      .category-code { 
        font-size: 9px; 
        color: white; 
        font-family: monospace; 
        background: ${config.primaryColor}; 
        padding: 2px 6px; 
        border-radius: 3px; 
        margin-right: 8px;
      }
      .category-stats { display: flex; gap: 12px; font-size: 9px; align-items: center; }
      .stat-badge { 
        padding: 2px 8px; 
        border-radius: 10px; 
        font-weight: 600;
        color: white;
      }
      .stat-green { background: #10b981; }
      .stat-amber { background: #f59e0b; }
      .stat-red { background: #ef4444; }
      
      .composante-section { margin-bottom: 8px; margin-left: 12px; }
      .composante-header {
        background: #f1f5f9;
        padding: 5px 10px;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .composante-title { font-size: 9px; font-weight: 600; }
      .composante-code { 
        font-size: 8px; 
        color: #666; 
        font-family: monospace; 
        background: #e2e8f0;
        padding: 1px 4px;
        border-radius: 2px;
        margin-right: 6px;
      }
      .composante-perf { 
        font-size: 9px; 
        font-weight: bold; 
        padding: 2px 8px; 
        border-radius: 10px; 
        color: white; 
      }
      
      .indicator-table { margin-left: 0; }
      .indicator-table th { font-size: 7px; padding: 4px 6px; }
      .indicator-table td { font-size: 8px; padding: 3px 6px; }
      
      .code-cell { font-family: monospace; font-size: 7px; color: #666; }
      .perf-cell { text-align: center; font-weight: bold; }
      .status-badge { 
        display: inline-block; 
        padding: 1px 5px; 
        border-radius: 8px; 
        font-size: 7px; 
        font-weight: 500; 
      }
      .status-approuve { background: #dcfce7; color: #166534; }
      .status-valide { background: #dbeafe; color: #1e40af; }
      .status-soumis { background: #fef3c7; color: #92400e; }
      .status-brouillon { background: #f1f5f9; color: #475569; }
      
      .summary-bar {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
        padding: 10px;
        background: #f8fafc;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }
      .summary-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 9px;
      }
      .summary-value { font-weight: bold; font-size: 12px; }
      .summary-label { color: #666; }
    </style>
  `;

  // Calcul des statistiques globales
  const totalFiches = data.fiches.length;
  const fichesWithData = data.fiches.filter(f => f.currentValue !== undefined);
  const avgPerf = fichesWithData.length > 0
    ? Math.round(fichesWithData.reduce((acc, f) => acc + (f.performanceRate || 0), 0) / fichesWithData.length)
    : 0;
  const atteints = fichesWithData.filter(f => (f.performanceRate || 0) >= 100).length;
  const enProgres = fichesWithData.filter(f => (f.performanceRate || 0) >= 80 && (f.performanceRate || 0) < 100).length;
  const enRetard = fichesWithData.filter(f => (f.performanceRate || 0) < 80).length;

  const headerHtml = generateExportHeader(
    config,
    "Fiches de Suivi CDP",
    `${data.cdpName} | Année d'évaluation : ${data.year}`
  );

  const summaryHtml = `
    <div class="summary-bar">
      <div class="summary-item">
        <span class="summary-value">${totalFiches}</span>
        <span class="summary-label">Indicateurs</span>
      </div>
      <div class="summary-item">
        <span class="summary-value" style="color: ${getPerformanceColor(avgPerf)};">${avgPerf}%</span>
        <span class="summary-label">Performance moy.</span>
      </div>
      <div class="summary-item">
        <span class="stat-badge stat-green">${atteints}</span>
        <span class="summary-label">Atteints</span>
      </div>
      <div class="summary-item">
        <span class="stat-badge stat-amber">${enProgres}</span>
        <span class="summary-label">En cours</span>
      </div>
      <div class="summary-item">
        <span class="stat-badge stat-red">${enRetard}</span>
        <span class="summary-label">En retard</span>
      </div>
    </div>
  `;

  const categoriesHtml = fichesByCategory.map(({ categorie, composantes, totalFiches, avgPerf }) => `
    <div class="category-section">
      <div class="category-header">
        <div>
          <span class="category-code">${categorie.code}</span>
          <span class="category-title">${categorie.name}</span>
        </div>
        <div class="category-stats">
          <span>${totalFiches} indicateur(s)</span>
          ${avgPerf > 0 ? `<span class="stat-badge" style="background: ${getPerformanceColor(avgPerf)};">${avgPerf}%</span>` : ''}
        </div>
      </div>
      
      ${composantes.map(({ composante, fiches, avgPerf }) => `
        <div class="composante-section">
          <div class="composante-header">
            <div>
              <span class="composante-code">${composante.code}</span>
              <span class="composante-title">${composante.name}</span>
            </div>
            ${avgPerf > 0 ? `<span class="composante-perf" style="background: ${getPerformanceColor(avgPerf)};">${avgPerf}%</span>` : ''}
          </div>
          <table class="indicator-table">
            <thead>
              <tr>
                <th style="width: 55px;">Code</th>
                <th>Indicateur</th>
                <th style="width: 40px;">Unité</th>
                <th style="width: 55px;">Cible</th>
                <th style="width: 55px;">Réalisé</th>
                <th style="width: 45px;">Perf.</th>
                <th style="width: 55px;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${fiches.map(fiche => {
                const perfRate = fiche.performanceRate || 0;
                const statusClass = fiche.status === 'approuve' ? 'status-approuve' : 
                                   fiche.status === 'valide' ? 'status-valide' :
                                   fiche.status === 'soumis' ? 'status-soumis' : 'status-brouillon';
                return `
                  <tr>
                    <td class="code-cell">${fiche.indicateurCode}</td>
                    <td>${fiche.indicateurName}</td>
                    <td>${fiche.unit}</td>
                    <td class="amount">${formatMontant(fiche.targetValue)}</td>
                    <td class="amount">${fiche.currentValue !== undefined ? formatMontant(fiche.currentValue) : '-'}</td>
                    <td class="perf-cell" style="color: ${getPerformanceColor(perfRate)};">${perfRate > 0 ? perfRate + '%' : '-'}</td>
                    <td><span class="status-badge ${statusClass}">${CDP_FICHE_STATUS_LABELS[fiche.status]}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
  `).join('');

  const footerHtml = generateExportFooter(config);

  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8">${getBaseExportStyles(config, "portrait")}${additionalStyles}</head><body>${headerHtml}${summaryHtml}${categoriesHtml}${footerHtml}</body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
