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
export const formatMontant = (amount: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    useGrouping: true,
  }).format(amount).replace(/\s/g, " ");
};

// Générer un nom de fichier avec date
export const generateFileName = (baseName: string, extension: string): string => {
  const date = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: fr });
  return `${baseName}_${date}.${extension}`;
};

// Exporter en CSV (compatible Excel)
export const exportToCSV = (
  data: Record<string, any>[],
  columns: { key: string; header: string }[],
  fileName: string
) => {
  // BOM pour UTF-8
  const BOM = "\uFEFF";
  
  // Headers
  const headers = columns.map((col) => `"${col.header}"`).join(";");
  
  // Rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === "number") return formatMontant(value);
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(";")
  );
  
  const csvContent = BOM + headers + "\n" + rows.join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = generateFileName(fileName, "csv");
  link.click();
  URL.revokeObjectURL(link.href);
};

// Générer le contenu HTML pour PDF avec paramètres personnalisés
const generatePDFContent = (
  title: string,
  data: Record<string, any>[],
  columns: { key: string; header: string; width?: string }[],
  options?: {
    subtitle?: string;
    summary?: { label: string; value: string }[];
  }
): string => {
  const config = getExportHeaderConfig();
  
  const headerHtml = generateExportHeader(
    config, 
    title, 
    options?.subtitle,
    format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr })
  );

  const summaryHtml = options?.summary
    ? `<div class="summary">${options.summary
        .map((s) => `<div class="summary-item"><div class="summary-label">${s.label}</div><div class="summary-value">${s.value}</div></div>`)
        .join("")}</div>`
    : "";

  const tableHtml = `
    <table>
      <thead>
        <tr>
          ${columns.map((col) => `<th style="${col.width ? `width:${col.width}` : ""}">${col.header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${data
          .map(
            (row) => `
          <tr>
            ${columns
              .map((col) => {
                const value = row[col.key];
                const isAmount = col.key.toLowerCase().includes("budget") || col.key.toLowerCase().includes("montant") || col.key.toLowerCase().includes("spent");
                const formattedValue = value === null || value === undefined 
                  ? "-" 
                  : typeof value === "number" 
                    ? formatMontant(value) 
                    : value;
                return `<td class="${isAmount ? "amount" : ""}">${formattedValue}</td>`;
              })
              .join("")}
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  const footerHtml = generateExportFooter(config);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${getBaseExportStyles(config, "landscape")}</head><body>${headerHtml}${summaryHtml}${tableHtml}${footerHtml}</body></html>`;
};

// Exporter en PDF (via impression)
export const exportToPDF = (
  title: string,
  data: Record<string, any>[],
  columns: { key: string; header: string; width?: string }[],
  fileName: string,
  options?: {
    subtitle?: string;
    summary?: { label: string; value: string }[];
  }
) => {
  const htmlContent = generatePDFContent(title, data, columns, options);
  
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Générer PDF pour une fiche détaillée avec bannière élaborée
export const exportDetailToPDF = (
  title: string,
  sections: { title: string; content: string | { label: string; value: string }[] }[],
  fileName: string
) => {
  const config = getExportHeaderConfig();
  
  const headerHtml = generateExportHeader(config, title);
  
  const sectionsHtml = sections
    .map((section) => {
      const contentHtml = Array.isArray(section.content)
        ? section.content
            .map((field) => `<div class="field"><span class="field-label">${field.label}</span><span class="field-value">${field.value}</span></div>`)
            .join("")
        : `<p>${section.content}</p>`;
      return `<div class="section"><div class="section-title">${section.title}</div>${contentHtml}</div>`;
    })
    .join("");

  const footerHtml = generateExportFooter(config);

  const additionalStyles = `
    <style>
      .section { margin-bottom: 20px; page-break-inside: avoid; }
      .section-title { 
        font-size: 12px; 
        font-weight: bold; 
        color: ${config.primaryColor}; 
        border-bottom: 2px solid ${config.primaryColor}; 
        padding-bottom: 4px; 
        margin-bottom: 10px; 
      }
      .field { display: flex; margin-bottom: 6px; padding: 4px 0; border-bottom: 1px dotted #e0e0e0; }
      .field-label { width: 200px; color: #555; font-weight: 500; }
      .field-value { flex: 1; font-weight: 400; color: #1a1a1a; }
      .amount { font-family: 'Courier New', monospace; }
    </style>
  `;

  const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8">${getBaseExportStyles(config, "portrait")}${additionalStyles}</head><body>${headerHtml}${sectionsHtml}${footerHtml}</body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
