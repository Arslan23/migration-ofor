import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  CDP, 
  CDPFicheSuiviIndicateur, 
  CDP_FICHE_STATUS_LABELS, 
  CDP_FICHE_STATUS_COLORS,
  CDPFicheSuiviStatus,
  mockCDPComposantes, 
  mockCDPCategories,
  calculatePerformanceRate
} from "@/types/cdp";
import { CDPCollecteSuivi } from "./CDPCollecteForm";
import { cn } from "@/lib/utils";
import { formatMontant } from "@/lib/exportUtils";
import { 
  ArrowLeft, Save, Send, CheckCircle, Award, Unlock, 
  ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, FileDown, Eye, Pencil
} from "lucide-react";
import { exportFichesSuiviToPDF } from "@/lib/exportCDPUtils";
import ExportButtons from "@/components/ui/ExportButtons";
import CDPUnitAggregation from "@/components/cdp/CDPUnitAggregation";
import { exportToCSV } from "@/lib/exportUtils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CDPFicheData {
  indicateurRefId: string;
  indicateurCode: string;
  indicateurName: string;
  composanteId: string;
  composanteName: string;
  unit: string;
  uniteMesureIds?: string[];
  targetValue: number;
  currentValue?: number;
  previousValue?: number;
  observations?: string;
}

interface CDPCollecteDetailProps {
  cdp: CDP;
  collecte: CDPCollecteSuivi;
  fichesData: CDPFicheData[];
  previousCollecte?: CDPCollecteSuivi;
  year: number;
  onBack: () => void;
  onSave: (collecte: CDPCollecteSuivi, fichesData: CDPFicheData[]) => void;
  onWorkflowAction: (action: "submit" | "validate" | "approve" | "reject") => void;
  canValidate?: boolean;
  canApprove?: boolean;
}

