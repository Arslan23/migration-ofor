import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus } from "lucide-react";

export interface CDPCollecteSuivi {
  id: string;
  evaluationId: string;
  date: string;
  libelle: string;
  observations?: string;
  createdAt: string;
  createdBy: string;
  status: "brouillon" | "soumis" | "valide" | "approuve";
  submittedAt?: string;
  submittedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface CDPCollecteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationId: string;
  year: number;
  existingCollectes: CDPCollecteSuivi[];
  onSave: (collecte: Omit<CDPCollecteSuivi, "id" | "createdAt" | "createdBy" | "status">) => void;
}

const CDPCollecteForm = ({ open, onOpenChange, evaluationId, year, existingCollectes, onSave }: CDPCollecteFormProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [libelle, setLibelle] = useState("");
  const [observations, setObservations] = useState("");

  const handleSubmit = () => {
    if (!date || !libelle.trim()) return;

    onSave({
      evaluationId,
      date: date.toISOString(),
      libelle: libelle.trim(),
      observations: observations.trim() || undefined,
    });

    // Reset form
    setDate(new Date());
    setLibelle("");
    setObservations("");
    onOpenChange(false);
  };

  const suggestedLabels = [
    `Suivi S1 ${year}`,
    `Suivi S2 ${year}`,
    `Suivi T1 ${year}`,
    `Suivi T2 ${year}`,
    `Suivi T3 ${year}`,
    `Suivi T4 ${year}`,
    `Bilan annuel ${year}`,
    `Suivi mensuel ${format(date, "MMMM yyyy", { locale: fr })}`,
  ].filter(l => !existingCollectes.some(c => c.libelle === l));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle fiche de suivi CDP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Date de collecte *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Libellé *</Label>
            <Input
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex: Suivi S1 2024, Bilan annuel..."
              className="mt-1"
            />
            {suggestedLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestedLabels.slice(0, 4).map((label) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => setLibelle(label)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Observations</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Notes ou commentaires sur cette collecte..."
              rows={3}
              className="mt-1"
            />
          </div>

          {existingCollectes.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">Collectes existantes ({existingCollectes.length})</p>
              <div className="space-y-1 max-h-24 overflow-auto">
                {existingCollectes.map((c) => (
                  <div key={c.id} className="text-xs flex justify-between">
                    <span>{c.libelle}</span>
                    <span className="text-muted-foreground">{format(new Date(c.date), "dd/MM/yyyy")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!date || !libelle.trim()}>
            Créer la fiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CDPCollecteForm;
