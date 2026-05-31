import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FicheIndicateur } from "@/types/workflow";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Target, 
  Calendar,
  TrendingUp,
  FileDown,
  BarChart3,
  Activity,
  Save,
  Edit2,
  Lock,
  Send,
} from "lucide-react";
import { exportIndicateurSuiviDetailToPDF } from "@/lib/exportFicheUtils";
import { toast } from "@/hooks/use-toast";
import CDPUnitAggregation from "@/components/cdp/CDPUnitAggregation";
import { getUniteMesureIdsForIndicator } from "@/data/referentielIndicateurs";
import ShareByEmailDialog from "@/components/share/ShareByEmailDialog";


interface IndicateurSuiviDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicateur: FicheIndicateur["indicateurs"][0] | null;
  projectName: string;
  dateCollecte: string;
  ficheCode: string;
  // Données trimestrielles
  quarterlyValues: {
    t1: number | null;
    t2: number | null;
    t3: number | null;
    t4: number | null;
  };
  // Indicateur PTA si disponible
  ptaData?: {
    annualTarget?: number;
    targetT1?: number;
    targetT2?: number;
    targetT3?: number;
    targetT4?: number;
  };
  // Historique des valeurs
  historique?: {
    date: string;
    value: number;
  }[];
  // Édition par indicateur (popup)
  editable?: boolean;
  onSave?: (updated: { currentValue: number; comment?: string }) => void;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("fr-FR").format(value);
};

