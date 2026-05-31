import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { PTAActivity, PTA_ITEM_VALIDATION_LABELS } from "@/types/pta";
import { FicheSuivi, Workflow, calculateWorkflowProgress } from "@/types/workflow";
import { Activity, ACTIVITY_STATUS_LABELS, getDeliverableCode, getDeliverableName, getDeliverableUnit } from "@/types/project";
import { formatMontant } from "./exportUtils";
import { 
  getExportHeaderConfig, 
  getBaseExportStyles, 
  generateExportHeader, 
  generateExportFooter,
  adjustColor 
} from "./exportSettings";

// ==================== EXPORT PDF INDICATEUR SUIVI DETAIL ====================

export interface IndicateurSuiviDetailExportData {
  indicateur: {
    id: string;
    code: string;
    name: string;
    unit: string;
    baselineValue: number;
    targetValue: number;
    currentValue: number;
    previousValue: number;
  };
  projectName: string;
  dateCollecte: string;
  ficheCode: string;
  quarterlyValues: {
    t1: number | null;
    t2: number | null;
    t3: number | null;
    t4: number | null;
  };
  ptaData?: {
    annualTarget?: number;
    targetT1?: number;
    targetT2?: number;
    targetT3?: number;
    targetT4?: number;
  };
  historique?: {
    date: string;
    value: number;
  }[];
}

