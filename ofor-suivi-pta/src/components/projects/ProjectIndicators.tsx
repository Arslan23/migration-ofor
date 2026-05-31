import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, TrendingUp, Target, Eye } from "lucide-react";
import { Indicator } from "@/types/project";
import IndicatorForm from "./IndicatorForm";
import IndicatorPicker from "./IndicatorPicker";
import { Activity } from "@/types/project";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF, formatMontant } from "@/lib/exportUtils";
import { toast } from "sonner";
interface ProjectIndicatorsProps {
  indicators: Indicator[];
  onAdd: (indicator: Omit<Indicator, "id">) => void;
  onEdit: (id: string, indicator: Partial<Indicator>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  planningMode?: boolean; // Hide progress/current values - only show targets
  viewOnly?: boolean; // Hide action buttons but allow viewing details in popup
  // Activités du projet — utilisées pour suggérer des indicateurs pertinents (natures + livrables)
  activities?: Activity[];
}

const ProjectIndicators = ({
  indicators,
  onAdd,
  onEdit,
  onDelete,
  readOnly = false,
  planningMode = false,
  viewOnly = false,
  activities = [],
}: ProjectIndicatorsProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);

  const hideActionButtons = viewOnly || readOnly;

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return "bg-secondary";
    if (percentage >= 60) return "bg-primary";
    return "bg-amber-500";
  };

  const handleEdit = (indicator: Indicator) => {
    setEditingIndicator(indicator);
    setShowForm(true);
  };

  const handleSubmit = (data: Omit<Indicator, "id">) => {
    if (editingIndicator) {
      onEdit(editingIndicator.id, data);
    } else {
      onAdd(data);
    }
    setEditingIndicator(null);
  };

  // Export functions
  const handleExportCSV = () => {
    const columns = [
      { key: "code", header: "Code" },
      { key: "name", header: "Indicateur" },
      { key: "type", header: "Type" },
      { key: "unit", header: "Unité" },
      { key: "baselineValue", header: "Référence" },
      { key: "targetValue", header: "Cible" },
      { key: "currentValue", header: "Actuel" },
      { key: "progress", header: "Progression (%)" },
    ];
    const data = indicators.map((i) => ({
      ...i,
      progress: i.targetValue > 0 ? Math.round((i.currentValue / i.targetValue) * 100) : 0,
    }));
    exportToCSV(data, columns, "indicateurs");
    toast.success("Export CSV généré");
  };

  const handleExportPDF = () => {
    const columns = [
      { key: "code", header: "Code", width: "10%" },
      { key: "name", header: "Indicateur", width: "30%" },
      { key: "unit", header: "Unité", width: "10%" },
      { key: "baselineValue", header: "Réf.", width: "12%" },
      { key: "targetValue", header: "Cible", width: "12%" },
      { key: "currentValue", header: "Actuel", width: "12%" },
      { key: "progress", header: "Prog.", width: "14%" },
    ];
    const data = indicators.map((i) => ({
      code: i.code,
      name: i.name,
      unit: i.unit,
      baselineValue: i.baselineValue,
      targetValue: i.targetValue,
      currentValue: i.currentValue,
      progress: `${i.targetValue > 0 ? Math.round((i.currentValue / i.targetValue) * 100) : 0}%`,
    }));
    exportToPDF("Liste des Indicateurs", data, columns, "indicateurs", {
      subtitle: `${indicators.length} indicateur(s)`,
    });
    toast.success("Export PDF généré");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Indicateurs de performance ({indicators.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          {indicators.length > 0 && (
            <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          )}
          {!hideActionButtons && (
            <Button onClick={() => setShowPicker(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Choisir depuis le référentiel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {indicators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun indicateur défini</p>
            <p className="text-xs mt-1">Les indicateurs sont sélectionnés depuis le référentiel central</p>
            {!hideActionButtons && (
              <Button variant="outline" className="mt-4" onClick={() => setShowPicker(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Choisir depuis le référentiel
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Indicateur</TableHead>
                {!viewOnly && <TableHead>Unité</TableHead>}
                {!viewOnly && <TableHead className="text-right">Référence</TableHead>}
                <TableHead className="text-right">Cible</TableHead>
                {!planningMode && (
                  <>
                    <TableHead className="text-right">Actuel</TableHead>
                    <TableHead className="w-32">Progression</TableHead>
                  </>
                )}
                <TableHead className="w-12"></TableHead>
                {!hideActionButtons && <TableHead className="w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.map((indicator) => {
                const progress = indicator.targetValue > 0 
                  ? Math.round((indicator.currentValue / indicator.targetValue) * 100)
                  : 0;
                
                return (
                  <TableRow 
                    key={indicator.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedIndicator(indicator)}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {indicator.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{indicator.name}</p>
                        {indicator.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {indicator.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    {!viewOnly && (
                      <TableCell>
                        <span className="badge-status bg-muted text-muted-foreground">
                          {indicator.unit}
                        </span>
                      </TableCell>
                    )}
                    {!viewOnly && (
                      <TableCell className="text-right font-mono">
                        {indicator.baselineValue.toLocaleString("fr-FR")}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono font-medium">
                      {indicator.targetValue.toLocaleString("fr-FR")}
                    </TableCell>
                    {!planningMode && (
                      <>
                        <TableCell className="text-right font-mono">
                          <span className={cn(
                            "font-semibold",
                            progress >= 90 ? "text-secondary" : progress >= 60 ? "text-primary" : "text-amber-600"
                          )}>
                            {indicator.currentValue.toLocaleString("fr-FR")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={Math.min(progress, 100)} 
                              className="h-2 flex-1"
                            />
                            <span className="text-sm font-medium w-12 text-right">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                      </>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    {!hideActionButtons && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(indicator);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'indicateur ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. L'indicateur "{indicator.name}" sera définitivement supprimé.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(indicator.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <IndicatorPicker
          open={showPicker}
          onOpenChange={setShowPicker}
          activities={activities}
          existingIndicators={indicators}
          onConfirm={(items) => items.forEach((it) => onAdd(it))}
        />

        <IndicatorForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditingIndicator(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingIndicator || undefined}
          isEditing={!!editingIndicator}
        />

        {/* Detail popup for viewOnly mode */}
        <Dialog open={!!selectedIndicator} onOpenChange={(open) => !open && setSelectedIndicator(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Détail de l'indicateur
              </DialogTitle>
            </DialogHeader>
            {selectedIndicator && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Code</p>
                    <p className="font-mono font-medium">{selectedIndicator.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Unité</p>
                    <p className="font-medium">{selectedIndicator.unit}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">Indicateur</p>
                  <p className="font-medium">{selectedIndicator.name}</p>
                </div>

                {selectedIndicator.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedIndicator.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Valeur de référence</p>
                    <p className="text-xl font-bold">{selectedIndicator.baselineValue.toLocaleString("fr-FR")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valeur cible</p>
                    <p className="text-xl font-bold text-primary">{selectedIndicator.targetValue.toLocaleString("fr-FR")}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProjectIndicators;
