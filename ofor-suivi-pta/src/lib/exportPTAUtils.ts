import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PTA, PTAActivity, PTAIndicatorPlanning, PTA_STATUS_LABELS } from "@/types/pta";
import { formatMontant, generateFileName } from "./exportUtils";
import { getServiceById } from "@/data/entitesExecution";
import { getOperationById } from "@/data/operations";
import { 
  getExportHeaderConfig, 
  getBaseExportStyles, 
  generateExportHeader, 
  generateExportFooter,
  adjustColor 
} from "./exportSettings";

// Étiquette de rattachement (Projet ou Opération hors-projet)
const getAttachmentLabel = (a: PTAActivity): { type: "projet" | "operation"; name: string } => {
  if (a.operationId) {
    const op = getOperationById(a.operationId);
    return { type: "operation", name: op ? `${op.code} — ${op.libelle}` : (a.operationName || "Opération") };
  }
  return { type: "projet", name: a.project };
};

const getServiceName = (a: PTAActivity): string => {
  if (a.serviceResponsableId) {
    const s = getServiceById(a.serviceResponsableId);
    if (s) return s.nom;
  }
  return "Service non défini";
};

// Formater un budget en millions/milliards
const formatBudgetDisplay = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${formatMontant(Math.round(amount / 1000000))} M FCFA`;
  }
  if (amount >= 1000000) {
    return `${formatMontant(Math.round(amount / 1000000))} M FCFA`;
  }
  return `${formatMontant(amount)} FCFA`;
};

// Export CSV des activités PTA
export const exportPTAActivitiesToCSV = (pta: PTA, activities: PTAActivity[]) => {
  const BOM = "\uFEFF";
  
  const headers = [
    "Service responsable",
    "Type rattachement",
    "Rattachement",
    "Activité",
    "Nature",
    "Responsable",
    "Budget Total (FCFA)",
    "T1 (FCFA)",
    "T2 (FCFA)",
    "T3 (FCFA)",
    "T4 (FCFA)",
    "Trimestres",
    "Livrables"
  ].map(h => `"${h}"`).join(";");
  
  const rows = activities.map(a => {
    const livrables = a.deliverables.map(d => `${d.targetValue} ${d.unit}`).join(", ");
    const att = getAttachmentLabel(a);
    return [
      `"${getServiceName(a)}"`,
      `"${att.type === "operation" ? "Opération" : "Projet"}"`,
      `"${att.name}"`,
      `"${a.name}"`,
      `"${a.nature}"`,
      `"${a.responsable}"`,
      formatMontant(a.budgetTotal),
      formatMontant(a.budgetT1),
      formatMontant(a.budgetT2),
      formatMontant(a.budgetT3),
      formatMontant(a.budgetT4),
      `"${a.trimestres.join(", ")}"`,
      `"${livrables}"`
    ].join(";");
  });
  
  // Ligne de total
  const totals = [
    '"TOTAL"', '""', '""', '""', '""', '""',
    formatMontant(activities.reduce((s, a) => s + a.budgetTotal, 0)),
    formatMontant(activities.reduce((s, a) => s + a.budgetT1, 0)),
    formatMontant(activities.reduce((s, a) => s + a.budgetT2, 0)),
    formatMontant(activities.reduce((s, a) => s + a.budgetT3, 0)),
    formatMontant(activities.reduce((s, a) => s + a.budgetT4, 0)),
    '""', '""'
  ].join(";");
  
  const csvContent = BOM + headers + "\n" + rows.join("\n") + "\n" + totals;
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = generateFileName(`PTA_Activites_${pta.code}`, "csv");
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export CSV des indicateurs PTA
export const exportPTAIndicatorsToCSV = (pta: PTA, indicators: PTAIndicatorPlanning[]) => {
  const BOM = "\uFEFF";
  
  const headers = [
    "Code",
    "Indicateur",
    "Unité",
    "Valeur de base",
    "Cible annuelle",
    "Cible T1",
    "Cible T2",
    "Cible T3",
    "Cible T4",
    "Réalisé T1",
    "Réalisé T2",
    "Réalisé T3",
    "Réalisé T4"
  ].map(h => `"${h}"`).join(";");
  
  const rows = indicators.map(i => [
    `"${i.indicatorCode}"`,
    `"${i.indicatorName}"`,
    `"${i.unit}"`,
    formatMontant(i.baselineValue),
    formatMontant(i.annualTarget),
    formatMontant(i.targetT1),
    formatMontant(i.targetT2),
    formatMontant(i.targetT3),
    formatMontant(i.targetT4),
    formatMontant(i.currentT1 || 0),
    formatMontant(i.currentT2 || 0),
    formatMontant(i.currentT3 || 0),
    formatMontant(i.currentT4 || 0)
  ].join(";"));
  
  const csvContent = BOM + headers + "\n" + rows.join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = generateFileName(`PTA_Indicateurs_${pta.code}`, "csv");
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export PDF complet du PTA avec bannière élaborée
export const exportPTAToPDF = (pta: PTA) => {
  const activities = pta.activities;
  const indicators = pta.indicators;
  const config = getExportHeaderConfig();
  
  const totalBudget = activities.reduce((s, a) => s + a.budgetTotal, 0);
  const budgetT1 = activities.reduce((s, a) => s + a.budgetT1, 0);
  const budgetT2 = activities.reduce((s, a) => s + a.budgetT2, 0);
  const budgetT3 = activities.reduce((s, a) => s + a.budgetT3, 0);
  const budgetT4 = activities.reduce((s, a) => s + a.budgetT4, 0);
  
  // Grouper par Service > Rattachement (Projet ou Opération)
  type Bucket = { type: "projet" | "operation"; name: string; activities: PTAActivity[] };
  type ServiceGroup = { serviceName: string; buckets: Record<string, Bucket> };
  const grouped: Record<string, ServiceGroup> = {};
  activities.forEach(a => {
    const sname = getServiceName(a);
    const att = getAttachmentLabel(a);
    if (!grouped[sname]) grouped[sname] = { serviceName: sname, buckets: {} };
    const key = `${att.type}:${att.name}`;
    if (!grouped[sname].buckets[key]) grouped[sname].buckets[key] = { type: att.type, name: att.name, activities: [] };
    grouped[sname].buckets[key].activities.push(a);
  });
  const groupedSorted = Object.values(grouped).sort((a, b) => a.serviceName.localeCompare(b.serviceName));

  // Utiliser les styles de base et ajouter les styles spécifiques PTA
  const additionalStyles = `
    <style>
      .summary { 
        display: flex; 
        gap: 12px; 
        margin-bottom: 12px; 
        padding: 10px; 
        background: linear-gradient(135deg, ${adjustColor(config.primaryColor, 90)} 0%, ${adjustColor(config.primaryColor, 85)} 100%); 
        border-radius: 6px; 
        border: 1px solid ${config.primaryColor}33;
        flex-wrap: wrap;
      }
      .summary-item { 
        text-align: center; 
        flex: 1; 
        min-width: 80px;
        padding: 5px;
        background: white;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .summary-label { font-size: 7px; color: #666; text-transform: uppercase; font-weight: 600; }
      .summary-value { font-size: 12px; font-weight: bold; color: ${config.primaryColor}; }
      .section-title { 
        font-size: 11px; 
        font-weight: bold; 
        color: ${config.primaryColor}; 
        margin: 15px 0 8px; 
        padding: 6px 10px; 
        background: ${adjustColor(config.primaryColor, 88)};
        border-left: 4px solid ${config.primaryColor};
        border-radius: 0 4px 4px 0;
      }
      .project-row { background: ${adjustColor(config.primaryColor, 85)} !important; font-weight: 600; }
      .project-row td { border-top: 2px solid ${config.primaryColor}; }
    </style>
  `;
  
  const headerHtml = generateExportHeader(
    config,
    pta.name,
    `${pta.code} - ${PTA_STATUS_LABELS[pta.status]}`
  );
  
  const metaHtml = `
    <div style="text-align: center; font-size: 9px; color: #666; margin-bottom: 10px;">
      Créé le ${format(new Date(pta.createdAt), "dd/MM/yyyy", { locale: fr })} par ${pta.createdBy}
      ${pta.openedAt ? ` | Ouvert le ${format(new Date(pta.openedAt), "dd/MM/yyyy", { locale: fr })}` : ""}
      ${pta.closedAt ? ` | Clôturé le ${format(new Date(pta.closedAt), "dd/MM/yyyy", { locale: fr })}` : ""}
    </div>
  `;
  
  const summaryHtml = `
    <div class="summary">
      <div class="summary-item">
        <div class="summary-label">Budget Total</div>
        <div class="summary-value">${formatBudgetDisplay(totalBudget)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Activités</div>
        <div class="summary-value">${activities.length}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">T1</div>
        <div class="summary-value">${formatBudgetDisplay(budgetT1)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">T2</div>
        <div class="summary-value">${formatBudgetDisplay(budgetT2)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">T3</div>
        <div class="summary-value">${formatBudgetDisplay(budgetT3)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">T4</div>
        <div class="summary-value">${formatBudgetDisplay(budgetT4)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Indicateurs</div>
        <div class="summary-value">${indicators.length}</div>
      </div>
    </div>
  `;
  
  // Tableau des activités groupées par projet
  let activitiesTableHtml = `
    <div class="section-title">PLANIFICATION DES ACTIVITÉS</div>
    <table>
      <thead>
        <tr>
          <th style="width:25%">Activité</th>
          <th style="width:8%">Nature</th>
          <th style="width:12%">Responsable</th>
          <th style="width:10%" class="amount">Budget Total</th>
          <th style="width:8%" class="amount">T1</th>
          <th style="width:8%" class="amount">T2</th>
          <th style="width:8%" class="amount">T3</th>
          <th style="width:8%" class="amount">T4</th>
          <th style="width:13%">Livrables</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  groupedSorted.forEach(group => {
    const groupActivities = Object.values(group.buckets).flatMap(b => b.activities);
    const gTotal = groupActivities.reduce((s, a) => s + a.budgetTotal, 0);
    const gT1 = groupActivities.reduce((s, a) => s + a.budgetT1, 0);
    const gT2 = groupActivities.reduce((s, a) => s + a.budgetT2, 0);
    const gT3 = groupActivities.reduce((s, a) => s + a.budgetT3, 0);
    const gT4 = groupActivities.reduce((s, a) => s + a.budgetT4, 0);
    activitiesTableHtml += `
      <tr class="project-row" style="background:${adjustColor(getExportHeaderConfig().primaryColor, 80)} !important">
        <td colspan="3"><strong>SERVICE — ${group.serviceName}</strong></td>
        <td class="amount">${formatMontant(gTotal)}</td>
        <td class="amount">${formatMontant(gT1)}</td>
        <td class="amount">${formatMontant(gT2)}</td>
        <td class="amount">${formatMontant(gT3)}</td>
        <td class="amount">${formatMontant(gT4)}</td>
        <td>${groupActivities.length} activité(s)</td>
      </tr>
    `;
    Object.values(group.buckets).forEach(bucket => {
      const bTotal = bucket.activities.reduce((s, a) => s + a.budgetTotal, 0);
      const typeLabel = bucket.type === "operation" ? "Opération" : "Projet";
      activitiesTableHtml += `
        <tr class="project-row">
          <td colspan="3" style="padding-left:18px">
            <span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:7px;background:${bucket.type === "operation" ? "#f3e8ff" : "#dbeafe"};color:${bucket.type === "operation" ? "#6b21a8" : "#1e40af"};margin-right:4px">${typeLabel}</span>
            ${bucket.name}
          </td>
          <td class="amount">${formatMontant(bTotal)}</td>
          <td class="amount">${formatMontant(bucket.activities.reduce((s, a) => s + a.budgetT1, 0))}</td>
          <td class="amount">${formatMontant(bucket.activities.reduce((s, a) => s + a.budgetT2, 0))}</td>
          <td class="amount">${formatMontant(bucket.activities.reduce((s, a) => s + a.budgetT3, 0))}</td>
          <td class="amount">${formatMontant(bucket.activities.reduce((s, a) => s + a.budgetT4, 0))}</td>
          <td>${bucket.activities.length} activité(s)</td>
        </tr>
      `;
      bucket.activities.forEach(a => {
        const livrables = a.deliverables.map(d => `${d.targetValue} ${d.unit}`).join(", ");
        activitiesTableHtml += `
          <tr>
            <td style="padding-left:30px">${a.name}</td>
            <td>${a.nature}</td>
            <td>${a.responsable}</td>
            <td class="amount">${formatMontant(a.budgetTotal)}</td>
            <td class="amount">${a.budgetT1 > 0 ? formatMontant(a.budgetT1) : "-"}</td>
            <td class="amount">${a.budgetT2 > 0 ? formatMontant(a.budgetT2) : "-"}</td>
            <td class="amount">${a.budgetT3 > 0 ? formatMontant(a.budgetT3) : "-"}</td>
            <td class="amount">${a.budgetT4 > 0 ? formatMontant(a.budgetT4) : "-"}</td>
            <td>${livrables || "-"}</td>
          </tr>
        `;
      });
    });
  });
  
  activitiesTableHtml += `
      <tr class="total-row">
        <td colspan="3">TOTAL GÉNÉRAL</td>
        <td class="amount">${formatMontant(totalBudget)}</td>
        <td class="amount">${formatMontant(budgetT1)}</td>
        <td class="amount">${formatMontant(budgetT2)}</td>
        <td class="amount">${formatMontant(budgetT3)}</td>
        <td class="amount">${formatMontant(budgetT4)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  `;
  
  // Tableau des indicateurs
  let indicatorsTableHtml = "";
  if (indicators.length > 0) {
    indicatorsTableHtml = `
      <div class="section-title">PLANIFICATION DES INDICATEURS</div>
      <table>
        <thead>
          <tr>
            <th style="width:8%">Code</th>
            <th style="width:25%">Indicateur</th>
            <th style="width:10%">Unité</th>
            <th style="width:8%" class="amount">Base</th>
            <th style="width:8%" class="amount">Cible Ann.</th>
            <th style="width:8%" class="amount">T1</th>
            <th style="width:8%" class="amount">T2</th>
            <th style="width:8%" class="amount">T3</th>
            <th style="width:8%" class="amount">T4</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    indicators.forEach(i => {
      indicatorsTableHtml += `
        <tr>
          <td>${i.indicatorCode}</td>
          <td>${i.indicatorName}</td>
          <td>${i.unit}</td>
          <td class="amount">${formatMontant(i.baselineValue)}</td>
          <td class="amount">${formatMontant(i.annualTarget)}</td>
          <td class="amount">${formatMontant(i.targetT1)}</td>
          <td class="amount">${formatMontant(i.targetT2)}</td>
          <td class="amount">${formatMontant(i.targetT3)}</td>
          <td class="amount">${formatMontant(i.targetT4)}</td>
        </tr>
      `;
    });
    
    indicatorsTableHtml += `
        </tbody>
      </table>
    `;
  }
  
  const footerHtml = generateExportFooter(config);
  
  const htmlContent = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${pta.code}</title>
        ${getBaseExportStyles(config, "landscape")}
        ${additionalStyles}
      </head>
      <body>
        ${headerHtml}
        ${metaHtml}
        ${summaryHtml}
        ${activitiesTableHtml}
        ${indicatorsTableHtml}
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

// Export complet CSV (activités + indicateurs dans le même fichier)
export const exportPTAToCSV = (pta: PTA) => {
  const activities = pta.activities;
  const indicators = pta.indicators;
  
  const BOM = "\uFEFF";
  
  // Section activités
  let content = `"${pta.name} - ${pta.code}"\n`;
  content += `"Statut: ${PTA_STATUS_LABELS[pta.status]}"\n`;
  content += `"Généré le: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}"\n\n`;
  
  content += `"=== ACTIVITÉS ==="\n`;
  content += `"Service";"Type";"Rattachement";"Activité";"Nature";"Responsable";"Budget Total";"T1";"T2";"T3";"T4";"Trimestres";"Livrables"\n`;
  
  activities.forEach(a => {
    const livrables = a.deliverables.map(d => `${d.targetValue} ${d.unit}`).join(", ");
    const att = getAttachmentLabel(a);
    content += `"${getServiceName(a)}";"${att.type === "operation" ? "Opération" : "Projet"}";"${att.name}";"${a.name}";"${a.nature}";"${a.responsable}";${formatMontant(a.budgetTotal)};${formatMontant(a.budgetT1)};${formatMontant(a.budgetT2)};${formatMontant(a.budgetT3)};${formatMontant(a.budgetT4)};"${a.trimestres.join(", ")}";"${livrables}"\n`;
  });
  
  const totalBudget = activities.reduce((s, a) => s + a.budgetTotal, 0);
  content += `"TOTAL";"";"";"";"";"";${formatMontant(totalBudget)};${formatMontant(activities.reduce((s, a) => s + a.budgetT1, 0))};${formatMontant(activities.reduce((s, a) => s + a.budgetT2, 0))};${formatMontant(activities.reduce((s, a) => s + a.budgetT3, 0))};${formatMontant(activities.reduce((s, a) => s + a.budgetT4, 0))};"";"";\n`;
  
  content += `\n"=== INDICATEURS ==="\n`;
  content += `"Code";"Indicateur";"Unité";"Base";"Cible Ann.";"T1";"T2";"T3";"T4"\n`;
  
  indicators.forEach(i => {
    content += `"${i.indicatorCode}";"${i.indicatorName}";"${i.unit}";${formatMontant(i.baselineValue)};${formatMontant(i.annualTarget)};${formatMontant(i.targetT1)};${formatMontant(i.targetT2)};${formatMontant(i.targetT3)};${formatMontant(i.targetT4)}\n`;
  });
  
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = generateFileName(`PTA_Complet_${pta.code}`, "csv");
  link.click();
  URL.revokeObjectURL(link.href);
};