const IndicateurSuiviDetail = ({
  open,
  onOpenChange,
  indicateur,
  projectName,
  dateCollecte,
  ficheCode,
  quarterlyValues,
  ptaData,
  historique = [],
  editable = false,
  onSave,
}: IndicateurSuiviDetailProps) => {
  const [editMode, setEditMode] = useState(false);
  const [currentValue, setCurrentValue] = useState<number>(indicateur?.currentValue ?? 0);
  const [comment, setComment] = useState<string>(indicateur?.comment ?? "");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setCurrentValue(indicateur?.currentValue ?? 0);
    setComment(indicateur?.comment ?? "");
    setEditMode(false);
  }, [indicateur, open]);

  if (!indicateur) return null;

  const displayValue = editMode ? currentValue : indicateur.currentValue;
  const progress = indicateur.targetValue > 0 
    ? Math.round((displayValue / indicateur.targetValue) * 100) 
    : 0;
  
  const progressColor = progress >= 100 
    ? "text-green-600" 
    : progress >= 75 
      ? "text-amber-600" 
      : "text-red-600";

  const handleSave = () => {
    if (!onSave) return;
    onSave({ currentValue, comment });
    setEditMode(false);
    toast({ title: "Indicateur mis à jour", description: "La valeur a été enregistrée" });
  };

  const handleExportPDF = () => {
    exportIndicateurSuiviDetailToPDF({
      indicateur: {
        id: indicateur.indicateurId,
        code: indicateur.indicateurCode,
        name: indicateur.indicateurName,
        unit: indicateur.unit,
        baselineValue: indicateur.baselineValue,
        targetValue: indicateur.targetValue,
        currentValue: indicateur.currentValue,
        previousValue: indicateur.previousValue,
      },
      projectName,
      dateCollecte,
      ficheCode,
      quarterlyValues,
      ptaData,
      historique,
    });
  };

  // Calculer les performances par trimestre
  const quarters = [
    { key: 't1', label: 'T1', value: quarterlyValues.t1, target: ptaData?.targetT1, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30', barColor: 'bg-blue-500' },
    { key: 't2', label: 'T2', value: quarterlyValues.t2, target: ptaData?.targetT2, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30', barColor: 'bg-green-500' },
    { key: 't3', label: 'T3', value: quarterlyValues.t3, target: ptaData?.targetT3, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30', barColor: 'bg-amber-500' },
    { key: 't4', label: 'T4', value: quarterlyValues.t4, target: ptaData?.targetT4, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30', barColor: 'bg-purple-500' },
  ];

  // Calculer le cumul
  const cumulValue = (quarterlyValues.t1 || 0) + (quarterlyValues.t2 || 0) + (quarterlyValues.t3 || 0) + (quarterlyValues.t4 || 0);
  const cumulTarget = (ptaData?.targetT1 || 0) + (ptaData?.targetT2 || 0) + (ptaData?.targetT3 || 0) + (ptaData?.targetT4 || 0);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <Badge variant="outline" className="text-[10px] h-5">{indicateur.indicateurCode}</Badge>
              </div>
              <DialogTitle className="text-base leading-tight">
                {indicateur.indicateurName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>{projectName}</span>
                <span>•</span>
                <Calendar className="w-3 h-3" />
                <span>{format(parseISO(dateCollecte), "dd MMM yyyy", { locale: fr })}</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1">
              {editable && !editMode && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setEditMode(true)}
                >
                  <Edit2 className="h-3 w-3" />
                  Modifier
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShareOpen(true)}
              >
                <Send className="h-3 w-3" />
                Partager
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs gap-1"
                onClick={handleExportPDF}
              >
                <FileDown className="h-3 w-3" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Atteinte globale */}
          <div className="p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Atteinte globale</span>
              <Badge className={cn("text-xs", progress >= 100 ? "bg-green-100 text-green-800" : progress >= 75 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800")}>
                {progress}%
              </Badge>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Valeur actuelle: <span className="font-bold text-foreground">{formatNumber(displayValue)}</span> {indicateur.unit}</span>
              <span>Cible: {formatNumber(indicateur.targetValue)}</span>
            </div>
          </div>

          {/* Édition par indicateur */}
          {editable && editMode && (
            <div className="p-3 border-2 border-primary/30 rounded-lg bg-primary/5 space-y-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Modifier la valeur réalisée</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Valeur réalisée ({indicateur.unit})</Label>
                  <Input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(Number(e.target.value))}
                    className="h-8 text-sm font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cible</Label>
                  <Input value={formatNumber(indicateur.targetValue)} disabled className="h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Commentaire</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Justification, contexte..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Valeurs de référence */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-md bg-muted/40 text-center">
              <p className="text-[10px] text-muted-foreground">Référence</p>
              <p className="text-sm font-semibold">{formatNumber(indicateur.baselineValue)}</p>
            </div>
            <div className="p-2 rounded-md bg-muted/40 text-center">
              <p className="text-[10px] text-muted-foreground">Valeur préc.</p>
              <p className="text-sm font-semibold">{formatNumber(indicateur.previousValue)}</p>
            </div>
            <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-center">
              <p className="text-[10px] text-muted-foreground">Unité</p>
              <p className="text-sm font-semibold text-primary">{indicateur.unit}</p>
            </div>
          </div>

          {/* Unités de mesure & agrégation PTA */}
          <CDPUnitAggregation
            uniteMesureIds={getUniteMesureIdsForIndicator(indicateur.indicateurId, indicateur.indicateurCode)}
            year={new Date(dateCollecte).getFullYear()}
            resultUnit={indicateur.unit}
            variant="full"
          />

          {/* Performances trimestrielles - Réalisations vs Cibles */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium">Performances par trimestre</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="py-2 px-3">Trimestre</TableHead>
                  <TableHead className="py-2 px-3 text-right">Cible PTA</TableHead>
                  <TableHead className="py-2 px-3 text-right">Réalisé</TableHead>
                  <TableHead className="py-2 px-3 text-right">Écart</TableHead>
                  <TableHead className="py-2 px-3 w-24">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quarters.map((q) => {
                  const qPerf = q.target && q.target > 0 && q.value !== null 
                    ? Math.round((q.value / q.target) * 100) 
                    : null;
                  const ecart = q.target && q.value !== null ? q.value - q.target : null;
                  
                  return (
                    <TableRow key={q.key} className="text-xs">
                      <TableCell className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", q.barColor)}></span>
                          <span className={cn("font-medium", q.color)}>{q.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right font-mono">
                        {q.target ? formatNumber(q.target) : '-'}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right font-mono font-medium">
                        {q.value !== null ? formatNumber(q.value) : '-'}
                      </TableCell>
                      <TableCell className={cn(
                        "py-2 px-3 text-right font-mono",
                        ecart !== null && ecart >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {ecart !== null ? (ecart >= 0 ? '+' : '') + formatNumber(ecart) : '-'}
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        {qPerf !== null ? (
                          <div className="flex items-center gap-1">
                            <Progress value={Math.min(qPerf, 100)} className="h-1.5 w-12" />
                            <span className={cn(
                              "text-[10px] font-medium",
                              qPerf >= 100 ? "text-green-600" : qPerf >= 75 ? "text-amber-600" : "text-red-600"
                            )}>
                              {qPerf}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Ligne cumulé */}
                <TableRow className="text-xs font-medium bg-primary/5">
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      <span className="text-primary">Cumulé</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right font-mono">
                    {cumulTarget > 0 ? formatNumber(cumulTarget) : formatNumber(indicateur.targetValue)}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right font-mono font-bold text-primary">
                    {formatNumber(indicateur.currentValue)}
                  </TableCell>
                  <TableCell className={cn(
                    "py-2 px-3 text-right font-mono font-bold",
                    indicateur.currentValue - indicateur.targetValue >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {indicateur.currentValue - indicateur.targetValue >= 0 ? '+' : ''}
                    {formatNumber(indicateur.currentValue - indicateur.targetValue)}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Progress value={Math.min(progress, 100)} className="h-1.5 w-12" />
                      <span className={cn("text-[10px] font-bold", progressColor)}>
                        {progress}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Historique des valeurs */}
          {historique.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-2 bg-muted/30 border-b">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium">Historique des valeurs</span>
              </div>
              <div className="p-2 max-h-32 overflow-y-auto">
                <div className="space-y-1">
                  {historique.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-muted/20 rounded">
                      <span className="text-muted-foreground">
                        {format(parseISO(h.date), "dd/MM/yyyy", { locale: fr })}
                      </span>
                      <span className="font-mono font-medium">{formatNumber(h.value)} {indicateur.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cibles PTA si disponibles */}
          {ptaData && ptaData.annualTarget && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Planification PTA</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cible annuelle PTA:</span>
                <span className="font-bold text-primary">{formatNumber(ptaData.annualTarget)} {indicateur.unit}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {editable && editMode && (
            <Button size="sm" onClick={handleSave} className="gap-1">
              <Save className="w-3.5 h-3.5" />
              Enregistrer
            </Button>
          )}
          {!editable && (
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <Lock className="w-3 h-3" /> Fiche verrouillée
            </span>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ShareByEmailDialog
      open={shareOpen}
      onOpenChange={setShareOpen}
      subject={`Indicateur — ${indicateur.indicateurName}`}
      contextLabel={`${projectName} • ${indicateur.indicateurCode}`}
      attachmentName={`indicateur-${indicateur.indicateurCode}.pdf`}
      htmlPreview={`
        <h2 style="margin:0 0 8px 0;">${indicateur.indicateurName}</h2>
        <p style="margin:0 0 12px 0;color:#666;font-size:12px;">${indicateur.indicateurCode} • ${projectName}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Cible</strong></td><td style="padding:4px 8px;">${new Intl.NumberFormat('fr-FR').format(indicateur.targetValue)} ${indicateur.unit}</td></tr>
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Réalisé</strong></td><td style="padding:4px 8px;">${new Intl.NumberFormat('fr-FR').format(currentValue)} ${indicateur.unit}</td></tr>
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Atteinte</strong></td><td style="padding:4px 8px;">${progress}%</td></tr>
          <tr><td style="padding:4px 8px;background:#f5f5f5;"><strong>Cumul T1-T4</strong></td><td style="padding:4px 8px;">${new Intl.NumberFormat('fr-FR').format(cumulValue)} / ${new Intl.NumberFormat('fr-FR').format(cumulTarget)}</td></tr>
        </table>
      `}
    />
    </>
  );
};

export default IndicateurSuiviDetail;
