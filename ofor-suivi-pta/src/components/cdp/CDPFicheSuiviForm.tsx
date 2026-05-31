import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CDPFicheSuiviIndicateur, CDP_FICHE_STATUS_LABELS, CDP_FICHE_STATUS_COLORS, calculatePerformanceRate } from "@/types/cdp";
import { Attachment } from "@/types/attachment";
import { Comment } from "@/types/comment";
import { cn } from "@/lib/utils";
import { formatMontant } from "@/lib/exportUtils";
import AttachmentManager from "@/components/ui/AttachmentManager";
import CommentManager from "@/components/ui/CommentManager";
import CDPUnitAggregation from "@/components/cdp/CDPUnitAggregation";

interface CDPFicheSuiviFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiche: CDPFicheSuiviIndicateur;
  onSave: (fiche: CDPFicheSuiviIndicateur) => void;
  readOnly?: boolean;
}

const CDPFicheSuiviForm = ({ open, onOpenChange, fiche, onSave, readOnly = false }: CDPFicheSuiviFormProps) => {
  const [currentValue, setCurrentValue] = useState(fiche.currentValue || 0);
  const [observations, setObservations] = useState(fiche.observations || "");
  const [attachments, setAttachments] = useState<Attachment[]>(fiche.attachments || []);
  const [comments, setComments] = useState<Comment[]>(fiche.comments || []);

  const performanceRate = calculatePerformanceRate(fiche.targetValue, currentValue);

  const handleSubmit = () => {
    onSave({
      ...fiche,
      currentValue,
      performanceRate,
      observations,
      attachments,
      comments,
    });
    onOpenChange(false);
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 100) return "text-green-600";
    if (rate >= 80) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Fiche de suivi indicateur
            <Badge className={cn("text-xs ml-2", CDP_FICHE_STATUS_COLORS[fiche.status])}>
              {CDP_FICHE_STATUS_LABELS[fiche.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Code</span>
              <span className="font-mono text-sm">{fiche.indicateurCode}</span>
            </div>
            <div>
              <span className="text-sm font-medium">{fiche.indicateurName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Composante</span>
              <Badge variant="outline" className="text-xs">{fiche.composanteName}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">Cible</Label>
              <p className="text-xl font-bold">{formatMontant(fiche.targetValue)} <span className="text-sm font-normal">{fiche.unit}</span></p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">Performance</Label>
              <p className={cn("text-xl font-bold", getPerformanceColor(performanceRate))}>
                {performanceRate}%
              </p>
            </div>
          </div>

          <div>
            <Label>Valeur réalisée ({fiche.unit})</Label>
            <Input 
              type="number" 
              value={currentValue} 
              onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
              disabled={readOnly}
              className="text-lg font-semibold"
            />
          </div>

          <CDPUnitAggregation uniteMesureIds={fiche.uniteMesureIds} resultUnit={fiche.unit} variant="full" />

          <div>
            <Label>Observations</Label>
            <Textarea 
              value={observations} 
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              disabled={readOnly}
              placeholder="Commentaires, justifications..."
            />
          </div>

          <Separator />

          {/* Section Documents et Commentaires */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Documents & Commentaires</Label>
              <div className="flex items-center gap-2">
                <AttachmentManager
                  attachments={attachments}
                  onAttachmentsChange={readOnly ? undefined : setAttachments}
                  readOnly={readOnly}
                  maxFiles={5}
                  compact
                />
                <CommentManager
                  comments={comments}
                  onCommentsChange={readOnly ? undefined : setComments}
                  readOnly={readOnly}
                  maxComments={10}
                  currentUser="Utilisateur actuel"
                  compact
                />
              </div>
            </div>
          </div>

          {fiche.approvedAt && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              Approuvé le {new Date(fiche.approvedAt).toLocaleDateString('fr-FR')} par {fiche.approvedBy}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "Fermer" : "Annuler"}
          </Button>
          {!readOnly && <Button onClick={handleSubmit}>Enregistrer</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CDPFicheSuiviForm;