const CDPCollecteDetail = ({ 
  cdp, 
  collecte, 
  fichesData, 
  previousCollecte,
  year,
  onBack, 
  onSave, 
  onWorkflowAction,
  canValidate = true,
  canApprove = true
}: CDPCollecteDetailProps) => {
  const { toast } = useToast();
  const [localFiches, setLocalFiches] = useState<CDPFicheData[]>(fichesData);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(mockCDPCategories.map(c => c.id));
  const [viewingFiche, setViewingFiche] = useState<CDPFicheData | null>(null);
  const [editingFiche, setEditingFiche] = useState<CDPFicheData | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editObservations, setEditObservations] = useState<string>("");

  const isReadOnly = collecte.status === "approuve";

  // Fonctions d'export
  const handleExportPDF = () => {
    exportFichesSuiviToPDF({
      cdpName: cdp.name,
      year,
      fiches: localFiches.map(f => ({
        id: `${collecte.id}-${f.indicateurRefId}`,
        evaluationId: collecte.evaluationId,
        indicateurRefId: f.indicateurRefId,
        indicateurCode: f.indicateurCode,
        indicateurName: f.indicateurName,
        composanteId: f.composanteId,
        composanteName: f.composanteName,
        unit: f.unit,
        targetValue: f.targetValue,
        currentValue: f.currentValue,
        performanceRate: f.currentValue !== undefined ? calculatePerformanceRate(f.targetValue, f.currentValue) : undefined,
        status: collecte.status,
        observations: f.observations,
      })),
    });
  };

  const handleExportCSV = () => {
    const exportData = localFiches.map(f => {
      const composante = mockCDPComposantes.find(c => c.id === f.composanteId);
      const categorie = mockCDPCategories.find(c => c.id === composante?.categorieId);
      const perfRate = f.currentValue !== undefined ? calculatePerformanceRate(f.targetValue, f.currentValue) : undefined;
      return {
        Code: f.indicateurCode,
        Indicateur: f.indicateurName,
        Catégorie: categorie?.name || "",
        Composante: f.composanteName,
        Unité: f.unit,
        Cible: f.targetValue,
        Réalisé: f.currentValue ?? "",
        Performance: perfRate ?? "",
        Observations: f.observations ?? "",
      };
    });
    exportToCSV(exportData, [
      { key: "Code", header: "Code" },
      { key: "Indicateur", header: "Indicateur" },
      { key: "Catégorie", header: "Catégorie" },
      { key: "Composante", header: "Composante" },
      { key: "Unité", header: "Unité" },
      { key: "Cible", header: "Cible" },
      { key: "Réalisé", header: "Réalisé" },
      { key: "Performance", header: "Performance (%)" },
      { key: "Observations", header: "Observations" },
    ], `Fiche_CDP_${collecte.libelle.replace(/\s+/g, "_")}`);
  };


  const openEdit = (fiche: CDPFicheData) => {
    setEditingFiche(fiche);
    setEditValue(fiche.currentValue !== undefined ? String(fiche.currentValue) : "");
    setEditObservations(fiche.observations ?? "");
  };

  const handleSaveSingle = () => {
    if (!editingFiche) return;
    const updated = localFiches.map(f => {
      if (f.indicateurRefId === editingFiche.indicateurRefId) {
        return {
          ...f,
          currentValue: editValue.trim() === "" ? undefined : parseFloat(editValue),
          observations: editObservations,
        };
      }
      return f;
    });
    setLocalFiches(updated);
    onSave(collecte, updated);
    toast({ 
      title: "Indicateur enregistré", 
      description: `${editingFiche.indicateurCode} — ${editingFiche.indicateurName}` 
    });
    setEditingFiche(null);
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const getPerformanceColor = (rate: number | undefined) => {
    if (rate === undefined) return "";
    if (rate >= 100) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (rate >= 80) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    return "text-red-600 bg-red-50 dark:bg-red-900/20";
  };

  const getTrendIcon = (current: number | undefined, previous: number | undefined) => {
    if (current === undefined || previous === undefined) return null;
    if (current > previous) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  // Regrouper par catégorie puis composante
  const fichesByCategory = mockCDPCategories.map(cat => {
    const catComposantes = mockCDPComposantes.filter(c => c.categorieId === cat.id);
    const composantesWithFiches = catComposantes.map(comp => {
      const compFiches = localFiches.filter(f => f.composanteId === comp.id);
      const avgPerf = compFiches.filter(f => f.currentValue !== undefined).reduce((acc, f) => {
        const perf = calculatePerformanceRate(f.targetValue, f.currentValue || 0);
        return acc + perf;
      }, 0) / compFiches.filter(f => f.currentValue !== undefined).length || 0;
      return { composante: comp, fiches: compFiches, avgPerf };
    }).filter(c => c.fiches.length > 0);
    return { categorie: cat, composantes: composantesWithFiches };
  }).filter(c => c.composantes.length > 0);

  // Stats globales
  const totalIndicateurs = localFiches.length;
  const renseignes = localFiches.filter(f => f.currentValue !== undefined).length;
  const avgPerformance = localFiches
    .filter(f => f.currentValue !== undefined)
    .reduce((acc, f) => acc + calculatePerformanceRate(f.targetValue, f.currentValue || 0), 0) / renseignes || 0;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{collecte.libelle}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(collecte.date), "EEEE dd MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs", CDP_FICHE_STATUS_COLORS[collecte.status])}>
            {CDP_FICHE_STATUS_LABELS[collecte.status]}
          </Badge>
          <ExportButtons 
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>

      {!isReadOnly && (
        <p className="text-xs text-muted-foreground italic">
          💡 Cliquez sur l'icône <Pencil className="inline w-3 h-3 mx-0.5" /> de chaque indicateur pour saisir/modifier ses valeurs individuellement.
        </p>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Indicateurs</p>
            <p className="text-xl font-bold">{totalIndicateurs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Renseignés</p>
            <p className="text-xl font-bold">{renseignes} <span className="text-sm font-normal text-muted-foreground">/ {totalIndicateurs}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Performance moyenne</p>
            <p className={cn("text-xl font-bold", getPerformanceColor(avgPerformance))}>
              {avgPerformance > 0 ? `${Math.round(avgPerformance)}%` : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-end gap-2">
            {collecte.status === "brouillon" && (
              <Button size="sm" variant="outline" onClick={() => onWorkflowAction("submit")}>
                <Send className="w-4 h-4 mr-1" /> Soumettre
              </Button>
            )}
            {collecte.status === "soumis" && canValidate && (
              <>
                <Button size="sm" variant="outline" onClick={() => onWorkflowAction("reject")}>
                  <Unlock className="w-4 h-4 mr-1" /> Rejeter
                </Button>
                <Button size="sm" onClick={() => onWorkflowAction("validate")}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Valider
                </Button>
              </>
            )}
            {collecte.status === "valide" && canApprove && (
              <>
                <Button size="sm" variant="outline" onClick={() => onWorkflowAction("reject")}>
                  <Unlock className="w-4 h-4 mr-1" /> Rejeter
                </Button>
                <Button size="sm" onClick={() => onWorkflowAction("approve")}>
                  <Award className="w-4 h-4 mr-1" /> Approuver
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liste des indicateurs par catégorie/composante */}
      {fichesByCategory.map(({ categorie, composantes }) => (
        <Collapsible 
          key={categorie.id}
          open={expandedCategories.includes(categorie.id)}
          onOpenChange={() => toggleCategory(categorie.id)}
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg hover:bg-primary/15 transition-colors">
              {expandedCategories.includes(categorie.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Badge className="text-xs font-mono bg-primary text-primary-foreground">{categorie.code}</Badge>
              <span className="font-semibold text-sm">{categorie.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {composantes.reduce((acc, c) => acc + c.fiches.length, 0)} indicateur(s)
              </span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {composantes.map(({ composante, fiches: compFiches, avgPerf }) => (
              <Card key={composante.id}>
                <CardHeader className="py-2 px-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-mono">{composante.code}</Badge>
                      <CardTitle className="text-sm font-medium">{composante.name}</CardTitle>
                    </div>
                    {avgPerf > 0 && (
                      <Badge variant="outline" className={cn("text-xs", getPerformanceColor(avgPerf))}>
                        {Math.round(avgPerf)}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Code</TableHead>
                        <TableHead>Indicateur</TableHead>
                        <TableHead className="text-right w-24">Cible</TableHead>
                        {previousCollecte && <TableHead className="text-right w-24">Précédent</TableHead>}
                        <TableHead className="text-right w-28">Réalisé</TableHead>
                        <TableHead className="w-24">Perf.</TableHead>
                        <TableHead className="w-20 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compFiches.map(fiche => {
                        const perfRate = fiche.currentValue !== undefined 
                          ? calculatePerformanceRate(fiche.targetValue, fiche.currentValue)
                          : undefined;
                        return (
                          <TableRow
                            key={fiche.indicateurRefId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setViewingFiche(fiche)}
                          >
                            <TableCell className="font-mono text-xs">{fiche.indicateurCode}</TableCell>
                            <TableCell className="text-sm">{fiche.indicateurName}</TableCell>
                            <TableCell className="text-right text-sm">{formatMontant(fiche.targetValue)} {fiche.unit}</TableCell>
                            {previousCollecte && (
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {fiche.previousValue !== undefined ? `${formatMontant(fiche.previousValue)} ${fiche.unit}` : "-"}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {fiche.currentValue !== undefined ? (
                                  <span className="font-medium text-sm">
                                    {formatMontant(fiche.currentValue)} {fiche.unit}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Non renseigné</span>
                                )}
                                {getTrendIcon(fiche.currentValue, fiche.previousValue)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {perfRate !== undefined ? (
                                <div className="flex items-center gap-1">
                                  <Progress value={Math.min(perfRate, 100)} className="h-2 w-12" />
                                  <span className={cn("text-xs font-medium", getPerformanceColor(perfRate))}>
                                    {perfRate}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setViewingFiche(fiche)}
                                  title="Voir le détail"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                {!isReadOnly && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-primary"
                                    onClick={() => openEdit(fiche)}
                                    title="Saisir / modifier les valeurs"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {/* Historique workflow */}
      {(collecte.submittedAt || collecte.validatedAt || collecte.approvedAt) && (
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Historique du workflow</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-1 text-xs">
              {collecte.submittedAt && (
                <div className="flex justify-between">
                  <span>Soumis par {collecte.submittedBy}</span>
                  <span className="text-muted-foreground">{format(new Date(collecte.submittedAt), "dd/MM/yyyy HH:mm")}</span>
                </div>
              )}
              {collecte.validatedAt && (
                <div className="flex justify-between">
                  <span>Validé par {collecte.validatedBy}</span>
                  <span className="text-muted-foreground">{format(new Date(collecte.validatedAt), "dd/MM/yyyy HH:mm")}</span>
                </div>
              )}
              {collecte.approvedAt && (
                <div className="flex justify-between">
                  <span>Approuvé par {collecte.approvedBy}</span>
                  <span className="text-muted-foreground">{format(new Date(collecte.approvedAt), "dd/MM/yyyy HH:mm")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog : visualisation détail indicateur */}
      <Dialog open={!!viewingFiche} onOpenChange={(o) => !o && setViewingFiche(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Détail de l'indicateur
            </DialogTitle>
            <DialogDescription>{viewingFiche?.indicateurCode} — {viewingFiche?.indicateurName}</DialogDescription>
          </DialogHeader>
          {viewingFiche && (() => {
            const perfRate = viewingFiche.currentValue !== undefined
              ? calculatePerformanceRate(viewingFiche.targetValue, viewingFiche.currentValue)
              : undefined;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground">Composante</p>
                    <p className="font-medium text-sm">{viewingFiche.composanteName}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground">Unité</p>
                    <p className="font-medium text-sm">{viewingFiche.unit}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Cible</p>
                    <p className="font-bold text-lg">{formatMontant(viewingFiche.targetValue)}</p>
                  </div>
                  {previousCollecte && (
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Précédent</p>
                      <p className="font-bold text-lg text-muted-foreground">
                        {viewingFiche.previousValue !== undefined ? formatMontant(viewingFiche.previousValue) : "-"}
                      </p>
                    </div>
                  )}
                  <div className={cn("p-3 rounded-lg border", perfRate !== undefined && getPerformanceColor(perfRate))}>
                    <p className="text-xs text-muted-foreground">Réalisé</p>
                    <p className="font-bold text-lg">
                      {viewingFiche.currentValue !== undefined ? formatMontant(viewingFiche.currentValue) : "-"}
                    </p>
                    {perfRate !== undefined && (
                      <p className="text-xs font-medium mt-1">{perfRate}% de la cible</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Observations</p>
                  <div className="p-3 rounded-lg border bg-muted/20 min-h-[60px] text-sm whitespace-pre-wrap">
                    {viewingFiche.observations || <span className="text-muted-foreground italic">Aucune observation</span>}
                  </div>
                </div>
                <CDPUnitAggregation uniteMesureIds={viewingFiche.uniteMesureIds} year={year} resultUnit={viewingFiche.unit} variant="full" />
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingFiche(null)}>Fermer</Button>
            {!isReadOnly && viewingFiche && (
              <Button onClick={() => { const f = viewingFiche; setViewingFiche(null); openEdit(f); }}>
                <Pencil className="w-4 h-4 mr-1" /> Modifier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : édition d'un indicateur */}
      <Dialog open={!!editingFiche} onOpenChange={(o) => !o && setEditingFiche(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Saisir / modifier les valeurs
            </DialogTitle>
            <DialogDescription>{editingFiche?.indicateurCode} — {editingFiche?.indicateurName}</DialogDescription>
          </DialogHeader>
          {editingFiche && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 rounded border bg-muted/30">
                  <span className="text-xs text-muted-foreground">Cible</span>
                  <p className="font-semibold">{formatMontant(editingFiche.targetValue)} {editingFiche.unit}</p>
                </div>
                {previousCollecte && (
                  <div className="p-2 rounded border bg-muted/30">
                    <span className="text-xs text-muted-foreground">Précédent</span>
                    <p className="font-semibold">
                      {editingFiche.previousValue !== undefined ? `${formatMontant(editingFiche.previousValue)} ${editingFiche.unit}` : "-"}
                    </p>
                  </div>
                )}
              </div>
              <CDPUnitAggregation uniteMesureIds={editingFiche.uniteMesureIds} year={year} resultUnit={editingFiche.unit} variant="full" />
              <div className="space-y-1.5">
                <Label htmlFor="edit-value">Valeur réalisée ({editingFiche.unit})</Label>
                <Input
                  id="edit-value"
                  type="number"
                  step="any"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={`Ex. ${editingFiche.targetValue}`}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-obs">Observations</Label>
                <Textarea
                  id="edit-obs"
                  rows={4}
                  value={editObservations}
                  onChange={(e) => setEditObservations(e.target.value)}
                  placeholder="Commentaires, contexte, justification..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFiche(null)}>Annuler</Button>
            <Button onClick={handleSaveSingle}>
              <Save className="w-4 h-4 mr-1" /> Enregistrer cet indicateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CDPCollecteDetail;
