import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FicheIndicateur, FicheSuiviStatus } from "@/types/workflow";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Save, 
  Send, 
  CheckCircle, 
  Lock, 
  Calendar,
  TrendingUp,
  Target,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import AttachmentManager from "@/components/ui/AttachmentManager";
import CommentManager from "@/components/ui/CommentManager";
import { Attachment } from "@/types/attachment";
import { Comment } from "@/types/comment";
import { toast } from "@/hooks/use-toast";
import CDPUnitAggregation from "@/components/cdp/CDPUnitAggregation";
import { getUniteMesureIdsForIndicator } from "@/data/referentielIndicateurs";


interface FicheIndicateurFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiche: FicheIndicateur | null;
  onSubmit: (ficheId: string, formData: any, action: "save" | "submit") => void;
  onValidate?: (ficheId: string) => void;
  onApprove?: (ficheId: string) => void;
}

const statusConfig: Record<FicheSuiviStatus, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "bg-slate-100 text-slate-800" },
  soumis: { label: "Soumis", color: "bg-blue-100 text-blue-800" },
  valide: { label: "Validé", color: "bg-amber-100 text-amber-800" },
  approuve: { label: "Approuvé", color: "bg-green-100 text-green-800" },
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("fr-FR").format(value);
};

const FicheIndicateurForm = ({
  open,
  onOpenChange,
  fiche,
  onSubmit,
  onValidate,
  onApprove,
}: FicheIndicateurFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [indicateurs, setIndicateurs] = useState<FicheIndicateur["indicateurs"]>([]);
  const [observations, setObservations] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // Reset state when fiche changes
  useEffect(() => {
    if (fiche) {
      setIndicateurs(fiche.indicateurs || []);
      setObservations(fiche.observations || "");
    }
  }, [fiche]);

  if (!fiche) return null;

  const isEditable = fiche.status === "brouillon";
  const canSubmit = fiche.status === "brouillon";
  const canValidate = fiche.status === "soumis";
  const canApprove = fiche.status === "valide";

  const handleIndicateurChange = (indicateurId: string, field: "currentValue" | "comment", value: string | number) => {
    setIndicateurs(prev => prev.map(ind => 
      ind.indicateurId === indicateurId 
        ? { ...ind, [field]: field === "currentValue" ? Number(value) : value }
        : ind
    ));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      onSubmit(fiche.id, { indicateurs, observations }, "save");
      toast({ title: "Fiche enregistrée", description: "Les modifications ont été enregistrées" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFiche = async () => {
    setIsSubmitting(true);
    try {
      onSubmit(fiche.id, { indicateurs, observations }, "submit");
      toast({ title: "Fiche soumise", description: "La fiche indicateurs a été soumise pour validation" });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidate = () => {
    if (onValidate) {
      onValidate(fiche.id);
      toast({ title: "Fiche validée", description: "La fiche indicateurs a été validée" });
      onOpenChange(false);
    }
  };

  const handleApprove = () => {
    if (onApprove) {
      onApprove(fiche.id);
      toast({ title: "Fiche approuvée", description: "La fiche indicateurs a été approuvée" });
      onOpenChange(false);
    }
  };

  // Calcul du taux d'atteinte global
  const globalProgress = indicateurs.length > 0
    ? Math.round(indicateurs.reduce((sum, ind) => sum + (ind.targetValue > 0 ? (ind.currentValue / ind.targetValue) * 100 : 0), 0) / indicateurs.length)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Fiche Indicateurs</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <span className="font-mono text-xs">{fiche.code}</span>
                  <span>•</span>
                  <span>{fiche.projectName}</span>
                </DialogDescription>
              </div>
            </div>
            <Badge className={cn("text-xs", statusConfig[fiche.status].color)}>
              {!isEditable && <Lock className="w-3 h-3 mr-1" />}
              {statusConfig[fiche.status].label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info collecte */}
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {format(parseISO(fiche.dateCollecte), "dd MMMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span>{indicateurs.length} indicateur(s)</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Atteinte globale: {globalProgress}%</span>
              <Progress value={globalProgress} className="w-20 h-2" />
            </div>
          </div>

          {/* Valeurs trimestrielles par indicateur */}
          <div className="p-3 border rounded-lg bg-muted/20">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Valeurs atteintes par trimestre (global)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['T1', 'T2', 'T3', 'T4'] as const).map((trimestre, idx) => {
                // Simulation des valeurs trimestrielles totales
                const quarterTotal = idx < 2 ? indicateurs.reduce((sum, ind) => sum + Math.round(ind.currentValue * (0.4 + idx * 0.3)), 0) : null;
                const textColors = ['text-blue-600', 'text-green-600', 'text-amber-600', 'text-purple-600'];
                return (
                  <div key={trimestre} className="text-center p-2 border rounded-md bg-background">
                    <div className={cn("text-[10px] font-semibold mb-1", textColors[idx])}>
                      {trimestre}
                    </div>
                    <div className="text-sm font-bold">
                      {quarterTotal !== null ? formatNumber(quarterTotal) : '-'}
                    </div>
                  </div>
                );
              })}
              <div className="text-center p-2 border rounded-md bg-primary/5 border-primary/20">
                <div className="text-[10px] font-semibold mb-1 text-primary">
                  Cumulé
                </div>
                <div className="text-sm font-bold text-primary">
                  {formatNumber(indicateurs.reduce((sum, ind) => sum + ind.currentValue, 0))}
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des indicateurs */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Indicateur</TableHead>
                  <TableHead className="text-xs w-20 text-right">Réf.</TableHead>
                  <TableHead className="text-xs w-20 text-right">Cible</TableHead>
                  <TableHead className="text-xs w-20 text-right">Préc.</TableHead>
                  <TableHead className="text-xs w-28 text-right">Actuel</TableHead>
                  <TableHead className="text-xs w-24 text-right">Atteinte</TableHead>
                  <TableHead className="text-xs w-32">Commentaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicateurs.map((ind) => {
                  const progress = ind.targetValue > 0 ? Math.round((ind.currentValue / ind.targetValue) * 100) : 0;
                  const progressColor = progress >= 100 ? "text-green-600" : progress >= 75 ? "text-amber-600" : "text-red-600";
                  
                  return (
                    <TableRow key={ind.indicateurId}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{ind.indicateurName}</p>
                          <p className="text-xs text-muted-foreground">{ind.unit}</p>
                          <CDPUnitAggregation
                            uniteMesureIds={getUniteMesureIdsForIndicator(ind.indicateurId, ind.indicateurCode)}
                            year={new Date(fiche.dateCollecte).getFullYear()}
                            resultUnit={ind.unit}
                            variant="compact"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatNumber(ind.baselineValue)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatNumber(ind.targetValue)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatNumber(ind.previousValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditable ? (
                          <Input
                            type="number"
                            value={ind.currentValue}
                            onChange={(e) => handleIndicateurChange(ind.indicateurId, "currentValue", e.target.value)}
                            className="h-7 w-24 text-right text-sm"
                          />
                        ) : (
                          <span className="font-medium">{formatNumber(ind.currentValue)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Progress value={Math.min(progress, 100)} className="w-12 h-1.5" />
                          <span className={cn("text-xs font-medium", progressColor)}>{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isEditable ? (
                          <Input
                            value={ind.comment || ""}
                            onChange={(e) => handleIndicateurChange(ind.indicateurId, "comment", e.target.value)}
                            placeholder="Note..."
                            className="h-7 text-xs"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">{ind.comment || "-"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Observations */}
          <div>
            <Label className="text-sm">Observations générales</Label>
            {isEditable ? (
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observations sur l'évolution des indicateurs..."
                className="mt-1"
                rows={2}
              />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground bg-muted/30 rounded p-2">
                {observations || "Aucune observation"}
              </p>
            )}
          </div>

          {/* Historique */}
          {(fiche.submittedAt || fiche.validatedAt || fiche.approvedAt) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground p-2 bg-muted/20 rounded">
              {fiche.submittedAt && (
                <span>Soumis le {format(parseISO(fiche.submittedAt), "dd/MM/yyyy", { locale: fr })}</span>
              )}
              {fiche.validatedAt && (
                <span>• Validé le {format(parseISO(fiche.validatedAt), "dd/MM/yyyy", { locale: fr })}</span>
              )}
              {fiche.approvedAt && (
                <span>• Approuvé le {format(parseISO(fiche.approvedAt), "dd/MM/yyyy", { locale: fr })}</span>
              )}
            </div>
          )}

          {/* Documents & Commentaires */}
          <div className="border-t pt-3 mt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Documents & Commentaires</span>
              </div>
              <div className="flex items-center gap-2">
                <AttachmentManager
                  attachments={attachments}
                  onAttachmentsChange={isEditable ? setAttachments : undefined}
                  readOnly={!isEditable}
                  compact
                />
                <CommentManager
                  comments={comments}
                  onCommentsChange={setComments}
                  readOnly={false}
                  currentUser="Utilisateur"
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <div className="flex items-center gap-2">
              {canSubmit && (
                <>
                  <Button variant="outline" onClick={handleSave} disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button onClick={handleSubmitFiche} disabled={isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    Soumettre
                  </Button>
                </>
              )}
              {canValidate && onValidate && (
                <Button onClick={handleValidate} className="bg-amber-600 hover:bg-amber-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider
                </Button>
              )}
              {canApprove && onApprove && (
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FicheIndicateurForm;