export const exportIndicateurSuiviDetailToPDF = (data: IndicateurSuiviDetailExportData) => {
  const config = getExportHeaderConfig();
  const { indicateur, projectName, dateCollecte, ficheCode, quarterlyValues, ptaData, historique = [] } = data;
  
  const progress = indicateur.targetValue > 0 
    ? Math.round((indicateur.currentValue / indicateur.targetValue) * 100) 
    : 0;
  
  const quarters = [
    { key: 't1', label: 'T1', value: quarterlyValues.t1, target: ptaData?.targetT1, color: '#3b82f6' },
    { key: 't2', label: 'T2', value: quarterlyValues.t2, target: ptaData?.targetT2, color: '#10b981' },
    { key: 't3', label: 'T3', value: quarterlyValues.t3, target: ptaData?.targetT3, color: '#f59e0b' },
    { key: 't4', label: 'T4', value: quarterlyValues.t4, target: ptaData?.targetT4, color: '#8b5cf6' },
  ];

  const additionalStyles = `
    <style>
      .indicator-card {
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        margin-bottom: 15px;
      }
      .indicator-header {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -15)} 100%);
        padding: 20px;
        color: white;
      }
      .indicator-code {
        font-family: monospace;
        font-size: 11px;
        background: rgba(255,255,255,0.2);
        padding: 3px 10px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 8px;
      }
      .indicator-title {
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 8px 0;
      }
      .indicator-meta {
        font-size: 11px;
        opacity: 0.9;
      }
      .indicator-body { padding: 20px; background: #f8fafc; }
      
      .progress-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      }
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .progress-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; }
      .progress-value { font-size: 22px; font-weight: bold; color: ${progress >= 100 ? '#16a34a' : progress >= 75 ? '#d97706' : '#dc2626'}; }
      .progress-bar {
        height: 12px;
        background: #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 10px;
      }
      .progress-fill {
        height: 100%;
        background: ${progress >= 100 ? '#16a34a' : progress >= 75 ? '#d97706' : '#dc2626'};
        border-radius: 6px;
      }
      .progress-details {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #64748b;
      }
      .progress-details strong { color: #1e293b; }
      
      .values-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 15px;
      }
      .value-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 12px;
        text-align: center;
      }
      .value-card.primary {
        background: ${config.primaryColor}10;
        border-color: ${config.primaryColor}30;
      }
      .value-label { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
      .value-number { font-size: 14px; font-weight: bold; color: #1e293b; }
      .value-number.primary { color: ${config.primaryColor}; }
      
      .quarters-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 15px;
      }
      .quarters-header {
        background: ${config.primaryColor}10;
        padding: 10px 15px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 11px;
        font-weight: 600;
        color: ${config.primaryColor};
      }
      .quarters-table { width: 100%; border-collapse: collapse; }
      .quarters-table th {
        text-align: left;
        padding: 10px 12px;
        font-size: 9px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .quarters-table th.right { text-align: right; }
      .quarters-table td {
        padding: 10px 12px;
        font-size: 10px;
        border-bottom: 1px solid #f1f5f9;
      }
      .quarters-table td.right { text-align: right; font-family: monospace; }
      .quarters-table tr.total { background: ${config.primaryColor}08; font-weight: 600; }
      .quarter-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 6px;
      }
      .quarter-bar {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        width: 60px;
        display: inline-block;
        margin-right: 6px;
      }
      .quarter-bar-fill { height: 100%; border-radius: 3px; }
      .ecart-positive { color: #16a34a; }
      .ecart-negative { color: #dc2626; }
      
      .history-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }
      .history-header {
        background: #f8fafc;
        padding: 10px 15px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 11px;
        font-weight: 600;
        color: #1e293b;
      }
      .history-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 15px;
        font-size: 10px;
        border-bottom: 1px solid #f1f5f9;
      }
      .history-item:last-child { border-bottom: none; }
      .history-date { color: #64748b; }
      .history-value { font-family: monospace; font-weight: 600; color: #1e293b; }
      
      .pta-info {
        background: ${config.primaryColor}08;
        border: 1px solid ${config.primaryColor}20;
        border-radius: 6px;
        padding: 12px 15px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .pta-label { font-size: 10px; color: #64748b; }
      .pta-value { font-size: 14px; font-weight: bold; color: ${config.primaryColor}; }
    </style>
  `;

  const headerHtml = generateExportHeader(
    config,
    "Fiche Détail Indicateur",
    projectName
  );

  // Générer le tableau des trimestres
  const quartersRowsHtml = quarters.map(q => {
    const qPerf = q.target && q.target > 0 && q.value !== null 
      ? Math.round((q.value / q.target) * 100) 
      : null;
    const ecart = q.target && q.value !== null ? q.value - q.target : null;
    
    return `
      <tr>
        <td>
          <span class="quarter-dot" style="background: ${q.color};"></span>
          <strong>${q.label}</strong>
        </td>
        <td class="right">${q.target ? formatMontant(q.target) : '-'}</td>
        <td class="right"><strong>${q.value !== null ? formatMontant(q.value) : '-'}</strong></td>
        <td class="right ${ecart !== null && ecart >= 0 ? 'ecart-positive' : 'ecart-negative'}">
          ${ecart !== null ? (ecart >= 0 ? '+' : '') + formatMontant(ecart) : '-'}
        </td>
        <td>
          ${qPerf !== null ? `
            <div class="quarter-bar">
              <div class="quarter-bar-fill" style="width: ${Math.min(qPerf, 100)}%; background: ${q.color};"></div>
            </div>
            <span style="color: ${qPerf >= 100 ? '#16a34a' : qPerf >= 75 ? '#d97706' : '#dc2626'};">${qPerf}%</span>
          ` : '-'}
        </td>
      </tr>
    `;
  }).join('');

  // Historique
  const historiqueHtml = historique.length > 0 ? `
    <div class="history-section">
      <div class="history-header">📊 Historique des valeurs</div>
      ${historique.slice(0, 10).map(h => `
        <div class="history-item">
          <span class="history-date">${format(parseISO(h.date), "dd/MM/yyyy", { locale: fr })}</span>
          <span class="history-value">${formatMontant(h.value)} ${indicateur.unit}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  // PTA info
  const ptaHtml = ptaData?.annualTarget ? `
    <div class="pta-info">
      <span class="pta-label">🎯 Cible annuelle PTA</span>
      <span class="pta-value">${formatMontant(ptaData.annualTarget)} ${indicateur.unit}</span>
    </div>
  ` : '';

  const bodyHtml = `
    <div class="indicator-card">
      <div class="indicator-header">
        <span class="indicator-code">${indicateur.code}</span>
        <h2 class="indicator-title">${indicateur.name}</h2>
        <div class="indicator-meta">
          📅 Collecte du ${format(parseISO(dateCollecte), "dd MMMM yyyy", { locale: fr })} • Fiche ${ficheCode}
        </div>
      </div>
      
      <div class="indicator-body">
        <!-- Atteinte globale -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Atteinte globale</span>
            <span class="progress-value">${progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%;"></div>
          </div>
          <div class="progress-details">
            <span>Valeur actuelle: <strong>${formatMontant(indicateur.currentValue)}</strong> ${indicateur.unit}</span>
            <span>Cible: ${formatMontant(indicateur.targetValue)} ${indicateur.unit}</span>
          </div>
        </div>
        
        <!-- Valeurs de référence -->
        <div class="values-grid">
          <div class="value-card">
            <div class="value-label">Référence</div>
            <div class="value-number">${formatMontant(indicateur.baselineValue)}</div>
          </div>
          <div class="value-card">
            <div class="value-label">Valeur précédente</div>
            <div class="value-number">${formatMontant(indicateur.previousValue)}</div>
          </div>
          <div class="value-card primary">
            <div class="value-label">Unité</div>
            <div class="value-number primary">${indicateur.unit}</div>
          </div>
        </div>
        
        ${ptaHtml}
        
        <!-- Performances trimestrielles -->
        <div class="quarters-section">
          <div class="quarters-header">📈 Performances par trimestre</div>
          <table class="quarters-table">
            <thead>
              <tr>
                <th>Trimestre</th>
                <th class="right">Cible PTA</th>
                <th class="right">Réalisé</th>
                <th class="right">Écart</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              ${quartersRowsHtml}
              <tr class="total">
                <td><strong>Cumulé</strong></td>
                <td class="right">${formatMontant(indicateur.targetValue)}</td>
                <td class="right"><strong>${formatMontant(indicateur.currentValue)}</strong></td>
                <td class="right ${indicateur.currentValue - indicateur.targetValue >= 0 ? 'ecart-positive' : 'ecart-negative'}">
                  ${indicateur.currentValue - indicateur.targetValue >= 0 ? '+' : ''}${formatMontant(indicateur.currentValue - indicateur.targetValue)}
                </td>
                <td>
                  <div class="quarter-bar">
                    <div class="quarter-bar-fill" style="width: ${Math.min(progress, 100)}%; background: ${config.primaryColor};"></div>
                  </div>
                  <span style="color: ${progress >= 100 ? '#16a34a' : progress >= 75 ? '#d97706' : '#dc2626'};">${progress}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        ${historiqueHtml}
      </div>
    </div>
  `;

  const footerHtml = generateExportFooter(config);

  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Indicateur - ${indicateur.code}</title>
        ${getBaseExportStyles(config, "portrait")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Formater un budget
const formatBudget = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} Mds FCFA`;
  }
  if (amount >= 1000000) {
    return `${formatMontant(Math.round(amount / 1000000))} M FCFA`;
  }
  if (amount === 0) return "-";
  return `${formatMontant(amount)} FCFA`;
};

// Export PDF de la fiche détail Activité PTA
export const exportPTAActivityDetailToPDF = (activity: PTAActivity, year: number) => {
  const config = getExportHeaderConfig();
  
  const additionalStyles = `
    <style>
      .activity-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        margin-bottom: 15px;
      }
      .activity-header {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -15)} 100%);
        padding: 15px 20px;
        color: white;
      }
      .activity-title {
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 8px 0;
      }
      .activity-badges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .badge-status {
        background: ${activity.validationStatus === 'valide' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(255,255,255,0.25)'};
        color: white;
      }
      .badge-nature {
        background: rgba(255,255,255,0.2);
        color: white;
      }
      .badge-trimestre {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 8px;
      }
      .badge-t1 { background: #3b82f6; color: white; }
      .badge-t2 { background: #10b981; color: white; }
      .badge-t3 { background: #f59e0b; color: white; }
      .badge-t4 { background: #8b5cf6; color: white; }
      
      .activity-body { padding: 15px 20px; }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 15px;
      }
      .info-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .info-icon {
        width: 32px;
        height: 32px;
        background: ${config.primaryColor}15;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${config.primaryColor};
        font-size: 14px;
      }
      .info-content {}
      .info-label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
      .info-value { font-size: 11px; font-weight: 600; color: #1e293b; }
      
      .section {
        margin-bottom: 15px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
      }
      .section-header {
        background: linear-gradient(90deg, ${config.primaryColor}15 0%, transparent 100%);
        padding: 8px 12px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-icon {
        width: 20px;
        height: 20px;
        background: ${config.primaryColor};
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
      }
      .section-title { font-size: 10px; font-weight: 600; color: ${config.primaryColor}; text-transform: uppercase; }
      .section-body { padding: 12px; }
      
      .description-text {
        font-size: 10px;
        line-height: 1.6;
        color: #374151;
      }
      
      .deliverable-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px dashed #e2e8f0;
      }
      .deliverable-item:last-child { border-bottom: none; }
      .deliverable-name { font-size: 10px; color: #64748b; }
      .deliverable-value { font-size: 11px; font-weight: bold; color: #1e293b; }
      
      .budget-section {
        background: linear-gradient(135deg, ${config.primaryColor}08 0%, ${config.primaryColor}15 100%);
        border: 2px solid ${config.primaryColor}30;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      }
      .budget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .budget-label {
        font-size: 11px;
        font-weight: 600;
        color: ${config.primaryColor};
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .budget-total {
        font-size: 20px;
        font-weight: bold;
        color: ${config.primaryColor};
      }
      
      .budget-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
      .budget-item {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 10px;
        text-align: center;
      }
      .budget-item.active { border-color: ${config.primaryColor}50; }
      .budget-item.inactive { opacity: 0.5; }
      .budget-item-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        margin-bottom: 5px;
      }
      .budget-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .budget-dot-t1 { background: #3b82f6; }
      .budget-dot-t2 { background: #10b981; }
      .budget-dot-t3 { background: #f59e0b; }
      .budget-dot-t4 { background: #8b5cf6; }
      .budget-item-label { font-size: 10px; font-weight: 600; color: #64748b; }
      .budget-item-value { font-size: 12px; font-weight: bold; color: #1e293b; }
      
      .budget-bar {
        height: 24px;
        background: #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        margin-top: 12px;
      }
      .budget-bar-segment {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 8px;
        font-weight: 600;
      }
      
      .validation-info {
        background: #dcfce7;
        border: 1px solid #86efac;
        border-radius: 6px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 10px;
        color: #166534;
      }
      .validation-icon { font-size: 14px; }
    </style>
  `;
  
  const headerHtml = generateExportHeader(
    config,
    "Fiche Détail Activité PTA",
    `Année ${year}`
  );
  
  // Trimestres badges
  const trimestresBadges = activity.trimestres.map(t => 
    `<span class="badge badge-trimestre badge-${t.toLowerCase()}">${t} ${year}</span>`
  ).join("");
  
  // Livrables
  const livrablesHtml = activity.deliverables.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📦</div>
        <span class="section-title">Livrables (${activity.deliverables.length})</span>
      </div>
      <div class="section-body">
        ${activity.deliverables.map(d => `
          <div class="deliverable-item">
            <span class="deliverable-name">${d.unit}</span>
            <span class="deliverable-value">${formatMontant(d.targetValue)}</span>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";
  
  // Budget bar segments
  const budgetData = [
    { label: "T1", value: activity.budgetT1, color: "#3b82f6" },
    { label: "T2", value: activity.budgetT2, color: "#10b981" },
    { label: "T3", value: activity.budgetT3, color: "#f59e0b" },
    { label: "T4", value: activity.budgetT4, color: "#8b5cf6" },
  ];
  
  const budgetBarHtml = activity.budgetTotal > 0 ? budgetData.map(item => {
    const percentage = (item.value / activity.budgetTotal) * 100;
    if (percentage === 0) return "";
    return `<div class="budget-bar-segment" style="width: ${percentage}%; background: ${item.color};">${percentage >= 15 ? item.label : ""}</div>`;
  }).join("") : "";
  
  // Validation info
  const validationHtml = activity.validationStatus === 'valide' && activity.validatedAt ? `
    <div class="validation-info">
      <span class="validation-icon">✓</span>
      <span>Validé le ${format(new Date(activity.validatedAt), "dd MMMM yyyy", { locale: fr })} par ${activity.validatedBy || "N/A"}</span>
    </div>
  ` : "";
  
  const bodyHtml = `
    <div class="activity-card">
      <div class="activity-header">
        <h2 class="activity-title">${activity.name}</h2>
        <div class="activity-badges">
          <span class="badge badge-status">${PTA_ITEM_VALIDATION_LABELS[activity.validationStatus || "brouillon"]}</span>
          <span class="badge badge-nature">${activity.nature}</span>
          ${trimestresBadges}
        </div>
      </div>
      
      <div class="activity-body">
        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon">📁</div>
            <div class="info-content">
              <div class="info-label">Projet</div>
              <div class="info-value">${activity.project}</div>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">👤</div>
            <div class="info-content">
              <div class="info-label">Responsable</div>
              <div class="info-value">${activity.responsable}</div>
            </div>
          </div>
        </div>
        
        ${activity.description ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon">📝</div>
              <span class="section-title">Description</span>
            </div>
            <div class="section-body">
              <p class="description-text">${activity.description}</p>
            </div>
          </div>
        ` : ""}
        
        ${livrablesHtml}
        
        <div class="budget-section">
          <div class="budget-header">
            <span class="budget-label">💰 Budget total</span>
            <span class="budget-total">${formatBudget(activity.budgetTotal)}</span>
          </div>
          
          <div class="budget-grid">
            ${budgetData.map(item => `
              <div class="budget-item ${activity.trimestres.includes(item.label) ? 'active' : 'inactive'}">
                <div class="budget-item-header">
                  <span class="budget-dot budget-dot-${item.label.toLowerCase()}"></span>
                  <span class="budget-item-label">${item.label}</span>
                </div>
                <div class="budget-item-value">${item.value > 0 ? formatBudget(item.value) : "-"}</div>
              </div>
            `).join("")}
          </div>
          
          ${activity.budgetTotal > 0 ? `<div class="budget-bar">${budgetBarHtml}</div>` : ""}
        </div>
        
        ${validationHtml}
      </div>
    </div>
  `;
  
  const footerHtml = generateExportFooter(config);
  
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Fiche Activité PTA - ${activity.name}</title>
        ${getBaseExportStyles(config, "portrait")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </body>
    </html>
  `;
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Export PDF de la fiche de suivi d'activité
export const exportFicheSuiviToPDF = (fiche: FicheSuivi, workflow?: Workflow) => {
  const config = getExportHeaderConfig();
  const progressPercentage = workflow 
    ? calculateWorkflowProgress(fiche.currentStepId, workflow) 
    : fiche.progressPercentage || 0;
  
  const budgetExecution = fiche.budgetPrevu > 0 
    ? Math.round((fiche.depensesCumulees / fiche.budgetPrevu) * 100) 
    : 0;
  
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    brouillon: { bg: "#f1f5f9", text: "#475569", label: "Brouillon" },
    soumis: { bg: "#dbeafe", text: "#1e40af", label: "Soumis" },
    valide: { bg: "#fef3c7", text: "#92400e", label: "Validé" },
    approuve: { bg: "#dcfce7", text: "#166534", label: "Approuvé" },
  };
  const statusInfo = statusColors[fiche.status] || statusColors.brouillon;
  
  const additionalStyles = `
    <style>
      .fiche-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        margin-bottom: 15px;
      }
      .fiche-header {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -15)} 100%);
        padding: 15px 20px;
        color: white;
      }
      .fiche-meta {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .fiche-code {
        font-family: monospace;
        font-size: 12px;
        background: rgba(255,255,255,0.2);
        padding: 3px 10px;
        border-radius: 4px;
      }
      .fiche-status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .fiche-title {
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 4px 0;
      }
      .fiche-subtitle {
        font-size: 11px;
        opacity: 0.9;
      }
      .fiche-body { padding: 15px 20px; }
      
      .progress-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      }
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .progress-label { font-size: 10px; font-weight: 600; color: ${config.primaryColor}; text-transform: uppercase; }
      .progress-value { font-size: 18px; font-weight: bold; color: ${config.primaryColor}; }
      .progress-bar {
        height: 12px;
        background: #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 10px;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, 20)} 100%);
        border-radius: 6px;
        transition: width 0.3s;
      }
      
      .workflow-steps {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        align-items: center;
      }
      .workflow-step {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 9px;
        border: 1px solid;
      }
      .workflow-step.completed { background: #dcfce7; border-color: #86efac; color: #166534; }
      .workflow-step.current { background: ${config.primaryColor}; color: white; border-color: ${config.primaryColor}; }
      .workflow-step.pending { background: #f1f5f9; border-color: #cbd5e1; color: #64748b; }
      .workflow-arrow { color: #94a3b8; font-size: 10px; }
      
      .budget-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 15px;
      }
      .budget-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 15px;
      }
      .budget-card.execution {
        background: linear-gradient(135deg, ${config.primaryColor}08 0%, ${config.primaryColor}15 100%);
        border-color: ${config.primaryColor}30;
      }
      .budget-card-label { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
      .budget-card-value { font-size: 16px; font-weight: bold; color: #1e293b; }
      .budget-card-value.primary { color: ${config.primaryColor}; }
      .budget-card-bar {
        margin-top: 8px;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }
      .budget-card-bar-fill { height: 100%; border-radius: 3px; }
      
      .section {
        margin-bottom: 15px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
      }
      .section-header {
        background: linear-gradient(90deg, ${config.primaryColor}15 0%, transparent 100%);
        padding: 8px 12px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .section-icon { font-size: 12px; }
      .section-title { font-size: 10px; font-weight: 600; color: ${config.primaryColor}; text-transform: uppercase; }
      .section-badge { font-size: 9px; background: ${config.primaryColor}; color: white; padding: 2px 8px; border-radius: 10px; margin-left: auto; }
      .section-body { padding: 12px; }
      
      .livrable-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 8px;
      }
      .livrable-item:last-child { margin-bottom: 0; }
      .livrable-info { flex: 1; }
      .livrable-name { font-size: 11px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
      .livrable-progress {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .livrable-bar {
        flex: 1;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }
      .livrable-bar-fill { height: 100%; background: ${config.primaryColor}; border-radius: 3px; }
      .livrable-pct { font-size: 10px; font-weight: 600; color: #64748b; min-width: 35px; text-align: right; }
      .livrable-values {
        text-align: right;
        min-width: 100px;
      }
      .livrable-current { font-size: 12px; font-weight: bold; color: ${config.primaryColor}; }
      .livrable-target { font-size: 9px; color: #64748b; }
      
      .observations-text {
        font-size: 10px;
        line-height: 1.6;
        color: #374151;
        white-space: pre-wrap;
      }
      
      .points-critiques-item {
        padding: 10px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 8px;
        border-left: 4px solid;
      }
      .points-critiques-item.info { border-left-color: #3b82f6; }
      .points-critiques-item.attention { border-left-color: #f59e0b; }
      .points-critiques-item.critique { border-left-color: #ef4444; }
      .pc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      .pc-title { font-size: 11px; font-weight: 600; color: #1e293b; }
      .pc-badges { display: flex; gap: 5px; }
      .pc-badge { font-size: 8px; padding: 2px 6px; border-radius: 3px; font-weight: 500; }
      .pc-badge.info { background: #dbeafe; color: #1e40af; }
      .pc-badge.attention { background: #fef3c7; color: #92400e; }
      .pc-badge.critique { background: #fee2e2; color: #991b1b; }
      .pc-badge.ouvert { background: #fef3c7; color: #92400e; }
      .pc-badge.en_cours { background: #dbeafe; color: #1e40af; }
      .pc-badge.resolu { background: #dcfce7; color: #166534; }
      .pc-description { font-size: 9px; color: #64748b; }
      
      .action-item {
        padding: 10px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 8px;
      }
      .action-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      .action-title { font-size: 11px; font-weight: 600; color: #1e293b; }
      .action-badges { display: flex; gap: 5px; }
      .action-badge { font-size: 8px; padding: 2px 6px; border-radius: 3px; font-weight: 500; }
      .action-badge.basse { background: #f1f5f9; color: #475569; }
      .action-badge.normale { background: #dbeafe; color: #1e40af; }
      .action-badge.haute { background: #fef3c7; color: #92400e; }
      .action-badge.urgente { background: #fee2e2; color: #991b1b; }
      .action-badge.a_faire { background: #f1f5f9; color: #475569; }
      .action-badge.en_cours { background: #dbeafe; color: #1e40af; }
      .action-badge.termine { background: #dcfce7; color: #166534; }
      .action-badge.annule { background: #f1f5f9; color: #94a3b8; }
      .action-meta { font-size: 9px; color: #64748b; display: flex; gap: 15px; }
      
      .history-section {
        background: #f1f5f9;
        border-radius: 6px;
        padding: 12px;
        font-size: 9px;
        color: #475569;
      }
      .history-title { font-weight: 600; margin-bottom: 8px; color: #1e293b; }
      .history-item { margin-bottom: 4px; }
      .history-label { color: #64748b; }
    </style>
  `;
  
  const headerHtml = generateExportHeader(
    config,
    "Fiche de Suivi d'Activité",
    `${fiche.projectName}`
  );
  
  // Workflow steps
  let workflowHtml = "";
  if (workflow) {
    const currentStep = workflow.steps.find(s => s.id === fiche.currentStepId);
    const currentOrder = currentStep?.order || 0;
    
    workflowHtml = `
      <div class="workflow-steps">
        ${workflow.steps.map((step, idx) => {
          let status = "pending";
          if (step.order < currentOrder) status = "completed";
          else if (step.order === currentOrder) status = "current";
          
          return `
            ${idx > 0 ? '<span class="workflow-arrow">→</span>' : ''}
            <span class="workflow-step ${status}">
              ${status === "completed" ? "✓ " : ""}${step.name}
            </span>
          `;
        }).join("")}
      </div>
    `;
  }
  
  // Livrables
  const livrablesHtml = fiche.livrables.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-icon">📦</span>
        <span class="section-title">Réalisations sur les Livrables</span>
        <span class="section-badge">${fiche.livrables.length}</span>
      </div>
      <div class="section-body">
        ${fiche.livrables.map(l => {
          const pct = l.targetValue > 0 ? Math.round((l.currentValue / l.targetValue) * 100) : 0;
          return `
            <div class="livrable-item">
              <div class="livrable-info">
                <div class="livrable-name">${l.livrableName}</div>
                <div class="livrable-progress">
                  <div class="livrable-bar"><div class="livrable-bar-fill" style="width: ${Math.min(pct, 100)}%;"></div></div>
                  <span class="livrable-pct">${pct}%</span>
                </div>
              </div>
              <div class="livrable-values">
                <div class="livrable-current">${formatMontant(l.currentValue)} ${l.unit}</div>
                <div class="livrable-target">Cible: ${formatMontant(l.targetValue)}</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  ` : "";
  
  // Points critiques
  const pointsCritiquesHtml = fiche.pointsCritiques && fiche.pointsCritiques.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-icon">⚠️</span>
        <span class="section-title">Points Critiques</span>
        <span class="section-badge">${fiche.pointsCritiques.length}</span>
      </div>
      <div class="section-body">
        ${fiche.pointsCritiques.map(pc => `
          <div class="points-critiques-item ${pc.niveau}">
            <div class="pc-header">
              <span class="pc-title">${pc.titre}</span>
              <div class="pc-badges">
                <span class="pc-badge ${pc.niveau}">${pc.niveau === 'info' ? 'Information' : pc.niveau === 'attention' ? 'Attention' : 'Critique'}</span>
                <span class="pc-badge ${pc.statut}">${pc.statut === 'ouvert' ? 'Ouvert' : pc.statut === 'en_cours' ? 'En cours' : 'Résolu'}</span>
              </div>
            </div>
            ${pc.description ? `<div class="pc-description">${pc.description}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";
  
  // Actions de suivi
  const actionsSuiviHtml = fiche.actionsSuivi && fiche.actionsSuivi.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <span class="section-icon">📋</span>
        <span class="section-title">Actions de Suivi</span>
        <span class="section-badge">${fiche.actionsSuivi.length}</span>
      </div>
      <div class="section-body">
        ${fiche.actionsSuivi.map(a => `
          <div class="action-item">
            <div class="action-header">
              <span class="action-title">${a.titre}</span>
              <div class="action-badges">
                <span class="action-badge ${a.priorite}">${a.priorite === 'basse' ? 'Basse' : a.priorite === 'normale' ? 'Normale' : a.priorite === 'haute' ? 'Haute' : 'Urgente'}</span>
                <span class="action-badge ${a.statut}">${a.statut === 'a_faire' ? 'À faire' : a.statut === 'en_cours' ? 'En cours' : a.statut === 'termine' ? 'Terminé' : 'Annulé'}</span>
              </div>
            </div>
            <div class="action-meta">
              <span>👤 ${a.responsable}</span>
              <span>📅 Échéance: ${format(new Date(a.echeance), "dd/MM/yyyy", { locale: fr })}</span>
            </div>
            ${a.description ? `<div class="pc-description" style="margin-top: 6px;">${a.description}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";
  
  // Historique
  const historyHtml = (fiche.submittedAt || fiche.validatedAt || fiche.approvedAt) ? `
    <div class="history-section">
      <div class="history-title">Historique de validation</div>
      ${fiche.submittedAt ? `<div class="history-item"><span class="history-label">Soumis le:</span> ${format(new Date(fiche.submittedAt), "dd/MM/yyyy HH:mm")} ${fiche.submittedBy ? `par ${fiche.submittedBy}` : ""}</div>` : ""}
      ${fiche.validatedAt ? `<div class="history-item"><span class="history-label">Validé le:</span> ${format(new Date(fiche.validatedAt), "dd/MM/yyyy HH:mm")} ${fiche.validatedBy ? `par ${fiche.validatedBy}` : ""}</div>` : ""}
      ${fiche.approvedAt ? `<div class="history-item"><span class="history-label">Approuvé le:</span> ${format(new Date(fiche.approvedAt), "dd/MM/yyyy HH:mm")} ${fiche.approvedBy ? `par ${fiche.approvedBy}` : ""}</div>` : ""}
    </div>
  ` : "";
  
  const bodyHtml = `
    <div class="fiche-card">
      <div class="fiche-header">
        <div class="fiche-meta">
          <span class="fiche-code">${fiche.code}</span>
          <span class="fiche-status" style="background: ${statusInfo.bg}; color: ${statusInfo.text};">${statusInfo.label}</span>
        </div>
        <h2 class="fiche-title">${fiche.activityName}</h2>
        <div class="fiche-subtitle">📅 Date de collecte: ${format(new Date(fiche.dateCollecte), "dd MMMM yyyy", { locale: fr })}</div>
      </div>
      
      <div class="fiche-body">
        <!-- Progression -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">État d'avancement</span>
            <span class="progress-value">${progressPercentage}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
          </div>
          ${workflowHtml}
        </div>
        
        <!-- Budget -->
        <div class="budget-grid">
          <div class="budget-card">
            <div class="budget-card-label">Budget prévu</div>
            <div class="budget-card-value">${formatBudget(fiche.budgetPrevu)}</div>
          </div>
          <div class="budget-card execution">
            <div class="budget-card-label">Dépenses cumulées</div>
            <div class="budget-card-value primary">${formatBudget(fiche.depensesCumulees)}</div>
            <div class="budget-card-bar">
              <div class="budget-card-bar-fill" style="width: ${Math.min(budgetExecution, 100)}%; background: ${budgetExecution > 100 ? '#ef4444' : config.primaryColor};"></div>
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Taux d'exécution: ${budgetExecution}%</div>
          </div>
        </div>
        
        ${livrablesHtml}
        
        ${fiche.observations ? `
          <div class="section">
            <div class="section-header">
              <span class="section-icon">💬</span>
              <span class="section-title">Observations</span>
            </div>
            <div class="section-body">
              <p class="observations-text">${fiche.observations}</p>
            </div>
          </div>
        ` : ""}
        
        ${pointsCritiquesHtml}
        ${actionsSuiviHtml}
        ${historyHtml}
      </div>
    </div>
  `;
  
  const footerHtml = generateExportFooter(config);
  
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Fiche de Suivi - ${fiche.code}</title>
        ${getBaseExportStyles(config, "portrait")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </body>
    </html>
  `;
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// ==================== INTERFACES & EXPORTS ÉLABORÉS ====================

export interface ProjectExportData {
  code: string;
  name: string;
  description?: string;
  objectives?: string;
  region: string;
  bailleur: string;
  entiteExecution?: string;
  responsible: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency?: string;
  spent?: number;
  progress: number;
  status: string;
  zonesIntervention?: { communeName?: string; departementName?: string; regionName?: string }[];
  equipeProjet?: { personnelName: string; roleName: string }[];
  activities: {
    code: string;
    name: string;
    status: string;
    budget: number;
    spent: number;
    progress: number;
    nature?: string;
    deliverables: { code: string; name: string; unit: string; targetValue: number; currentValue: number }[];
  }[];
  indicators: {
    code: string;
    name: string;
    unit: string;
    targetValue: number;
    currentValue: number;
    baselineValue: number;
  }[];
}

export interface ActivityExportData {
  code: string;
  name: string;
  description?: string;
  nature?: string;
  status: string;
  responsible: string;
  entiteExecution?: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  zonesIntervention?: { communeName?: string; departementName?: string; regionName?: string }[];
  deliverables: { code: string; name: string; unit: string; targetValue: number; currentValue: number }[];
  fichesSuivi: { code: string; date: string; period: string; status: string; author: string; activityProgress: number }[];
  projectCode: string;
  projectName: string;
}

export const exportProjetDetailToPDF = (project: ProjectExportData) => {
  const config = getExportHeaderConfig();
  
  const additionalStyles = `
    <style>
      .project-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        margin-bottom: 20px;
      }
      .project-header {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
        padding: 25px;
        color: white;
      }
      .project-header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .project-code {
        font-family: monospace;
        font-size: 12px;
        background: rgba(255,255,255,0.2);
        padding: 4px 14px;
        border-radius: 20px;
      }
      .project-status {
        padding: 4px 14px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        background: #dcfce7;
        color: #166534;
      }
      .project-title {
        font-size: 22px;
        font-weight: bold;
        margin: 0 0 12px 0;
        line-height: 1.3;
      }
      .project-tags {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .project-tag {
        background: rgba(255,255,255,0.2);
        padding: 5px 14px;
        border-radius: 20px;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .project-body { padding: 25px; background: #f8fafc; }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 25px;
      }
      .stat-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 18px;
        text-align: center;
        transition: transform 0.2s;
      }
      .stat-value {
        font-size: 22px;
        font-weight: bold;
        color: ${config.primaryColor};
        margin-bottom: 4px;
      }
      .stat-label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stat-sub {
        font-size: 9px;
        color: #94a3b8;
        margin-top: 4px;
      }
      
      .progress-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 18px;
        margin-bottom: 20px;
      }
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .progress-title {
        font-size: 12px;
        font-weight: 600;
        color: #1e293b;
      }
      .progress-value {
        font-size: 18px;
        font-weight: bold;
        color: ${config.primaryColor};
      }
      .progress-bar {
        height: 14px;
        background: #e5e7eb;
        border-radius: 7px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, 20)} 100%);
        border-radius: 7px;
      }
      
      .section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .section-header {
        background: linear-gradient(90deg, ${config.primaryColor}12 0%, transparent 100%);
        padding: 12px 18px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .section-icon {
        width: 28px;
        height: 28px;
        background: ${config.primaryColor};
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      }
      .section-title {
        font-size: 12px;
        font-weight: 600;
        color: ${config.primaryColor};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .section-badge {
        margin-left: auto;
        background: ${config.primaryColor}20;
        color: ${config.primaryColor};
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
      }
      .section-body { padding: 18px; }
      
      .text-content {
        font-size: 11px;
        line-height: 1.7;
        color: #374151;
        white-space: pre-wrap;
      }
      
      /* Team grid */
      .team-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .team-member {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .team-avatar {
        width: 36px;
        height: 36px;
        background: ${config.primaryColor}20;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${config.primaryColor};
        font-size: 14px;
        flex-shrink: 0;
      }
      .team-info {}
      .team-name { font-size: 11px; font-weight: 600; color: #1e293b; }
      .team-role { font-size: 10px; color: #64748b; }
      
      /* Zones */
      .zones-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .zone-badge {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 12px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        font-size: 10px;
        color: #475569;
      }
      
      /* Activities table */
      .activities-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .activities-table thead tr {
        background: ${config.primaryColor};
        color: white;
      }
      .activities-table th {
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .activities-table th:nth-child(4),
      .activities-table th:nth-child(5),
      .activities-table th:nth-child(6) {
        text-align: right;
      }
      .activities-table tbody tr {
        border-bottom: 1px solid #e2e8f0;
      }
      .activities-table tbody tr:nth-child(even) {
        background: #f8fafc;
      }
      .activities-table td {
        padding: 10px 12px;
        vertical-align: middle;
      }
      .activities-table td:nth-child(4),
      .activities-table td:nth-child(5),
      .activities-table td:nth-child(6) {
        text-align: right;
      }
      .activity-code {
        font-family: monospace;
        color: ${config.primaryColor};
        font-weight: 500;
      }
      .activity-name {
        color: #1e293b;
        font-weight: 500;
      }
      .activity-status {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-en_cours { background: #dbeafe; color: #1e40af; }
      .status-termine { background: #dcfce7; color: #166534; }
      .status-retard { background: #fee2e2; color: #991b1b; }
      .status-planifie { background: #f3f4f6; color: #4b5563; }
      
      .progress-mini {
        width: 60px;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        display: inline-block;
        margin-right: 6px;
        vertical-align: middle;
      }
      .progress-mini-fill {
        height: 100%;
        background: ${config.primaryColor};
        border-radius: 3px;
      }
      
      /* Indicators grid */
      .indicators-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .indicator-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 14px;
        background: #f8fafc;
      }
      .indicator-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
      }
      .indicator-code {
        font-family: monospace;
        font-size: 10px;
        color: ${config.primaryColor};
        background: ${config.primaryColor}15;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .indicator-name {
        font-size: 11px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 10px;
      }
      .indicator-values {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        text-align: center;
      }
      .indicator-value-item {}
      .indicator-value-label { font-size: 9px; color: #64748b; }
      .indicator-value-num { font-size: 12px; font-weight: bold; color: #1e293b; }
      .indicator-progress {
        margin-top: 10px;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }
      .indicator-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, ${config.primaryColor}, ${adjustColor(config.primaryColor, 20)});
        border-radius: 3px;
      }
      
      /* Info grid for header data */
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      }
      .info-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }
      .info-icon {
        width: 32px;
        height: 32px;
        background: ${config.primaryColor}15;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${config.primaryColor};
        font-size: 14px;
      }
      .info-content {}
      .info-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
      .info-value { font-size: 11px; font-weight: 600; color: #1e293b; }
      
      /* Budget breakdown */
      .budget-summary {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
        margin-bottom: 15px;
      }
      .budget-bar-container {}
      .budget-bar-label {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin-bottom: 6px;
      }
      .budget-bar-label span:first-child { color: #64748b; }
      .budget-bar-label span:last-child { font-weight: 600; color: #1e293b; }
      .budget-execution-bar {
        height: 24px;
        background: #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      }
      .budget-execution-fill {
        height: 100%;
        background: linear-gradient(90deg, ${config.primaryColor}, ${adjustColor(config.primaryColor, 15)});
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: 600;
      }
      
      .empty-state {
        text-align: center;
        padding: 30px;
        color: #94a3b8;
      }
      .empty-icon {
        font-size: 30px;
        margin-bottom: 10px;
      }
      .empty-text {
        font-size: 11px;
      }
    </style>
  `;
  
  const headerHtml = generateExportHeader(config, "Fiche Projet Détaillée", project.code);
  
  const budgetExecution = project.spent && project.budget > 0 
    ? Math.round((project.spent / project.budget) * 100)
    : 0;
  
  const totalDeliverables = project.activities.reduce((sum, a) => sum + a.deliverables.length, 0);
  
  // Build team section
  const teamHtml = project.equipeProjet && project.equipeProjet.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">👥</div>
        <span class="section-title">Équipe Projet</span>
        <span class="section-badge">${project.equipeProjet.length} membres</span>
      </div>
      <div class="section-body">
        <div class="team-grid">
          ${project.equipeProjet.map(m => `
            <div class="team-member">
              <div class="team-avatar">👤</div>
              <div class="team-info">
                <div class="team-name">${m.personnelName}</div>
                <div class="team-role">${m.roleName}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  ` : `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">👥</div>
        <span class="section-title">Équipe Projet</span>
      </div>
      <div class="section-body">
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <div class="empty-text">Aucune équipe définie</div>
        </div>
      </div>
    </div>
  `;
  
  // Build zones section
  const zonesHtml = project.zonesIntervention && project.zonesIntervention.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📍</div>
        <span class="section-title">Zones d'Intervention</span>
        <span class="section-badge">${project.zonesIntervention.length} zones</span>
      </div>
      <div class="section-body">
        <div class="zones-list">
          ${project.zonesIntervention.map(z => `
            <div class="zone-badge">
              📍 ${z.communeName || z.departementName || z.regionName}
              ${z.communeName && z.departementName ? `<span style="color: #94a3b8; font-size: 9px;">(${z.departementName})</span>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  ` : "";
  
  // Build activities section
  const activitiesHtml = project.activities.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <span class="section-title">Activités du Projet</span>
        <span class="section-badge">${project.activities.length} activités • ${totalDeliverables} livrables</span>
      </div>
      <div class="section-body" style="padding: 0;">
        <table class="activities-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Activité</th>
              <th>Statut</th>
              <th>Budget</th>
              <th>Dépensé</th>
              <th>Avancement</th>
            </tr>
          </thead>
          <tbody>
            ${project.activities.map(a => `
              <tr>
                <td><span class="activity-code">${a.code}</span></td>
                <td>
                  <span class="activity-name">${a.name}</span>
                  ${a.nature ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">${a.nature}</div>` : ""}
                </td>
                <td><span class="activity-status status-${a.status.toLowerCase().replace(/\s+/g, '_')}">${a.status}</span></td>
                <td><strong>${formatBudget(a.budget)}</strong></td>
                <td>${formatBudget(a.spent)}</td>
                <td>
                  <div class="progress-mini"><div class="progress-mini-fill" style="width: ${a.progress}%;"></div></div>
                  <span style="font-weight: 600;">${a.progress}%</span>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  ` : "";
  
  // Build indicators section
  const indicatorsHtml = project.indicators.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🎯</div>
        <span class="section-title">Indicateurs de Performance</span>
        <span class="section-badge">${project.indicators.length} indicateurs</span>
      </div>
      <div class="section-body">
        <div class="indicators-grid">
          ${project.indicators.map(i => {
            const progressPct = i.targetValue > 0 ? Math.round((i.currentValue / i.targetValue) * 100) : 0;
            return `
              <div class="indicator-card">
                <div class="indicator-header">
                  <span class="indicator-code">${i.code}</span>
                </div>
                <div class="indicator-name">${i.name}</div>
                <div class="indicator-values">
                  <div class="indicator-value-item">
                    <div class="indicator-value-label">Référence</div>
                    <div class="indicator-value-num">${formatMontant(i.baselineValue)}</div>
                  </div>
                  <div class="indicator-value-item">
                    <div class="indicator-value-label">Cible</div>
                    <div class="indicator-value-num">${formatMontant(i.targetValue)}</div>
                  </div>
                  <div class="indicator-value-item">
                    <div class="indicator-value-label">Actuel</div>
                    <div class="indicator-value-num" style="color: ${config.primaryColor};">${formatMontant(i.currentValue)}</div>
                  </div>
                </div>
                <div class="indicator-progress">
                  <div class="indicator-progress-fill" style="width: ${Math.min(progressPct, 100)}%;"></div>
                </div>
                <div style="text-align: right; font-size: 9px; margin-top: 4px; color: #64748b;">${progressPct}% • ${i.unit}</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  ` : "";
  
  const bodyHtml = `
    <div class="project-card">
      <div class="project-header">
        <div class="project-header-top">
          <span class="project-code">${project.code}</span>
          <span class="project-status">${project.status}</span>
        </div>
        <h1 class="project-title">${project.name}</h1>
        <div class="project-tags">
          <span class="project-tag">📍 ${project.region}</span>
          <span class="project-tag">🏛️ ${project.bailleur}</span>
          ${project.entiteExecution ? `<span class="project-tag">🏢 ${project.entiteExecution}</span>` : ""}
          <span class="project-tag">👤 ${project.responsible}</span>
        </div>
      </div>
      
      <div class="project-body">
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${formatBudget(project.budget)}</div>
            <div class="stat-label">Budget ${project.currency || "FCFA"}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${project.progress}%</div>
            <div class="stat-label">Avancement</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${project.activities.length}</div>
            <div class="stat-label">Activités</div>
            <div class="stat-sub">${totalDeliverables} livrables</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${project.indicators.length}</div>
            <div class="stat-label">Indicateurs</div>
          </div>
        </div>
        
        <!-- Progress & Period -->
        <div class="info-grid">
          <div class="info-item">
            <div class="info-icon">📅</div>
            <div class="info-content">
              <div class="info-label">Période d'exécution</div>
              <div class="info-value">${format(new Date(project.startDate), "dd MMM yyyy", { locale: fr })} → ${format(new Date(project.endDate), "dd MMM yyyy", { locale: fr })}</div>
            </div>
          </div>
          <div class="info-item">
            <div class="info-icon">💰</div>
            <div class="info-content">
              <div class="info-label">Exécution budgétaire</div>
              <div class="info-value">${formatBudget(project.spent || 0)} FCFA (${budgetExecution}%)</div>
            </div>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-title">Progression globale du projet</span>
            <span class="progress-value">${project.progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${project.progress}%;"></div>
          </div>
        </div>
        
        <!-- Description & Objectives -->
        ${project.description ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon">📝</div>
              <span class="section-title">Description du Projet</span>
            </div>
            <div class="section-body">
              <p class="text-content">${project.description}</p>
            </div>
          </div>
        ` : ""}
        
        ${project.objectives ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon">🎯</div>
              <span class="section-title">Objectifs</span>
            </div>
            <div class="section-body">
              <p class="text-content">${project.objectives}</p>
            </div>
          </div>
        ` : ""}
        
        ${teamHtml}
        ${zonesHtml}
        ${activitiesHtml}
        ${indicatorsHtml}
      </div>
    </div>
  `;
  
  const footerHtml = generateExportFooter(config);
  
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Fiche Projet - ${project.code}</title>
        ${getBaseExportStyles(config, "portrait")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </body>
    </html>
  `;
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const exportActiviteDetailToPDF = (activity: ActivityExportData) => {
  const config = getExportHeaderConfig();
  
  const additionalStyles = `
    <style>
      .activity-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        margin-bottom: 20px;
      }
      .activity-header {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
        padding: 25px;
        color: white;
      }
      .activity-project {
        font-size: 11px;
        background: rgba(255,255,255,0.2);
        padding: 5px 14px;
        border-radius: 20px;
        display: inline-block;
        margin-bottom: 10px;
      }
      .activity-title {
        font-size: 20px;
        font-weight: bold;
        margin: 0 0 12px 0;
        line-height: 1.3;
      }
      .activity-badges {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .activity-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
      }
      .badge-status {
        background: #dcfce7;
        color: #166534;
      }
      .badge-nature {
        background: rgba(255,255,255,0.2);
        color: white;
      }
      
      .activity-body { padding: 25px; background: #f8fafc; }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 25px;
      }
      .stat-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 18px;
        text-align: center;
      }
      .stat-value {
        font-size: 20px;
        font-weight: bold;
        color: ${config.primaryColor};
        margin-bottom: 4px;
      }
      .stat-label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
      }
      
      .info-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }
      .info-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
      }
      .info-icon {
        width: 36px;
        height: 36px;
        background: ${config.primaryColor}15;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${config.primaryColor};
        font-size: 16px;
      }
      .info-content {}
      .info-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
      .info-value { font-size: 12px; font-weight: 600; color: #1e293b; }
      
      .section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .section-header {
        background: linear-gradient(90deg, ${config.primaryColor}12 0%, transparent 100%);
        padding: 12px 18px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .section-icon {
        width: 28px;
        height: 28px;
        background: ${config.primaryColor};
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      }
      .section-title {
        font-size: 12px;
        font-weight: 600;
        color: ${config.primaryColor};
        text-transform: uppercase;
      }
      .section-badge {
        margin-left: auto;
        background: ${config.primaryColor}20;
        color: ${config.primaryColor};
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
      }
      .section-body { padding: 18px; }
      
      .text-content {
        font-size: 11px;
        line-height: 1.7;
        color: #374151;
      }
      
      /* Zones */
      .zones-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .zone-badge {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 12px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        font-size: 10px;
        color: #475569;
      }
      
      /* Deliverables */
      .deliverables-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .deliverable-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 14px;
        background: #f8fafc;
      }
      .deliverable-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .deliverable-code {
        font-family: monospace;
        font-size: 10px;
        color: ${config.primaryColor};
        background: ${config.primaryColor}15;
        padding: 2px 8px;
        border-radius: 4px;
      }
      .deliverable-name {
        font-size: 11px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
      }
      .deliverable-values {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin-bottom: 8px;
      }
      .deliverable-target { color: #64748b; }
      .deliverable-current { color: ${config.primaryColor}; font-weight: 600; }
      .deliverable-progress {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }
      .deliverable-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, ${config.primaryColor}, ${adjustColor(config.primaryColor, 20)});
        border-radius: 3px;
      }
      
      /* Fiches suivi */
      .fiches-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .fiches-table thead tr {
        background: ${config.primaryColor};
        color: white;
      }
      .fiches-table th {
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
      }
      .fiches-table tbody tr {
        border-bottom: 1px solid #e2e8f0;
      }
      .fiches-table tbody tr:nth-child(even) {
        background: #f8fafc;
      }
      .fiches-table td {
        padding: 10px 12px;
      }
      .fiche-code {
        font-family: monospace;
        color: ${config.primaryColor};
      }
      .fiche-status {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
      }
      .status-brouillon { background: #f1f5f9; color: #475569; }
      .status-soumis { background: #dbeafe; color: #1e40af; }
      .status-valide { background: #fef3c7; color: #92400e; }
      .status-approuve { background: #dcfce7; color: #166534; }
      
      .progress-mini {
        width: 50px;
        height: 5px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        display: inline-block;
        margin-right: 5px;
        vertical-align: middle;
      }
      .progress-mini-fill {
        height: 100%;
        background: ${config.primaryColor};
        border-radius: 3px;
      }
    </style>
  `;
  
  const headerHtml = generateExportHeader(config, "Fiche Activité Détaillée", activity.code);
  
  const budgetExecution = activity.budget > 0 
    ? Math.round((activity.spent / activity.budget) * 100)
    : 0;
  
  // Zones section
  const zonesHtml = activity.zonesIntervention && activity.zonesIntervention.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📍</div>
        <span class="section-title">Zones d'Intervention</span>
        <span class="section-badge">${activity.zonesIntervention.length} zones</span>
      </div>
      <div class="section-body">
        <div class="zones-list">
          ${activity.zonesIntervention.map(z => `
            <div class="zone-badge">📍 ${z.communeName || z.departementName || z.regionName}</div>
          `).join("")}
        </div>
      </div>
    </div>
  ` : "";
  
  // Deliverables section
  const deliverablesHtml = activity.deliverables.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📦</div>
        <span class="section-title">Livrables</span>
        <span class="section-badge">${activity.deliverables.length} livrables</span>
      </div>
      <div class="section-body">
        <div class="deliverables-grid">
          ${activity.deliverables.map(d => {
            const progressPct = d.targetValue > 0 ? Math.round((d.currentValue / d.targetValue) * 100) : 0;
            return `
              <div class="deliverable-card">
                <div class="deliverable-header">
                  <span class="deliverable-code">${d.code}</span>
                </div>
                <div class="deliverable-name">${d.name}</div>
                <div class="deliverable-values">
                  <span class="deliverable-target">Cible: ${formatMontant(d.targetValue)} ${d.unit}</span>
                  <span class="deliverable-current">Réalisé: ${formatMontant(d.currentValue)}</span>
                </div>
                <div class="deliverable-progress">
                  <div class="deliverable-progress-fill" style="width: ${Math.min(progressPct, 100)}%;"></div>
                </div>
                <div style="text-align: right; font-size: 9px; color: #64748b; margin-top: 4px;">${progressPct}%</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  ` : "";
  
  // Fiches suivi section
  const fichesHtml = activity.fichesSuivi.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <span class="section-title">Fiches de Suivi</span>
        <span class="section-badge">${activity.fichesSuivi.length} fiches</span>
      </div>
      <div class="section-body" style="padding: 0;">
        <table class="fiches-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Date</th>
              <th>Période</th>
              <th>Statut</th>
              <th>Auteur</th>
              <th>Avancement</th>
            </tr>
          </thead>
          <tbody>
            ${activity.fichesSuivi.map(f => `
              <tr>
                <td><span class="fiche-code">${f.code}</span></td>
                <td>${f.date}</td>
                <td>${f.period}</td>
                <td><span class="fiche-status status-${f.status.toLowerCase()}">${f.status}</span></td>
                <td>${f.author}</td>
                <td>
                  <div class="progress-mini"><div class="progress-mini-fill" style="width: ${f.activityProgress}%;"></div></div>
                  ${f.activityProgress}%
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  ` : "";
  
  const bodyHtml = `
    <div class="activity-card">
      <div class="activity-header">
        <div class="activity-project">📁 Projet: ${activity.projectName} (${activity.projectCode})</div>
        <h1 class="activity-title">${activity.name}</h1>
        <div class="activity-badges">
          <span class="activity-badge badge-status">${activity.status}</span>
          ${activity.nature ? `<span class="activity-badge badge-nature">${activity.nature}</span>` : ""}
        </div>
      </div>
      
      <div class="activity-body">
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${formatBudget(activity.budget)}</div>
            <div class="stat-label">Budget</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${activity.progress}%</div>
            <div class="stat-label">Avancement</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${activity.deliverables.length}</div>
            <div class="stat-label">Livrables</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${activity.fichesSuivi.length}</div>
            <div class="stat-label">Fiches suivi</div>
          </div>
        </div>
        
        <!-- Info row -->
        <div class="info-row">
          <div class="info-card">
            <div class="info-icon">👤</div>
            <div class="info-content">
              <div class="info-label">Responsable</div>
              <div class="info-value">${activity.responsible}</div>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">📅</div>
            <div class="info-content">
              <div class="info-label">Période</div>
              <div class="info-value">${format(new Date(activity.startDate), "dd/MM/yyyy")} → ${format(new Date(activity.endDate), "dd/MM/yyyy")}</div>
            </div>
          </div>
          ${activity.entiteExecution ? `
            <div class="info-card">
              <div class="info-icon">🏢</div>
              <div class="info-content">
                <div class="info-label">Entité d'exécution</div>
                <div class="info-value">${activity.entiteExecution}</div>
              </div>
            </div>
          ` : ""}
          <div class="info-card">
            <div class="info-icon">💰</div>
            <div class="info-content">
              <div class="info-label">Exécution budgétaire</div>
              <div class="info-value">${formatBudget(activity.spent)} FCFA (${budgetExecution}%)</div>
            </div>
          </div>
        </div>
        
        ${activity.description ? `
          <div class="section">
            <div class="section-header">
              <div class="section-icon">📝</div>
              <span class="section-title">Description</span>
            </div>
            <div class="section-body">
              <p class="text-content">${activity.description}</p>
            </div>
          </div>
        ` : ""}
        
        ${zonesHtml}
        ${deliverablesHtml}
        ${fichesHtml}
      </div>
    </div>
  `;
  
  const footerHtml = generateExportFooter(config);
  
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Fiche Activité - ${activity.code}</title>
        ${getBaseExportStyles(config, "portrait")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </body>
    </html>
  `;
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// ==================== EXPORT SUIVI ENRICHI ====================

export interface SuiviSyntheseExportData {
  dateGeneration: string;
  periode?: string;
  projectFilter?: string;
  
  // KPIs globaux
  stats: {
    totalProjets: number;
    totalActivites: number;
    totalFiches: number;
    avancementMoyen: number;
    tauxExecutionBudgetaire: number;
    budgetTotal: number;
    depensesCumulees: number;
  };
  
  // Répartition par statut
  repartitionStatut: {
    status: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  
  // Avancement par projet avec trimestres
  avancementParProjet: {
    projectId: string;
    projectName: string;
    nbActivites: number;
    avancementMoyen: number;
    budgetPrevu: number;
    depensesCumulees: number;
    tauxExecution: number;
    nbFiches: number;
    nbBrouillons: number;
    nbSoumis: number;
    nbValides: number;
    nbApprouves: number;
    // Performances trimestrielles
    t1?: number | null;
    t2?: number | null;
    t3?: number | null;
    t4?: number | null;
  }[];
  
  // Performances trimestrielles globales
  performancesTrimestres?: {
    t1: { avancement: number | null; budget: number; depenses: number; nbFiches: number };
    t2: { avancement: number | null; budget: number; depenses: number; nbFiches: number };
    t3: { avancement: number | null; budget: number; depenses: number; nbFiches: number };
    t4: { avancement: number | null; budget: number; depenses: number; nbFiches: number };
  };
  
  // Détail des fiches
  fiches: {
    code: string;
    projectName: string;
    activityName: string;
    responsable: string;
    dateCollecte: string;
    workflowName?: string;
    currentStepName?: string;
    progressPercentage: number;
    budgetPrevu: number;
    depensesCumulees: number;
    tauxExecution: number;
    status: string;
    statusLabel: string;
    nbLivrables: number;
    tauxLivrables: number;
    nbPointsCritiques: number;
    nbActionsSuivi: number;
  }[];
  
  // Alertes et points d'attention
  alertes: {
    type: 'retard' | 'depassement' | 'bloque' | 'critique';
    label: string;
    ficheCode: string;
    activityName: string;
    projectName: string;
    details: string;
  }[];
  
  // Top/Bottom performers
  topPerformers: { activityName: string; projectName: string; progress: number }[];
  bottomPerformers: { activityName: string; projectName: string; progress: number }[];
}

export interface FicheActiviteEnrichieExportData {
  // Fiche de base
  code: string;
  dateCollecte: string;
  projectId: string;
  projectName: string;
  activityId: string;
  activityName: string;
  activityDescription?: string;
  responsable: string;
  entiteExecution?: string;
  nature?: string;
  
  // Workflow
  workflowId?: string;
  workflowName?: string;
  workflowSteps?: { id: string; name: string; color: string; order: number; status: 'completed' | 'current' | 'pending' }[];
  currentStepId?: string;
  currentStepName?: string;
  progressPercentage: number;
  
  // Performances trimestrielles
  performancesTrimestres?: {
    t1: number | null;
    t2: number | null;
    t3: number | null;
    t4: number | null;
  };
  
  // Budget
  budgetPrevu: number;
  depensesCumulees: number;
  tauxExecution: number;
  
  // Comparaison avec période précédente
  evolutionProgress?: number;
  evolutionDepenses?: number;
  
  // Livrables détaillés
  livrables: {
    id: string;
    name: string;
    unit: string;
    targetValue: number;
    currentValue: number;
    previousValue?: number;
    progressPct: number;
    evolution?: number;
  }[];
  
  // Points critiques
  pointsCritiques: {
    id: string;
    titre: string;
    description?: string;
    niveau: string;
    niveauLabel: string;
    statut: string;
    statutLabel: string;
    dateIdentification: string;
    dateResolution?: string;
  }[];
  
  // Actions de suivi
  actionsSuivi: {
    id: string;
    titre: string;
    description?: string;
    responsable: string;
    echeance: string;
    priorite: string;
    prioriteLabel: string;
    statut: string;
    statutLabel: string;
  }[];
  
  // Statut validation
  status: string;
  statusLabel: string;
  observations?: string;
  
  // Historique
  createdAt: string;
  submittedAt?: string;
  submittedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  
  // Données projet contextuelles
  projectBudgetTotal?: number;
  projectProgress?: number;
  activityStartDate?: string;
  activityEndDate?: string;
  
  // Budget prévisionnel par trimestre (du PTA)
  activityBudgetByQuarter?: {
    t1: number;
    t2: number;
    t3: number;
    t4: number;
  };
}

// Export PDF enrichi d'une fiche activité avec performances détaillées
export const exportFicheActiviteEnrichieToPDF = (data: FicheActiviteEnrichieExportData) => {
  const config = getExportHeaderConfig();
  
  const statusColors: Record<string, { bg: string; text: string }> = {
    brouillon: { bg: "#f1f5f9", text: "#475569" },
    soumis: { bg: "#dbeafe", text: "#1e40af" },
    valide: { bg: "#fef3c7", text: "#92400e" },
    approuve: { bg: "#dcfce7", text: "#166534" },
  };
  const statusInfo = statusColors[data.status] || statusColors.brouillon;
  
  const additionalStyles = `
    <style>
      .fiche-enrichie {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        margin-bottom: 20px;
      }
      .fiche-header {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
        padding: 25px;
        color: white;
      }
      .fiche-header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .fiche-code {
        font-family: monospace;
        font-size: 12px;
        background: rgba(255,255,255,0.2);
        padding: 4px 14px;
        border-radius: 20px;
      }
      .fiche-status {
        padding: 5px 16px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .fiche-title {
        font-size: 20px;
        font-weight: bold;
        margin: 0 0 8px 0;
      }
      .fiche-subtitle {
        font-size: 12px;
        opacity: 0.9;
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }
      .fiche-subtitle span { display: flex; align-items: center; gap: 5px; }
      
      .fiche-body { padding: 25px; background: #f8fafc; }
      
      /* KPIs */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 25px;
      }
      .kpi-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 18px;
        text-align: center;
        position: relative;
      }
      .kpi-card.highlight {
        border: 2px solid ${config.primaryColor};
        background: linear-gradient(135deg, ${config.primaryColor}05 0%, ${config.primaryColor}10 100%);
      }
      .kpi-value {
        font-size: 24px;
        font-weight: bold;
        color: ${config.primaryColor};
      }
      .kpi-value.warning { color: #f59e0b; }
      .kpi-value.danger { color: #ef4444; }
      .kpi-value.success { color: #22c55e; }
      .kpi-label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }
      .kpi-evolution {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .kpi-evolution.positive { background: #dcfce7; color: #166534; }
      .kpi-evolution.negative { background: #fee2e2; color: #991b1b; }
      
      /* Progress section */
      .progress-section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
      }
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .progress-title { font-size: 12px; font-weight: 600; color: #1e293b; }
      .progress-value { font-size: 22px; font-weight: bold; color: ${config.primaryColor}; }
      .progress-bar {
        height: 16px;
        background: #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 15px;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, 20)} 100%);
        border-radius: 8px;
        position: relative;
      }
      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.2) 50%);
        background-size: 20px 20px;
      }
      
      /* Workflow steps */
      .workflow-container {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        padding: 15px;
        background: #f8fafc;
        border-radius: 8px;
      }
      .workflow-step {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 500;
        border: 1px solid;
      }
      .workflow-step.completed { background: #dcfce7; border-color: #86efac; color: #166534; }
      .workflow-step.current { background: ${config.primaryColor}; border-color: ${config.primaryColor}; color: white; font-weight: 600; }
      .workflow-step.pending { background: #f1f5f9; border-color: #cbd5e1; color: #64748b; }
      .workflow-arrow { color: #94a3b8; font-size: 12px; }
      
      /* Section */
      .section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .section-header {
        background: linear-gradient(90deg, ${config.primaryColor}12 0%, transparent 100%);
        padding: 14px 18px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .section-icon {
        width: 32px;
        height: 32px;
        background: ${config.primaryColor};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      }
      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: ${config.primaryColor};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .section-badge {
        margin-left: auto;
        background: ${config.primaryColor}20;
        color: ${config.primaryColor};
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
      }
      .section-body { padding: 18px; }
      
      /* Livrables */
      .livrable-row {
        display: grid;
        grid-template-columns: 1fr 120px 80px 60px;
        gap: 15px;
        align-items: center;
        padding: 14px;
        background: #f8fafc;
        border-radius: 8px;
        margin-bottom: 10px;
        border: 1px solid #e2e8f0;
      }
      .livrable-row:last-child { margin-bottom: 0; }
      .livrable-info { }
      .livrable-name { font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
      .livrable-unit { font-size: 10px; color: #64748b; }
      .livrable-values {
        text-align: center;
      }
      .livrable-current {
        font-size: 14px;
        font-weight: bold;
        color: ${config.primaryColor};
      }
      .livrable-target {
        font-size: 10px;
        color: #64748b;
      }
      .livrable-progress {
        width: 80px;
      }
      .livrable-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 4px;
      }
      .livrable-bar-fill {
        height: 100%;
        background: ${config.primaryColor};
        border-radius: 4px;
      }
      .livrable-pct {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-align: center;
      }
      .livrable-evolution {
        font-size: 10px;
        font-weight: 600;
        text-align: center;
      }
      .livrable-evolution.positive { color: #16a34a; }
      .livrable-evolution.negative { color: #dc2626; }
      
      /* Points critiques */
      .point-critique {
        padding: 14px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 10px;
        border-left: 4px solid;
      }
      .point-critique.info { border-left-color: #3b82f6; }
      .point-critique.attention { border-left-color: #f59e0b; }
      .point-critique.critique { border-left-color: #ef4444; }
      .pc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
      .pc-title { font-size: 12px; font-weight: 600; color: #1e293b; }
      .pc-badges { display: flex; gap: 6px; }
      .pc-badge {
        font-size: 9px;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
      }
      .pc-badge.info { background: #dbeafe; color: #1e40af; }
      .pc-badge.attention { background: #fef3c7; color: #92400e; }
      .pc-badge.critique { background: #fee2e2; color: #991b1b; }
      .pc-badge.ouvert { background: #fef3c7; color: #92400e; }
      .pc-badge.en_cours { background: #dbeafe; color: #1e40af; }
      .pc-badge.resolu { background: #dcfce7; color: #166534; }
      .pc-description { font-size: 11px; color: #64748b; line-height: 1.5; }
      .pc-meta { font-size: 10px; color: #94a3b8; margin-top: 8px; }
      
      /* Actions */
      .action-item {
        display: grid;
        grid-template-columns: 1fr 100px 100px 80px;
        gap: 12px;
        align-items: center;
        padding: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 8px;
      }
      .action-info { }
      .action-title { font-size: 11px; font-weight: 600; color: #1e293b; }
      .action-responsable { font-size: 10px; color: #64748b; margin-top: 2px; }
      .action-echeance { font-size: 10px; color: #64748b; text-align: center; }
      .action-priorite, .action-statut {
        font-size: 9px;
        padding: 4px 10px;
        border-radius: 4px;
        font-weight: 600;
        text-align: center;
      }
      .priorite-basse { background: #f1f5f9; color: #475569; }
      .priorite-normale { background: #dbeafe; color: #1e40af; }
      .priorite-haute { background: #fef3c7; color: #92400e; }
      .priorite-urgente { background: #fee2e2; color: #991b1b; }
      .statut-a_faire { background: #f1f5f9; color: #475569; }
      .statut-en_cours { background: #dbeafe; color: #1e40af; }
      .statut-termine { background: #dcfce7; color: #166534; }
      .statut-annule { background: #f1f5f9; color: #94a3b8; text-decoration: line-through; }
      
      /* Observations */
      .observations-box {
        background: #fffbeb;
        border: 1px solid #fcd34d;
        border-radius: 8px;
        padding: 15px;
      }
      .observations-text {
        font-size: 11px;
        line-height: 1.7;
        color: #78350f;
        white-space: pre-wrap;
      }
      
      /* Historique */
      .history-timeline {
        position: relative;
        padding-left: 25px;
      }
      .history-timeline::before {
        content: '';
        position: absolute;
        left: 8px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e2e8f0;
      }
      .history-item {
        position: relative;
        padding-bottom: 12px;
      }
      .history-item::before {
        content: '';
        position: absolute;
        left: -21px;
        top: 4px;
        width: 10px;
        height: 10px;
        background: ${config.primaryColor};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 0 2px ${config.primaryColor}30;
      }
      .history-date { font-size: 11px; font-weight: 600; color: #1e293b; }
      .history-action { font-size: 10px; color: #64748b; }
      
      /* Context info */
      .context-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .context-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }
      .context-icon {
        width: 36px;
        height: 36px;
        background: ${config.primaryColor}15;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      .context-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
      .context-value { font-size: 12px; font-weight: 600; color: #1e293b; }
    </style>
  `;
  
  const headerHtml = generateExportHeader(
    config,
    "Fiche de Suivi Activité - Rapport Détaillé",
    `Collecte du ${format(parseISO(data.dateCollecte), "dd MMMM yyyy", { locale: fr })}`
  );
  
  // Workflow steps HTML
  let workflowHtml = "";
  if (data.workflowSteps && data.workflowSteps.length > 0) {
    workflowHtml = `
      <div class="workflow-container">
        ${data.workflowSteps.map((step, idx) => `
          ${idx > 0 ? '<span class="workflow-arrow">→</span>' : ''}
          <span class="workflow-step ${step.status}">
            ${step.status === "completed" ? "✓ " : ""}${step.name}
          </span>
        `).join("")}
      </div>
    `;
  }
  
  // Livrables HTML
  const livrablesHtml = data.livrables.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📦</div>
        <span class="section-title">Réalisations sur les Livrables</span>
        <span class="section-badge">${data.livrables.length} livrables</span>
      </div>
      <div class="section-body">
        ${data.livrables.map(l => `
          <div class="livrable-row">
            <div class="livrable-info">
              <div class="livrable-name">${l.name}</div>
              <div class="livrable-unit">${l.unit}</div>
            </div>
            <div class="livrable-values">
              <div class="livrable-current">${formatMontant(l.currentValue)}</div>
              <div class="livrable-target">/ ${formatMontant(l.targetValue)} ${l.unit}</div>
            </div>
            <div class="livrable-progress">
              <div class="livrable-bar"><div class="livrable-bar-fill" style="width: ${Math.min(l.progressPct, 100)}%;"></div></div>
              <div class="livrable-pct">${l.progressPct}%</div>
            </div>
            ${l.evolution !== undefined ? `
              <div class="livrable-evolution ${l.evolution >= 0 ? 'positive' : 'negative'}">
                ${l.evolution >= 0 ? '+' : ''}${l.evolution}%
              </div>
            ` : '<div></div>'}
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";
  
  // Points critiques HTML
  const pointsCritiquesHtml = data.pointsCritiques.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">⚠️</div>
        <span class="section-title">Points Critiques</span>
        <span class="section-badge">${data.pointsCritiques.length} points</span>
      </div>
      <div class="section-body">
        ${data.pointsCritiques.map(pc => `
          <div class="point-critique ${pc.niveau}">
            <div class="pc-header">
              <span class="pc-title">${pc.titre}</span>
              <div class="pc-badges">
                <span class="pc-badge ${pc.niveau}">${pc.niveauLabel}</span>
                <span class="pc-badge ${pc.statut}">${pc.statutLabel}</span>
              </div>
            </div>
            ${pc.description ? `<div class="pc-description">${pc.description}</div>` : ""}
            <div class="pc-meta">
              📅 Identifié le ${format(parseISO(pc.dateIdentification), "dd/MM/yyyy")}
              ${pc.dateResolution ? ` • Résolu le ${format(parseISO(pc.dateResolution), "dd/MM/yyyy")}` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";
  
  // Actions de suivi HTML
  const actionsSuiviHtml = data.actionsSuivi.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <span class="section-title">Actions de Suivi</span>
        <span class="section-badge">${data.actionsSuivi.length} actions</span>
      </div>
      <div class="section-body">
        ${data.actionsSuivi.map(a => `
          <div class="action-item">
            <div class="action-info">
              <div class="action-title">${a.titre}</div>
              <div class="action-responsable">👤 ${a.responsable}</div>
            </div>
            <div class="action-echeance">📅 ${format(parseISO(a.echeance), "dd/MM/yyyy")}</div>
            <div class="action-priorite priorite-${a.priorite}">${a.prioriteLabel}</div>
            <div class="action-statut statut-${a.statut}">${a.statutLabel}</div>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";
  
  // Observations HTML
  const observationsHtml = data.observations ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💬</div>
        <span class="section-title">Observations</span>
      </div>
      <div class="section-body">
        <div class="observations-box">
          <div class="observations-text">${data.observations}</div>
        </div>
      </div>
    </div>
  ` : "";
  
  // Historique HTML
  const historyItems = [];
  if (data.createdAt) historyItems.push({ date: data.createdAt, action: "Fiche créée" });
  if (data.submittedAt) historyItems.push({ date: data.submittedAt, action: `Soumise${data.submittedBy ? ` par ${data.submittedBy}` : ""}` });
  if (data.validatedAt) historyItems.push({ date: data.validatedAt, action: `Validée${data.validatedBy ? ` par ${data.validatedBy}` : ""}` });
  if (data.approvedAt) historyItems.push({ date: data.approvedAt, action: `Approuvée${data.approvedBy ? ` par ${data.approvedBy}` : ""}` });
  
  const historyHtml = historyItems.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🕐</div>
        <span class="section-title">Historique de Validation</span>
      </div>
      <div class="section-body">
        <div class="history-timeline">
          ${historyItems.map(h => `
            <div class="history-item">
              <div class="history-date">${format(parseISO(h.date), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</div>
              <div class="history-action">${h.action}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  ` : "";
  
  const bodyHtml = `
    <div class="fiche-enrichie">
      <div class="fiche-header">
        <div class="fiche-header-top">
          <span class="fiche-code">${data.code}</span>
          <span class="fiche-status" style="background: ${statusInfo.bg}; color: ${statusInfo.text};">${data.statusLabel}</span>
        </div>
        <h1 class="fiche-title">${data.activityName}</h1>
        <div class="fiche-subtitle">
          <span>📁 ${data.projectName}</span>
          <span>👤 ${data.responsable}</span>
          ${data.workflowName ? `<span>🔄 ${data.workflowName}</span>` : ""}
          ${data.nature ? `<span>🏷️ ${data.nature}</span>` : ""}
        </div>
      </div>
      
      <div class="fiche-body">
        <!-- KPIs -->
        <div class="kpi-grid">
          <div class="kpi-card highlight">
            <div class="kpi-value">${data.progressPercentage}%</div>
            <div class="kpi-label">Avancement</div>
            ${data.evolutionProgress !== undefined ? `
              <span class="kpi-evolution ${data.evolutionProgress >= 0 ? 'positive' : 'negative'}">
                ${data.evolutionProgress >= 0 ? '+' : ''}${data.evolutionProgress}%
              </span>
            ` : ""}
          </div>
          <div class="kpi-card">
            <div class="kpi-value ${data.tauxExecution > 100 ? 'danger' : data.tauxExecution > 80 ? 'warning' : ''}">${data.tauxExecution}%</div>
            <div class="kpi-label">Taux d'exécution</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${formatBudget(data.depensesCumulees)}</div>
            <div class="kpi-label">Dépenses cumulées</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${formatBudget(data.budgetPrevu)}</div>
            <div class="kpi-label">Budget prévu</div>
          </div>
        </div>
        
        <!-- Dépenses trimestrielles -->
        ${data.performancesTrimestres ? `
        <div class="section" style="margin-bottom: 20px;">
          <div class="section-header">
            <div class="section-icon">💰</div>
            <span class="section-title">Dépenses par Trimestre</span>
          </div>
          <div class="section-body">
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
              ${(['T1', 'T2', 'T3', 'T4'] as const).map((t, idx) => {
                const key = t.toLowerCase() as 't1' | 't2' | 't3' | 't4';
                const val = data.performancesTrimestres?.[key];
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                return `
                <div style="text-align: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white;">
                  <div style="font-size: 10px; font-weight: 600; color: ${colors[idx]}; margin-bottom: 6px;">${t}</div>
                  <div style="font-size: 14px; font-weight: bold; color: #1e293b; font-family: monospace;">${val !== null && val !== undefined ? formatBudget(val) : '-'}</div>
                </div>
                `;
              }).join('')}
              <div style="text-align: center; padding: 12px; border: 2px solid ${config.primaryColor}30; border-radius: 8px; background: ${config.primaryColor}08;">
                <div style="font-size: 10px; font-weight: 600; color: ${config.primaryColor}; margin-bottom: 6px;">CUMULÉ</div>
                <div style="font-size: 14px; font-weight: bold; color: ${config.primaryColor}; font-family: monospace;">${formatBudget(data.depensesCumulees)}</div>
              </div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Budget prévisionnel par trimestre (PTA) -->
        ${data.activityBudgetByQuarter ? `
        <div class="section" style="margin-bottom: 20px;">
          <div class="section-header">
            <div class="section-icon">📊</div>
            <span class="section-title">Rappel Budget Prévisionnel (PTA)</span>
          </div>
          <div class="section-body">
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
              ${(['T1', 'T2', 'T3', 'T4'] as const).map((t, idx) => {
                const key = t.toLowerCase() as 't1' | 't2' | 't3' | 't4';
                const val = data.activityBudgetByQuarter?.[key] || 0;
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                const bgColors = ['#eff6ff', '#ecfdf5', '#fffbeb', '#f5f3ff'];
                return `
                <div style="text-align: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: ${bgColors[idx]};">
                  <div style="font-size: 10px; font-weight: 600; color: ${colors[idx]}; margin-bottom: 6px;">${t} Prévu</div>
                  <div style="font-size: 13px; font-weight: bold; color: #1e293b; font-family: monospace;">${formatBudget(val)}</div>
                </div>
                `;
              }).join('')}
              <div style="text-align: center; padding: 12px; border: 2px solid #0ea5e930; border-radius: 8px; background: #f0f9ff;">
                <div style="font-size: 10px; font-weight: 600; color: #0ea5e9; margin-bottom: 6px;">TOTAL PRÉVU</div>
                <div style="font-size: 13px; font-weight: bold; color: #0284c7; font-family: monospace;">${formatBudget((data.activityBudgetByQuarter?.t1 || 0) + (data.activityBudgetByQuarter?.t2 || 0) + (data.activityBudgetByQuarter?.t3 || 0) + (data.activityBudgetByQuarter?.t4 || 0))}</div>
              </div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Progression workflow -->
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-title">État d'avancement global</span>
            <span class="progress-value">${data.progressPercentage}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${data.progressPercentage}%;"></div>
          </div>
          ${workflowHtml}
        </div>
        
        <!-- Contexte -->
        <div class="section">
          <div class="section-header">
            <div class="section-icon">ℹ️</div>
            <span class="section-title">Informations Contextuelles</span>
          </div>
          <div class="section-body">
            <div class="context-grid">
              <div class="context-item">
                <div class="context-icon">📅</div>
                <div>
                  <div class="context-label">Date de collecte</div>
                  <div class="context-value">${format(parseISO(data.dateCollecte), "dd MMMM yyyy", { locale: fr })}</div>
                </div>
              </div>
              ${data.activityStartDate && data.activityEndDate ? `
                <div class="context-item">
                  <div class="context-icon">📆</div>
                  <div>
                    <div class="context-label">Période d'activité</div>
                    <div class="context-value">${format(parseISO(data.activityStartDate), "dd/MM/yyyy")} → ${format(parseISO(data.activityEndDate), "dd/MM/yyyy")}</div>
                  </div>
                </div>
              ` : ""}
              ${data.currentStepName ? `
                <div class="context-item">
                  <div class="context-icon">🔄</div>
                  <div>
                    <div class="context-label">Étape actuelle</div>
                    <div class="context-value">${data.currentStepName}</div>
                  </div>
                </div>
              ` : ""}
              ${data.entiteExecution ? `
                <div class="context-item">
                  <div class="context-icon">🏢</div>
                  <div>
                    <div class="context-label">Entité d'exécution</div>
                    <div class="context-value">${data.entiteExecution}</div>
                  </div>
                </div>
              ` : ""}
            </div>
          </div>
        </div>
        
        ${livrablesHtml}
        ${observationsHtml}
        ${pointsCritiquesHtml}
        ${actionsSuiviHtml}
        ${historyHtml}
      </div>
    </div>
  `;
  
  const footerHtml = generateExportFooter(config);
  
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Fiche Suivi Enrichie - ${data.code}</title>
        ${getBaseExportStyles(config, "portrait")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </body>
    </html>
  `;
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Export PDF de synthèse globale du suivi
export const exportSuiviSyntheseToPDF = (data: SuiviSyntheseExportData) => {
  const config = getExportHeaderConfig();
  
  const additionalStyles = `
    <style>
      /* Container */
      .synthese-container {
        background: #f8fafc;
      }
      
      /* KPI Cards */
      .kpi-section {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
        border-radius: 12px;
        padding: 25px;
        margin-bottom: 25px;
        color: white;
      }
      .kpi-section-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 20px;
        opacity: 0.9;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
      }
      .kpi-card {
        background: rgba(255,255,255,0.15);
        border-radius: 10px;
        padding: 18px;
        text-align: center;
        backdrop-filter: blur(10px);
      }
      .kpi-value {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      .kpi-label {
        font-size: 10px;
        opacity: 0.85;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Section */
      .section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .section-header {
        background: linear-gradient(90deg, ${config.primaryColor}12 0%, transparent 100%);
        padding: 14px 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .section-icon {
        width: 32px;
        height: 32px;
        background: ${config.primaryColor};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      }
      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: ${config.primaryColor};
        text-transform: uppercase;
      }
      .section-body { padding: 20px; }
      
      /* Status repartition */
      .status-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
      }
      .status-card {
        border-radius: 10px;
        padding: 18px;
        text-align: center;
        border-left: 4px solid;
      }
      .status-card.brouillon { background: #f8fafc; border-left-color: #94a3b8; }
      .status-card.soumis { background: #eff6ff; border-left-color: #3b82f6; }
      .status-card.valide { background: #fffbeb; border-left-color: #f59e0b; }
      .status-card.approuve { background: #f0fdf4; border-left-color: #22c55e; }
      .status-count { font-size: 28px; font-weight: bold; color: #1e293b; }
      .status-label { font-size: 11px; color: #64748b; margin-top: 4px; }
      .status-pct { font-size: 10px; color: #94a3b8; margin-top: 2px; }
      
      /* Project table */
      .project-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .project-table thead tr {
        background: ${config.primaryColor};
        color: white;
      }
      .project-table th {
        padding: 12px 10px;
        text-align: left;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .project-table th.right { text-align: right; }
      .project-table th.center { text-align: center; }
      .project-table tbody tr {
        border-bottom: 1px solid #e2e8f0;
      }
      .project-table tbody tr:nth-child(even) {
        background: #f8fafc;
      }
      .project-table td {
        padding: 12px 10px;
        vertical-align: middle;
      }
      .project-table td.right { text-align: right; }
      .project-table td.center { text-align: center; }
      .project-name { font-weight: 600; color: #1e293b; }
      .progress-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .progress-bar-mini {
        flex: 1;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }
      .progress-bar-mini-fill {
        height: 100%;
        background: ${config.primaryColor};
        border-radius: 4px;
      }
      .progress-pct {
        font-size: 10px;
        font-weight: 600;
        color: ${config.primaryColor};
        min-width: 35px;
        text-align: right;
      }
      .status-badges {
        display: flex;
        gap: 3px;
        justify-content: center;
      }
      .status-mini {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
      }
      .status-mini.brouillon { background: #f1f5f9; color: #475569; }
      .status-mini.soumis { background: #dbeafe; color: #1e40af; }
      .status-mini.valide { background: #fef3c7; color: #92400e; }
      .status-mini.approuve { background: #dcfce7; color: #166534; }
      
      /* Fiches detail table */
      .fiches-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9px;
      }
      .fiches-table thead tr {
        background: #f1f5f9;
        color: #475569;
      }
      .fiches-table th {
        padding: 10px 8px;
        text-align: left;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.2px;
      }
      .fiches-table tbody tr {
        border-bottom: 1px solid #f1f5f9;
      }
      .fiches-table td {
        padding: 10px 8px;
      }
      .fiche-code { font-family: monospace; color: ${config.primaryColor}; font-weight: 600; }
      .fiche-status {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 8px;
        font-weight: 600;
      }
      .fiche-status.brouillon { background: #f1f5f9; color: #475569; }
      .fiche-status.soumis { background: #dbeafe; color: #1e40af; }
      .fiche-status.valide { background: #fef3c7; color: #92400e; }
      .fiche-status.approuve { background: #dcfce7; color: #166534; }
      
      /* Alerts */
      .alerts-list { }
      .alert-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        margin-bottom: 10px;
      }
      .alert-item.warning { background: #fffbeb; border-color: #fcd34d; }
      .alert-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        background: #fee2e2;
        flex-shrink: 0;
      }
      .alert-item.warning .alert-icon { background: #fef3c7; }
      .alert-content { flex: 1; }
      .alert-title { font-size: 11px; font-weight: 600; color: #991b1b; margin-bottom: 2px; }
      .alert-item.warning .alert-title { color: #92400e; }
      .alert-meta { font-size: 9px; color: #b91c1c; }
      .alert-item.warning .alert-meta { color: #a16207; }
      .alert-details { font-size: 10px; color: #dc2626; margin-top: 4px; }
      .alert-item.warning .alert-details { color: #ca8a04; }
      
      /* Top/Bottom performers */
      .performers-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
      .performers-column { }
      .performers-title {
        font-size: 11px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .performer-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: #f8fafc;
        border-radius: 6px;
        margin-bottom: 8px;
        border: 1px solid #e2e8f0;
      }
      .performer-rank {
        width: 24px;
        height: 24px;
        background: ${config.primaryColor};
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
        flex-shrink: 0;
      }
      .performer-info { flex: 1; }
      .performer-name { font-size: 10px; font-weight: 600; color: #1e293b; }
      .performer-project { font-size: 9px; color: #64748b; }
      .performer-progress {
        font-size: 12px;
        font-weight: bold;
      }
      .performer-progress.good { color: #22c55e; }
      .performer-progress.bad { color: #ef4444; }
    </style>
  `;
  
  const headerHtml = generateExportHeader(
    config,
    "Rapport de Synthèse - Suivi des Réalisations",
    data.periode || `Généré le ${format(parseISO(data.dateGeneration), "dd MMMM yyyy", { locale: fr })}`
  );
  
  // Status repartition HTML
  const statusHtml = `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📊</div>
        <span class="section-title">Répartition par Statut de Validation</span>
      </div>
      <div class="section-body">
        <div class="status-grid">
          ${data.repartitionStatut.map(s => `
            <div class="status-card ${s.status}">
              <div class="status-count">${s.count}</div>
              <div class="status-label">${s.label}</div>
              <div class="status-pct">${s.percentage}%</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  
  // Dépenses trimestrielles globales
  const trimestresHtml = data.performancesTrimestres ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">💰</div>
        <span class="section-title">Dépenses par Trimestre</span>
      </div>
      <div class="section-body">
        <div class="status-grid">
          ${['t1', 't2', 't3', 't4'].map((t, i) => {
            const perf = data.performancesTrimestres![t as 'T1' | 't2' | 't3' | 't4'];
            const trimLabel = `T${i + 1}`;
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
            return `
              <div class="status-card" style="border-left-color: ${colors[i]};">
                <div class="status-count" style="color: ${colors[i]}; font-size: 14px; font-family: monospace;">${formatBudget(perf.depenses)}</div>
                <div class="status-label">${trimLabel} - Dépenses</div>
                <div class="status-pct">${perf.nbFiches} fiches</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  ` : "";
  
  // Projects table HTML avec dépenses trimestrielles
  const projectsHtml = data.avancementParProjet.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📁</div>
        <span class="section-title">Situation des Activités par Projet</span>
      </div>
      <div class="section-body" style="padding: 0;">
        <table class="project-table">
          <thead>
            <tr>
              <th>Projet</th>
              <th class="center">Act.</th>
              <th class="right" style="background: #3b82f6;">Dép. T1</th>
              <th class="right" style="background: #10b981;">Dép. T2</th>
              <th class="right" style="background: #f59e0b;">Dép. T3</th>
              <th class="right" style="background: #8b5cf6;">Dép. T4</th>
              <th class="right">Dép. Cumulées</th>
              <th class="right">Budget</th>
              <th class="right">Taux</th>
            </tr>
          </thead>
          <tbody>
            ${data.avancementParProjet.map(p => `
              <tr>
                <td><span class="project-name">${p.projectName}</span></td>
                <td class="center">${p.nbActivites}</td>
                <td class="right" style="font-family: monospace; font-size: 9px;">
                  ${p.t1 !== null && p.t1 !== undefined ? formatBudget(p.t1) : '-'}
                </td>
                <td class="right" style="font-family: monospace; font-size: 9px;">
                  ${p.t2 !== null && p.t2 !== undefined ? formatBudget(p.t2) : '-'}
                </td>
                <td class="right" style="font-family: monospace; font-size: 9px;">
                  ${p.t3 !== null && p.t3 !== undefined ? formatBudget(p.t3) : '-'}
                </td>
                <td class="right" style="font-family: monospace; font-size: 9px;">
                  ${p.t4 !== null && p.t4 !== undefined ? formatBudget(p.t4) : '-'}
                </td>
                <td class="right" style="font-family: monospace; font-weight: 600;">${formatBudget(p.depensesCumulees)}</td>
                <td class="right" style="font-family: monospace;">${formatBudget(p.budgetPrevu)}</td>
                <td class="right" style="font-weight: 600; color: ${p.tauxExecution >= 80 ? '#22c55e' : p.tauxExecution >= 50 ? '#f59e0b' : '#ef4444'};">${p.tauxExecution}%</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  ` : "";
  
  // Fiches detail table
  const fichesHtml = data.fiches.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <span class="section-title">Détail des Fiches de Suivi (${data.fiches.length})</span>
      </div>
      <div class="section-body" style="padding: 0;">
        <table class="fiches-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Activité</th>
              <th>Projet</th>
              <th>Date</th>
              <th>Avancement</th>
              <th style="text-align: right;">Budget</th>
              <th style="text-align: right;">Dépenses</th>
              <th style="text-align: center;">Taux</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${data.fiches.slice(0, 50).map(f => `
              <tr>
                <td><span class="fiche-code">${f.code}</span></td>
                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${f.activityName}</td>
                <td style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${f.projectName}</td>
                <td>${format(parseISO(f.dateCollecte), "dd/MM/yy")}</td>
                <td>
                  <div class="progress-cell">
                    <div class="progress-bar-mini" style="width: 40px;"><div class="progress-bar-mini-fill" style="width: ${f.progressPercentage}%;"></div></div>
                    <span style="font-size: 9px; font-weight: 600;">${f.progressPercentage}%</span>
                  </div>
                </td>
                <td style="text-align: right; font-family: monospace;">${formatMontant(f.budgetPrevu)}</td>
                <td style="text-align: right; font-family: monospace;">${formatMontant(f.depensesCumulees)}</td>
                <td style="text-align: center; font-weight: 600;">${f.tauxExecution}%</td>
                <td><span class="fiche-status ${f.status}">${f.statusLabel}</span></td>
              </tr>
            `).join("")}
            ${data.fiches.length > 50 ? `<tr><td colspan="9" style="text-align: center; font-style: italic; color: #64748b;">... et ${data.fiches.length - 50} autres fiches</td></tr>` : ""}
          </tbody>
        </table>
      </div>
    </div>
  ` : "";
  
  // Alerts HTML
  const alertsHtml = data.alertes.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">⚠️</div>
        <span class="section-title">Alertes et Points d'Attention (${data.alertes.length})</span>
      </div>
      <div class="section-body">
        <div class="alerts-list">
          ${data.alertes.slice(0, 10).map(a => `
            <div class="alert-item ${a.type === 'critique' ? '' : 'warning'}">
              <div class="alert-icon">${a.type === 'retard' ? '⏱️' : a.type === 'depassement' ? '💰' : a.type === 'bloque' ? '🚫' : '⚠️'}</div>
              <div class="alert-content">
                <div class="alert-title">${a.label}</div>
                <div class="alert-meta">${a.activityName} • ${a.projectName}</div>
                <div class="alert-details">${a.details}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  ` : "";
  
  // Top/Bottom performers
  const performersHtml = (data.topPerformers.length > 0 || data.bottomPerformers.length > 0) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏆</div>
        <span class="section-title">Performances</span>
      </div>
      <div class="section-body">
        <div class="performers-grid">
          <div class="performers-column">
            <div class="performers-title">🥇 Meilleures performances</div>
            ${data.topPerformers.slice(0, 5).map((p, i) => `
              <div class="performer-item">
                <div class="performer-rank">${i + 1}</div>
                <div class="performer-info">
                  <div class="performer-name">${p.activityName}</div>
                  <div class="performer-project">${p.projectName}</div>
                </div>
                <div class="performer-progress good">${p.progress}%</div>
              </div>
            `).join("")}
          </div>
          <div class="performers-column">
            <div class="performers-title">⚠️ Nécessitent attention</div>
            ${data.bottomPerformers.slice(0, 5).map((p, i) => `
              <div class="performer-item">
                <div class="performer-rank" style="background: #ef4444;">${i + 1}</div>
                <div class="performer-info">
                  <div class="performer-name">${p.activityName}</div>
                  <div class="performer-project">${p.projectName}</div>
                </div>
                <div class="performer-progress bad">${p.progress}%</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  ` : "";
  
  const bodyHtml = `
    <div class="synthese-container">
      <!-- KPIs Globaux -->
      <div class="kpi-section">
        <div class="kpi-section-title">📊 Indicateurs Clés de Performance</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">${data.stats.totalProjets}</div>
            <div class="kpi-label">Projets actifs</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${data.stats.totalActivites}</div>
            <div class="kpi-label">Activités suivies</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${data.stats.avancementMoyen}%</div>
            <div class="kpi-label">Avancement moyen</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${data.stats.tauxExecutionBudgetaire}%</div>
            <div class="kpi-label">Taux d'exécution</div>
          </div>
        </div>
        <div class="kpi-grid" style="margin-top: 15px;">
          <div class="kpi-card" style="grid-column: span 2;">
            <div class="kpi-value">${formatBudget(data.stats.budgetTotal)}</div>
            <div class="kpi-label">Budget total planifié</div>
          </div>
          <div class="kpi-card" style="grid-column: span 2;">
            <div class="kpi-value">${formatBudget(data.stats.depensesCumulees)}</div>
            <div class="kpi-label">Dépenses cumulées</div>
          </div>
        </div>
      </div>
      
      ${trimestresHtml}
      ${projectsHtml}
      ${alertsHtml}
      ${performersHtml}
      ${fichesHtml}
    </div>
  `;
  
  const footerHtml = generateExportFooter(config);
  
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Synthèse Suivi - ${data.dateGeneration}</title>
        ${getBaseExportStyles(config, "landscape")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </body>
    </html>
  `;
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// ===== EXPORT PDF CONSOLIDÉ - TOUTES LES FICHES D'UNE COLLECTE =====

export interface CollecteConsolideeExportData {
  collecte: {
    code: string;
    projectName: string;
    dateCollecte: string;
    description?: string;
    status: string;
    createdBy?: string;
  };
  stats: {
    totalFiches: number;
    brouillons: number;
    soumis: number;
    valides: number;
    approuves: number;
    budgetTotal: number;
    depensesCumulees: number;
    tauxExecutionGlobal: number;
    avancementMoyen: number;
  };
  fiches: Array<{
    code: string;
    activityName: string;
    responsable: string;
    workflowName?: string;
    currentStepName?: string;
    progressPercentage: number;
    budgetPrevu: number;
    depensesCumulees: number;
    tauxExecution: number;
    status: string;
    statusLabel: string;
    livrables: Array<{
      name: string;
      unit: string;
      targetValue: number;
      currentValue: number;
      percentage: number;
    }>;
    pointsCritiques?: Array<{
      titre: string;
      niveau: string;
      niveauLabel: string;
      statut: string;
      statutLabel: string;
    }>;
    actionsSuivi?: Array<{
      titre: string;
      responsable: string;
      echeance: string;
      priorite: string;
      prioriteLabel: string;
      statut: string;
      statutLabel: string;
    }>;
    observations?: string;
  }>;
  ficheIndicateurs?: {
    code: string;
    status: string;
    statusLabel: string;
    indicateurs: Array<{
      code: string;
      name: string;
      unit: string;
      baselineValue: number;
      targetValue: number;
      currentValue: number;
      percentage: number;
    }>;
  };
  dateGeneration: string;
}

export const exportCollecteConsolideeToPDF = (data: CollecteConsolideeExportData) => {
  const config = getExportHeaderConfig();
  
  const additionalStyles = `
    <style>
      /* Container */
      .consolidated-container {
        background: #f8fafc;
      }
      
      /* Header Collecte */
      .collecte-header {
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -25)} 100%);
        border-radius: 16px;
        padding: 30px;
        margin-bottom: 25px;
        color: white;
        position: relative;
        overflow: hidden;
      }
      .collecte-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 60%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1));
        transform: rotate(30deg);
      }
      .collecte-code {
        font-family: monospace;
        font-size: 14px;
        background: rgba(255,255,255,0.2);
        padding: 5px 15px;
        border-radius: 20px;
        display: inline-block;
        margin-bottom: 12px;
      }
      .collecte-title {
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 8px 0;
      }
      .collecte-meta {
        font-size: 12px;
        opacity: 0.9;
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }
      .collecte-meta-item { display: flex; align-items: center; gap: 6px; }
      
      /* KPIs Grid */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 15px;
        margin-bottom: 25px;
      }
      .kpi-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 18px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      .kpi-card.highlight {
        background: linear-gradient(135deg, ${config.primaryColor}10 0%, ${config.primaryColor}05 100%);
        border-color: ${config.primaryColor}30;
      }
      .kpi-icon {
        font-size: 20px;
        margin-bottom: 8px;
      }
      .kpi-value {
        font-size: 26px;
        font-weight: bold;
        color: ${config.primaryColor};
        margin-bottom: 4px;
      }
      .kpi-value.warning { color: #f59e0b; }
      .kpi-value.danger { color: #ef4444; }
      .kpi-value.success { color: #22c55e; }
      .kpi-label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* Status Summary */
      .status-summary {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 25px;
      }
      .status-card {
        background: white;
        border-radius: 10px;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-left: 4px solid;
      }
      .status-card.brouillon { border-left-color: #94a3b8; background: #f8fafc; }
      .status-card.soumis { border-left-color: #3b82f6; background: #eff6ff; }
      .status-card.valide { border-left-color: #f59e0b; background: #fffbeb; }
      .status-card.approuve { border-left-color: #22c55e; background: #f0fdf4; }
      .status-count { font-size: 24px; font-weight: bold; color: #1e293b; }
      .status-label { font-size: 11px; color: #64748b; }
      
      /* Section */
      .section {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 20px;
      }
      .section-header {
        background: linear-gradient(90deg, ${config.primaryColor}12 0%, transparent 100%);
        padding: 14px 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .section-icon {
        width: 32px;
        height: 32px;
        background: ${config.primaryColor};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      }
      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: ${config.primaryColor};
        text-transform: uppercase;
      }
      .section-body { padding: 20px; }
      
      /* Fiche Card (pour chaque fiche) */
      .fiche-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .fiche-card-header {
        background: linear-gradient(90deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -15)} 100%);
        padding: 15px 20px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .fiche-card-title-section { }
      .fiche-card-code {
        font-family: monospace;
        font-size: 12px;
        background: rgba(255,255,255,0.2);
        padding: 3px 10px;
        border-radius: 10px;
        display: inline-block;
        margin-bottom: 6px;
      }
      .fiche-card-title {
        font-size: 14px;
        font-weight: bold;
        margin: 0;
      }
      .fiche-card-status {
        padding: 5px 12px;
        border-radius: 15px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .fiche-card-status.brouillon { background: rgba(255,255,255,0.2); }
      .fiche-card-status.soumis { background: #3b82f6; }
      .fiche-card-status.valide { background: #f59e0b; }
      .fiche-card-status.approuve { background: #22c55e; }
      .fiche-card-body { padding: 15px 20px; }
      
      /* Fiche KPI row */
      .fiche-kpi-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 15px;
      }
      .fiche-kpi {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
      }
      .fiche-kpi-value { font-size: 18px; font-weight: bold; color: ${config.primaryColor}; }
      .fiche-kpi-value.warning { color: #f59e0b; }
      .fiche-kpi-value.danger { color: #ef4444; }
      .fiche-kpi-label { font-size: 9px; color: #64748b; text-transform: uppercase; margin-top: 2px; }
      
      /* Fiche info row */
      .fiche-info-row {
        display: flex;
        gap: 20px;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 12px;
      }
      .fiche-info-item { display: flex; align-items: center; gap: 5px; }
      
      /* Progress bar mini */
      .progress-container-mini {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .progress-bar-mini {
        flex: 1;
        height: 10px;
        background: #e5e7eb;
        border-radius: 5px;
        overflow: hidden;
      }
      .progress-bar-mini-fill {
        height: 100%;
        background: linear-gradient(90deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, 15)} 100%);
        border-radius: 5px;
      }
      .progress-pct-mini {
        font-size: 12px;
        font-weight: 600;
        color: ${config.primaryColor};
        min-width: 40px;
        text-align: right;
      }
      
      /* Livrables mini table */
      .livrables-mini-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }
      .livrables-mini-table th {
        background: #f1f5f9;
        padding: 8px 10px;
        text-align: left;
        font-weight: 600;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
      }
      .livrables-mini-table th.right { text-align: right; }
      .livrables-mini-table td {
        padding: 8px 10px;
        border-bottom: 1px solid #f1f5f9;
      }
      .livrables-mini-table td.right { text-align: right; }
      .livrables-mini-table tr:last-child td { border-bottom: none; }
      .livrable-progress {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .livrable-bar {
        width: 60px;
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
      }
      .livrable-bar-fill {
        height: 100%;
        background: ${config.primaryColor};
        border-radius: 3px;
      }
      
      /* Points critiques mini */
      .pc-mini-list { }
      .pc-mini-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 6px;
        font-size: 10px;
      }
      .pc-mini-badge {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 8px;
        font-weight: 600;
      }
      .pc-mini-badge.critique { background: #fee2e2; color: #dc2626; }
      .pc-mini-badge.majeur { background: #fef3c7; color: #d97706; }
      .pc-mini-badge.mineur { background: #e0f2fe; color: #0284c7; }
      .pc-mini-badge.ouvert { background: #fee2e2; color: #dc2626; }
      .pc-mini-badge.en_cours { background: #fef3c7; color: #d97706; }
      .pc-mini-badge.resolu { background: #dcfce7; color: #16a34a; }
      
      /* Actions mini */
      .actions-mini-list { }
      .action-mini-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 6px;
        font-size: 10px;
      }
      .action-mini-title { flex: 1; font-weight: 500; }
      .action-mini-badge {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 8px;
        font-weight: 600;
      }
      .action-mini-badge.haute { background: #fee2e2; color: #dc2626; }
      .action-mini-badge.moyenne { background: #fef3c7; color: #d97706; }
      .action-mini-badge.basse { background: #e0f2fe; color: #0284c7; }
      
      /* Indicateurs section */
      .indicateurs-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .indicateurs-table th {
        background: ${config.primaryColor};
        color: white;
        padding: 10px;
        text-align: left;
        font-weight: 600;
      }
      .indicateurs-table th.right { text-align: right; }
      .indicateurs-table th.center { text-align: center; }
      .indicateurs-table td {
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
      }
      .indicateurs-table td.right { text-align: right; }
      .indicateurs-table td.center { text-align: center; }
      .indicateurs-table tbody tr:nth-child(even) { background: #f8fafc; }
      
      /* Page break utility */
      .page-break { page-break-before: always; margin-top: 0; }
      
      /* Summary table */
      .summary-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .summary-table th {
        background: ${config.primaryColor};
        color: white;
        padding: 12px 10px;
        text-align: left;
        font-weight: 600;
      }
      .summary-table th.right { text-align: right; }
      .summary-table th.center { text-align: center; }
      .summary-table td {
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
        vertical-align: middle;
      }
      .summary-table td.right { text-align: right; font-variant-numeric: tabular-nums; }
      .summary-table td.center { text-align: center; }
      .summary-table tbody tr:nth-child(even) { background: #f8fafc; }
      .summary-table .status-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
      }
      .summary-table .status-badge.brouillon { background: #f1f5f9; color: #475569; }
      .summary-table .status-badge.soumis { background: #dbeafe; color: #1e40af; }
      .summary-table .status-badge.valide { background: #fef3c7; color: #92400e; }
      .summary-table .status-badge.approuve { background: #dcfce7; color: #166534; }
      .summary-table tfoot tr {
        background: ${config.primaryColor}10;
        font-weight: 600;
      }
      .summary-table tfoot td { border-top: 2px solid ${config.primaryColor}; }
    </style>
  `;
  
  const headerHtml = generateExportHeader(
    config,
    "Rapport consolidé de collecte",
    `${data.collecte.projectName} - ${format(parseISO(data.collecte.dateCollecte), "dd MMMM yyyy", { locale: fr })}`
  );
  
  // Status labels
  const statusLabels: Record<string, string> = {
    brouillon: "Brouillon",
    soumis: "Soumis",
    valide: "Validé",
    approuve: "Approuvé",
    en_cours: "En cours",
    cloturee: "Clôturée",
  };
  
  // Collecte Header HTML
  const collecteHeaderHtml = `
    <div class="collecte-header">
      <span class="collecte-code">${data.collecte.code}</span>
      <h1 class="collecte-title">${data.collecte.projectName}</h1>
      <div class="collecte-meta">
        <div class="collecte-meta-item">📅 ${format(parseISO(data.collecte.dateCollecte), "dd MMMM yyyy", { locale: fr })}</div>
        <div class="collecte-meta-item">📊 ${statusLabels[data.collecte.status] || data.collecte.status}</div>
        ${data.collecte.createdBy ? `<div class="collecte-meta-item">👤 ${data.collecte.createdBy}</div>` : ""}
        <div class="collecte-meta-item">📄 ${data.stats.totalFiches} fiches</div>
      </div>
      ${data.collecte.description ? `<p style="margin-top: 12px; font-size: 12px; opacity: 0.85;">${data.collecte.description}</p>` : ""}
    </div>
  `;
  
  // KPIs HTML
  const kpisHtml = `
    <div class="kpi-grid">
      <div class="kpi-card highlight">
        <div class="kpi-icon">📄</div>
        <div class="kpi-value">${data.stats.totalFiches}</div>
        <div class="kpi-label">Fiches</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div class="kpi-value">${data.stats.avancementMoyen}%</div>
        <div class="kpi-label">Avancement moyen</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-value">${formatBudget(data.stats.budgetTotal)}</div>
        <div class="kpi-label">Budget total</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💸</div>
        <div class="kpi-value">${formatBudget(data.stats.depensesCumulees)}</div>
        <div class="kpi-label">Dépenses cumulées</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📈</div>
        <div class="kpi-value ${data.stats.tauxExecutionGlobal > 100 ? 'danger' : data.stats.tauxExecutionGlobal > 90 ? 'warning' : ''}">${data.stats.tauxExecutionGlobal}%</div>
        <div class="kpi-label">Taux d'exécution</div>
      </div>
    </div>
  `;
  
  // Status summary HTML
  const statusSummaryHtml = `
    <div class="status-summary">
      <div class="status-card brouillon">
        <div class="status-count">${data.stats.brouillons}</div>
        <div class="status-label">Brouillons</div>
      </div>
      <div class="status-card soumis">
        <div class="status-count">${data.stats.soumis}</div>
        <div class="status-label">Soumis</div>
      </div>
      <div class="status-card valide">
        <div class="status-count">${data.stats.valides}</div>
        <div class="status-label">Validés</div>
      </div>
      <div class="status-card approuve">
        <div class="status-count">${data.stats.approuves}</div>
        <div class="status-label">Approuvés</div>
      </div>
    </div>
  `;
  
  // Tableau récapitulatif des fiches
  const summaryTableHtml = `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <span class="section-title">Tableau récapitulatif des fiches</span>
      </div>
      <div class="section-body" style="padding: 0;">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Activité</th>
              <th>Responsable</th>
              <th class="center">Avancement</th>
              <th class="right">Budget</th>
              <th class="right">Dépenses</th>
              <th class="center">Taux</th>
              <th class="center">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${data.fiches.map(f => `
              <tr>
                <td><span style="font-family: monospace; color: ${config.primaryColor}; font-weight: 600;">${f.code}</span></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.activityName}</td>
                <td>${f.responsable}</td>
                <td class="center">
                  <div class="progress-container-mini">
                    <div class="progress-bar-mini">
                      <div class="progress-bar-mini-fill" style="width: ${f.progressPercentage}%;"></div>
                    </div>
                    <span class="progress-pct-mini">${f.progressPercentage}%</span>
                  </div>
                </td>
                <td class="right">${formatMontant(f.budgetPrevu)}</td>
                <td class="right">${formatMontant(f.depensesCumulees)}</td>
                <td class="center" style="color: ${f.tauxExecution > 100 ? '#ef4444' : f.tauxExecution > 90 ? '#f59e0b' : '#22c55e'}; font-weight: 600;">${f.tauxExecution}%</td>
                <td class="center"><span class="status-badge ${f.status}">${f.statusLabel}</span></td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: right; padding-right: 20px;">TOTAL</td>
              <td class="right">${formatMontant(data.stats.budgetTotal)}</td>
              <td class="right">${formatMontant(data.stats.depensesCumulees)}</td>
              <td class="center" style="color: ${data.stats.tauxExecutionGlobal > 100 ? '#ef4444' : '#22c55e'}; font-weight: 600;">${data.stats.tauxExecutionGlobal}%</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
  
  // Détail de chaque fiche
  const fichesDetailHtml = data.fiches.map((fiche, idx) => {
    const livrablesHtml = fiche.livrables.length > 0 ? `
      <div style="margin-top: 12px;">
        <div style="font-size: 10px; font-weight: 600; color: #475569; margin-bottom: 8px; text-transform: uppercase;">📦 Livrables</div>
        <table class="livrables-mini-table">
          <thead>
            <tr>
              <th>Livrable</th>
              <th class="right">Cible</th>
              <th class="right">Réalisé</th>
              <th>Progression</th>
            </tr>
          </thead>
          <tbody>
            ${fiche.livrables.map(l => `
              <tr>
                <td>${l.name || l.unit}</td>
                <td class="right">${formatMontant(l.targetValue)} ${l.unit}</td>
                <td class="right">${formatMontant(l.currentValue)} ${l.unit}</td>
                <td>
                  <div class="livrable-progress">
                    <div class="livrable-bar">
                      <div class="livrable-bar-fill" style="width: ${Math.min(l.percentage, 100)}%;"></div>
                    </div>
                    <span style="font-size: 9px; font-weight: 600; color: ${l.percentage >= 100 ? '#22c55e' : config.primaryColor};">${l.percentage}%</span>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : "";
    
    const pcHtml = (fiche.pointsCritiques || []).length > 0 ? `
      <div style="margin-top: 12px;">
        <div style="font-size: 10px; font-weight: 600; color: #475569; margin-bottom: 8px; text-transform: uppercase;">⚠️ Points critiques (${fiche.pointsCritiques!.length})</div>
        <div class="pc-mini-list">
          ${fiche.pointsCritiques!.map(pc => `
            <div class="pc-mini-item">
              <span class="pc-mini-badge ${pc.niveau}">${pc.niveauLabel}</span>
              <span class="pc-mini-badge ${pc.statut}">${pc.statutLabel}</span>
              <span style="flex: 1;">${pc.titre}</span>
            </div>
          `).join("")}
        </div>
      </div>
    ` : "";
    
    const actionsHtml = (fiche.actionsSuivi || []).length > 0 ? `
      <div style="margin-top: 12px;">
        <div style="font-size: 10px; font-weight: 600; color: #475569; margin-bottom: 8px; text-transform: uppercase;">📋 Actions de suivi (${fiche.actionsSuivi!.length})</div>
        <div class="actions-mini-list">
          ${fiche.actionsSuivi!.slice(0, 3).map(a => `
            <div class="action-mini-item">
              <span class="action-mini-badge ${a.priorite}">${a.prioriteLabel}</span>
              <span class="action-mini-title">${a.titre}</span>
              <span style="font-size: 9px; color: #64748b;">📅 ${format(parseISO(a.echeance), "dd/MM/yyyy")}</span>
            </div>
          `).join("")}
          ${(fiche.actionsSuivi || []).length > 3 ? `<div style="font-size: 9px; color: #64748b; text-align: center; padding: 5px;">... et ${fiche.actionsSuivi!.length - 3} autre(s) action(s)</div>` : ""}
        </div>
      </div>
    ` : "";
    
    const observationsHtml = fiche.observations ? `
      <div style="margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <div style="font-size: 10px; font-weight: 600; color: #475569; margin-bottom: 6px; text-transform: uppercase;">💬 Observations</div>
        <div style="font-size: 10px; color: #374151; line-height: 1.5;">${fiche.observations}</div>
      </div>
    ` : "";
    
    return `
      <div class="fiche-card ${idx > 0 && idx % 3 === 0 ? 'page-break' : ''}">
        <div class="fiche-card-header">
          <div class="fiche-card-title-section">
            <span class="fiche-card-code">${fiche.code}</span>
            <h3 class="fiche-card-title">${fiche.activityName}</h3>
          </div>
          <span class="fiche-card-status ${fiche.status}">${fiche.statusLabel}</span>
        </div>
        <div class="fiche-card-body">
          <div class="fiche-info-row">
            <div class="fiche-info-item">👤 ${fiche.responsable}</div>
            ${fiche.workflowName ? `<div class="fiche-info-item">🔄 ${fiche.workflowName}</div>` : ""}
            ${fiche.currentStepName ? `<div class="fiche-info-item">📍 ${fiche.currentStepName}</div>` : ""}
          </div>
          
          <div class="fiche-kpi-row">
            <div class="fiche-kpi">
              <div class="fiche-kpi-value">${fiche.progressPercentage}%</div>
              <div class="fiche-kpi-label">Avancement</div>
            </div>
            <div class="fiche-kpi">
              <div class="fiche-kpi-value ${fiche.tauxExecution > 100 ? 'danger' : fiche.tauxExecution > 90 ? 'warning' : ''}">${fiche.tauxExecution}%</div>
              <div class="fiche-kpi-label">Taux exécution</div>
            </div>
            <div class="fiche-kpi">
              <div class="fiche-kpi-value">${formatBudget(fiche.budgetPrevu)}</div>
              <div class="fiche-kpi-label">Budget</div>
            </div>
            <div class="fiche-kpi">
              <div class="fiche-kpi-value">${formatBudget(fiche.depensesCumulees)}</div>
              <div class="fiche-kpi-label">Dépenses</div>
            </div>
          </div>
          
          <div class="progress-container-mini" style="margin-bottom: 15px;">
            <div class="progress-bar-mini" style="height: 12px;">
              <div class="progress-bar-mini-fill" style="width: ${fiche.progressPercentage}%;"></div>
            </div>
            <span class="progress-pct-mini">${fiche.progressPercentage}%</span>
          </div>
          
          ${livrablesHtml}
          ${pcHtml}
          ${actionsHtml}
          ${observationsHtml}
        </div>
      </div>
    `;
  }).join("");
  
  // Fiche indicateurs HTML
  const ficheIndicateursHtml = data.ficheIndicateurs ? `
    <div class="section page-break">
      <div class="section-header">
        <div class="section-icon">🎯</div>
        <span class="section-title">Fiche Indicateurs - ${data.ficheIndicateurs.code}</span>
      </div>
      <div class="section-body" style="padding: 0;">
        <table class="indicateurs-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Indicateur</th>
              <th>Unité</th>
              <th class="right">Référence</th>
              <th class="right">Cible</th>
              <th class="right">Réalisé</th>
              <th class="center">Atteinte</th>
            </tr>
          </thead>
          <tbody>
            ${data.ficheIndicateurs.indicateurs.map(ind => `
              <tr>
                <td><span style="font-family: monospace; color: ${config.primaryColor}; font-weight: 600;">${ind.code}</span></td>
                <td>${ind.name}</td>
                <td>${ind.unit}</td>
                <td class="right">${formatMontant(ind.baselineValue)}</td>
                <td class="right">${formatMontant(ind.targetValue)}</td>
                <td class="right" style="font-weight: 600;">${formatMontant(ind.currentValue)}</td>
                <td class="center">
                  <div class="livrable-progress">
                    <div class="livrable-bar">
                      <div class="livrable-bar-fill" style="width: ${Math.min(ind.percentage, 100)}%; background: ${ind.percentage >= 100 ? '#22c55e' : config.primaryColor};"></div>
                    </div>
                    <span style="font-size: 10px; font-weight: 600; color: ${ind.percentage >= 100 ? '#22c55e' : ind.percentage >= 75 ? config.primaryColor : '#f59e0b'};">${ind.percentage}%</span>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  ` : "";
  
  const bodyHtml = `
    <div class="consolidated-container">
      ${collecteHeaderHtml}
      ${kpisHtml}
      ${statusSummaryHtml}
      ${summaryTableHtml}
      
      <div class="section page-break">
        <div class="section-header">
          <div class="section-icon">📑</div>
          <span class="section-title">Détail des fiches d'activités</span>
        </div>
        <div class="section-body">
          ${fichesDetailHtml}
        </div>
      </div>
      
      ${ficheIndicateursHtml}
    </div>
  `;
  
  const footerHtml = generateExportFooter(config);
  
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Rapport consolidé - ${data.collecte.code}</title>
        ${getBaseExportStyles(config, "portrait")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </body>
    </html>
  `;
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
