import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  FileText,
  Lock,
  Unlock,
  Archive,
  Copy,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { PTA, PTA_STATUS_LABELS, PTA_STATUS_COLORS, generatePTACode } from "@/types/pta";

interface PTAManagerProps {
  ptaList: PTA[];
  selectedPTA: PTA | null;
  onSelectPTA: (pta: PTA) => void;
  onCreatePTA: (pta: PTA) => void;
  onUpdatePTA: (pta: PTA) => void;
  onOpenPTA: (pta: PTA) => void;
  onClosePTA: (pta: PTA) => void;
  onArchivePTA: (pta: PTA) => void;
  onDuplicatePTA: (pta: PTA, newYear: number) => void;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} Mds`;
  }
  if (amount === 0) return "0";
  return `${formatNumber(Math.round(amount / 1000000))} M`;
};

const PTAManager = ({
  ptaList,
  selectedPTA,
  onSelectPTA,
  onCreatePTA,
  onOpenPTA,
  onClosePTA,
  onArchivePTA,
  onDuplicatePTA,
}: PTAManagerProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "open" | "close" | "archive"; pta: PTA } | null>(null);
  const [ptaToDuplicate, setPtaToDuplicate] = useState<PTA | null>(null);

  // Form states
  const [newPTAName, setNewPTAName] = useState("");
  const [newPTAYear, setNewPTAYear] = useState(new Date().getFullYear());
  const [newPTADescription, setNewPTADescription] = useState("");
  const [duplicateYear, setDuplicateYear] = useState(new Date().getFullYear() + 1);

  const handleCreatePTA = () => {
    const existingVersions = ptaList.filter(p => p.year === newPTAYear);
    const newVersion = existingVersions.length + 1;

    const newPTA: PTA = {
      id: `pta-${Date.now()}`,
      code: generatePTACode(newPTAYear, newVersion),
      name: newPTAName || `Plan de Travail Annuel ${newPTAYear}`,
      year: newPTAYear,
      status: "brouillon",
      version: newVersion,
      description: newPTADescription,
      createdAt: new Date().toISOString(),
      createdBy: "Utilisateur actuel",
      activities: [],
      indicators: [],
      totalBudget: 0,
    };

    onCreatePTA(newPTA);
    setCreateDialogOpen(false);
    resetForm();
    toast.success(`PTA ${newPTA.code} créé avec succès`);
  };

  const handleDuplicate = () => {
    if (!ptaToDuplicate) return;
    onDuplicatePTA(ptaToDuplicate, duplicateYear);
    setDuplicateDialogOpen(false);
    setPtaToDuplicate(null);
    toast.success(`PTA dupliqué pour l'année ${duplicateYear}`);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case "open":
        onOpenPTA(confirmAction.pta);
        toast.success(`PTA ${confirmAction.pta.code} ouvert avec succès`);
        break;
      case "close":
        onClosePTA(confirmAction.pta);
        toast.success(`PTA ${confirmAction.pta.code} clôturé avec succès`);
        break;
      case "archive":
        onArchivePTA(confirmAction.pta);
        toast.success(`PTA ${confirmAction.pta.code} archivé avec succès`);
        break;
    }
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const resetForm = () => {
    setNewPTAName("");
    setNewPTAYear(new Date().getFullYear());
    setNewPTADescription("");
  };

  const openConfirmDialog = (type: "open" | "close" | "archive", pta: PTA) => {
    setConfirmAction({ type, pta });
    setConfirmDialogOpen(true);
  };

  const openDuplicateDialog = (pta: PTA) => {
    setPtaToDuplicate(pta);
    setDuplicateYear(pta.year + 1);
    setDuplicateDialogOpen(true);
  };

  const getConfirmDialogContent = () => {
    if (!confirmAction) return { title: "", description: "" };

    switch (confirmAction.type) {
      case "open":
        return {
          title: "Ouvrir le PTA",
          description: `Êtes-vous sûr de vouloir ouvrir le PTA "${confirmAction.pta.code}" ? Une fois ouvert, les activités seront en cours d'exécution.`,
        };
      case "close":
        return {
          title: "Clôturer le PTA",
          description: `Êtes-vous sûr de vouloir clôturer le PTA "${confirmAction.pta.code}" ? Cette action finalisera l'exercice.`,
        };
      case "archive":
        return {
          title: "Archiver le PTA",
          description: `Êtes-vous sûr de vouloir archiver le PTA "${confirmAction.pta.code}" ?`,
        };
    }
  };

  const sortedPTAList = [...ptaList].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.version - a.version;
  });

  // Group by year
  const ptaByYear = sortedPTAList.reduce((acc, pta) => {
    if (!acc[pta.year]) acc[pta.year] = [];
    acc[pta.year].push(pta);
    return acc;
  }, {} as Record<number, PTA[]>);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* PTA Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {selectedPTA ? (
                  <span className="font-medium">{selectedPTA.code}</span>
                ) : (
                  <span className="text-muted-foreground">Sélectionner un PTA</span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[280px]">
            {Object.entries(ptaByYear).map(([year, ptas]) => (
              <DropdownMenuGroup key={year}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Exercice {year}
                </DropdownMenuLabel>
                {ptas.map((pta) => (
                  <DropdownMenuItem
                    key={pta.id}
                    onClick={() => onSelectPTA(pta)}
                    className={selectedPTA?.id === pta.id ? "bg-muted" : ""}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{pta.code}</span>
                        <Badge className={`text-[10px] px-1 py-0 ${PTA_STATUS_COLORS[pta.status]}`}>
                          {PTA_STATUS_LABELS[pta.status]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatBudget(pta.totalBudget)}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            ))}
            <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau PTA
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Actions for selected PTA */}
        {selectedPTA && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Actions {selectedPTA.code}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {selectedPTA.status === "brouillon" && (
                <DropdownMenuItem onClick={() => openConfirmDialog("open", selectedPTA)}>
                  <Unlock className="w-4 h-4 mr-2" />
                  Ouvrir le PTA
                </DropdownMenuItem>
              )}
              {selectedPTA.status === "ouvert" && (
                <DropdownMenuItem onClick={() => openConfirmDialog("close", selectedPTA)}>
                  <Lock className="w-4 h-4 mr-2" />
                  Clôturer le PTA
                </DropdownMenuItem>
              )}
              {selectedPTA.status === "cloture" && (
                <DropdownMenuItem onClick={() => openConfirmDialog("archive", selectedPTA)}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archiver
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openDuplicateDialog(selectedPTA)}>
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer vers autre année
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Create PTA Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau PTA</DialogTitle>
            <DialogDescription>
              Créez un nouveau Plan de Travail Annuel pour planifier les activités de l'exercice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pta-year">Année *</Label>
              <Input
                id="pta-year"
                type="number"
                min={2020}
                max={2050}
                value={newPTAYear}
                onChange={(e) => setNewPTAYear(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pta-name">Nom (optionnel)</Label>
              <Input
                id="pta-name"
                placeholder={`Plan de Travail Annuel ${newPTAYear}`}
                value={newPTAName}
                onChange={(e) => setNewPTAName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pta-description">Description (optionnel)</Label>
              <Textarea
                id="pta-description"
                placeholder="Description du PTA..."
                value={newPTADescription}
                onChange={(e) => setNewPTADescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePTA}>
              <Plus className="w-4 h-4 mr-2" />
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate PTA Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer le PTA</DialogTitle>
            <DialogDescription>
              Créer une copie du PTA {ptaToDuplicate?.code} pour une nouvelle année.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-year">Année cible *</Label>
              <Input
                id="duplicate-year"
                type="number"
                min={2020}
                max={2050}
                value={duplicateYear}
                onChange={(e) => setDuplicateYear(parseInt(e.target.value))}
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {ptaToDuplicate?.activities.length || 0} activités seront dupliquées
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Dupliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getConfirmDialogContent().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmDialogContent().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PTAManager;
