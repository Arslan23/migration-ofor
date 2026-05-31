import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Target, TrendingUp, Edit2, Trash2, BarChart3, CheckCircle, Lock, Unlock, Eye, MoreHorizontal, Clock, Calendar, Activity } from "lucide-react";
import { toast } from "sonner";
import { PTAIndicatorPlanning, PTA_ITEM_VALIDATION_COLORS, PTA_ITEM_VALIDATION_LABELS } from "@/types/pta";
import { mockProjects } from "@/data/mockProjects";
import { Indicator } from "@/types/project";
import { cn } from "@/lib/utils";
interface PTAIndicatorPlanningProps {
  indicators: PTAIndicatorPlanning[];
  onChange: (indicators: PTAIndicatorPlanning[]) => void;
  year: number;
  isReadOnly?: boolean;
  canUnlock?: boolean;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(value);
};

const PTAIndicatorPlanningComponent = ({
  indicators,
  onChange,
  year,
  isReadOnly = false,
  canUnlock = true,
}: PTAIndicatorPlanningProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<PTAIndicatorPlanning | null>(null);
  const [editingIndicator, setEditingIndicator] = useState<PTAIndicatorPlanning | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>("");
  const [annualTarget, setAnnualTarget] = useState(0);
  const [targetT1, setTargetT1] = useState(0);
  const [targetT2, setTargetT2] = useState(0);
  const [targetT3, setTargetT3] = useState(0);
  const [targetT4, setTargetT4] = useState(0);

  // Get all project indicators
  const allProjectIndicators = useMemo(() => {
    const result: { projectId: string; projectName: string; indicator: Indicator }[] = [];
    mockProjects.forEach(project => {
      project.indicators?.forEach(indicator => {
        result.push({
          projectId: project.id,
          projectName: project.name,
          indicator,
        });
      });
    });
    return result;
  }, []);

  const getProjectForIndicator = (indicatorId: string) => {
    return allProjectIndicators.find(pi => pi.indicator.id === indicatorId);
  };

  const projectsWithIndicators = useMemo(() => {
    return mockProjects.filter(p => p.indicators && p.indicators.length > 0);
  }, []);

  const availableIndicators = useMemo(() => {
    if (!selectedProjectId) return [];
    const project = mockProjects.find(p => p.id === selectedProjectId);
    return project?.indicators || [];
  }, [selectedProjectId]);

  const selectedIndicatorData = useMemo(() => {
    return availableIndicators.find(i => i.id === selectedIndicatorId);
  }, [availableIndicators, selectedIndicatorId]);

  const handleOpenDialog = (indicator?: PTAIndicatorPlanning) => {
    if (indicator) {
      setEditingIndicator(indicator);
      const projectInfo = allProjectIndicators.find(
        pi => pi.indicator.id === indicator.indicatorId
      );
      setSelectedProjectId(projectInfo?.projectId || "");
      setSelectedIndicatorId(indicator.indicatorId);
      setAnnualTarget(indicator.annualTarget);
      setTargetT1(indicator.targetT1);
      setTargetT2(indicator.targetT2);
      setTargetT3(indicator.targetT3);
      setTargetT4(indicator.targetT4);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleOpenDetail = (indicator: PTAIndicatorPlanning) => {
    setSelectedIndicator(indicator);
    setDetailOpen(true);
  };

  const resetForm = () => {
    setEditingIndicator(null);
    setSelectedProjectId("");
    setSelectedIndicatorId("");
    setAnnualTarget(0);
    setTargetT1(0);
    setTargetT2(0);
    setTargetT3(0);
    setTargetT4(0);
  };

  const handleSave = () => {
    if (!selectedIndicatorData) {
      toast.error("Sélectionnez un indicateur");
      return;
    }

    const newIndicatorPlanning: PTAIndicatorPlanning = {
      indicatorId: selectedIndicatorData.id,
      indicatorName: selectedIndicatorData.name,
      indicatorCode: selectedIndicatorData.code,
      unit: selectedIndicatorData.unit,
      baselineValue: selectedIndicatorData.baselineValue,
      annualTarget,
      targetT1,
      targetT2,
      targetT3,
      targetT4,
    };

    if (editingIndicator) {
      onChange(
        indicators.map(i =>
          i.indicatorId === editingIndicator.indicatorId ? newIndicatorPlanning : i
        )
      );
      toast.success("Planification de l'indicateur mise à jour");
    } else {
      if (indicators.some(i => i.indicatorId === selectedIndicatorData.id)) {
        toast.error("Cet indicateur est déjà planifié");
        return;
      }
      onChange([...indicators, newIndicatorPlanning]);
      toast.success("Indicateur ajouté à la planification");
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (indicatorId: string) => {
    const indicator = indicators.find(i => i.indicatorId === indicatorId);
    if (indicator?.validationStatus === "valide") {
      toast.error("Impossible de supprimer un indicateur validé");
      return;
    }
    onChange(indicators.filter(i => i.indicatorId !== indicatorId));
    toast.success("Indicateur retiré de la planification");
  };

  const handleValidate = (indicatorId: string) => {
    onChange(indicators.map(i => 
      i.indicatorId === indicatorId 
        ? { ...i, validationStatus: "valide" as const, validatedAt: new Date().toISOString(), validatedBy: "Utilisateur actuel" }
        : i
    ));
    toast.success("Indicateur validé");
  };

  const handleUnlock = (indicatorId: string) => {
    onChange(indicators.map(i => 
      i.indicatorId === indicatorId 
        ? { ...i, validationStatus: "brouillon" as const, validatedAt: undefined, validatedBy: undefined }
        : i
    ));
    toast.success("Indicateur déverrouillé");
  };

  const handleAutoDistribute = () => {
    const perQuarter = Math.floor(annualTarget / 4);
    const remainder = annualTarget % 4;
    setTargetT1(perQuarter);
    setTargetT2(perQuarter);
    setTargetT3(perQuarter);
    setTargetT4(perQuarter + remainder);
  };

  const totalQuarterly = targetT1 + targetT2 + targetT3 + targetT4;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Indicateurs de performance ({indicators.length})
            </CardTitle>
            {!isReadOnly && (
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {indicators.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun indicateur planifié</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs min-w-[180px]">Indicateur</TableHead>
                    <TableHead className="text-center text-xs w-16">Unité</TableHead>
                    <TableHead className="text-center text-xs w-20">Statut</TableHead>
                    <TableHead className="text-right text-xs w-16">Réf.</TableHead>
                    <TableHead className="text-right text-xs bg-primary/5 w-20">Cible {year}</TableHead>
                    <TableHead className="text-right text-xs bg-blue-50 dark:bg-blue-950/30 w-14">T1</TableHead>
                    <TableHead className="text-right text-xs bg-emerald-50 dark:bg-emerald-950/30 w-14">T2</TableHead>
                    <TableHead className="text-right text-xs bg-amber-50 dark:bg-amber-950/30 w-14">T3</TableHead>
                    <TableHead className="text-right text-xs bg-purple-50 dark:bg-purple-950/30 w-14">T4</TableHead>
                    <TableHead className="w-20 text-center text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicators.map((indicator) => {
                    const isValidated = indicator.validationStatus === "valide";
                    return (
                    <TableRow 
                      key={indicator.indicatorId} 
                      className={cn(
                        "cursor-pointer hover:bg-muted/30 transition-colors",
                        isValidated && "bg-green-50/30 dark:bg-green-950/10"
                      )}
                      onClick={() => handleOpenDetail(indicator)}
                    >
                      <TableCell className="p-2">
                        <div className="flex items-start gap-1.5">
                          {isValidated && <Lock className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />}
                          <div className="min-w-0 space-y-1">
                            <span className="font-medium text-[10px] text-muted-foreground">{indicator.indicatorCode}</span>
                            <p className="text-xs truncate max-w-[220px]">{indicator.indicatorName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <Badge variant="outline" className="text-[10px] h-5">{indicator.unit}</Badge>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <Badge className={cn(
                          "text-[10px] h-5",
                          isValidated 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                        )}>
                          {isValidated ? "Validé" : "Brouillon"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right p-2 text-xs">
                        {formatNumber(indicator.baselineValue)}
                      </TableCell>
                      <TableCell className="text-right p-2 font-bold text-xs bg-primary/5">
                        {formatNumber(indicator.annualTarget)}
                      </TableCell>
                      <TableCell className="text-right p-2 bg-blue-50/50 dark:bg-blue-950/20 text-[11px]">
                        {formatNumber(indicator.targetT1)}
                      </TableCell>
                      <TableCell className="text-right p-2 bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px]">
                        {formatNumber(indicator.targetT2)}
                      </TableCell>
                      <TableCell className="text-right p-2 bg-amber-50/50 dark:bg-amber-950/20 text-[11px]">
                        {formatNumber(indicator.targetT3)}
                      </TableCell>
                      <TableCell className="text-right p-2 bg-purple-50/50 dark:bg-purple-950/20 text-[11px]">
                        {formatNumber(indicator.targetT4)}
                      </TableCell>
                      <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleOpenDetail(indicator)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {!isReadOnly && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                {!isValidated ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleOpenDialog(indicator)}>
                                      <Edit2 className="w-3 h-3 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleValidate(indicator.indicatorId)}>
                                      <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                                      Valider
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => handleDelete(indicator.indicatorId)}
                                    >
                                      <Trash2 className="w-3 h-3 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  canUnlock && (
                                    <DropdownMenuItem onClick={() => handleUnlock(indicator.indicatorId)}>
                                      <Unlock className="w-3 h-3 mr-2 text-amber-600" />
                                      Déverrouiller
                                    </DropdownMenuItem>
                                  )
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md p-4">
          <DialogHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base leading-tight flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary shrink-0" />
                  {selectedIndicator?.indicatorName}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[10px] h-5">{selectedIndicator?.indicatorCode}</Badge>
                  <Badge className={cn(
                    "text-[10px] h-5",
                    selectedIndicator?.validationStatus === "valide"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                  )}>
                    {selectedIndicator?.validationStatus === "valide" ? (
                      <><Lock className="w-2.5 h-2.5 mr-0.5" /> Validé</>
                    ) : (
                      <><Unlock className="w-2.5 h-2.5 mr-0.5" /> Brouillon</>
                    )}
                  </Badge>
                </div>
              </div>
              {!isReadOnly && selectedIndicator && (
                <div className="flex gap-1 shrink-0">
                  {selectedIndicator.validationStatus !== "valide" ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs text-green-600 hover:text-green-700 px-2"
                        onClick={() => { handleValidate(selectedIndicator.indicatorId); setDetailOpen(false); }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valider
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => { handleOpenDialog(selectedIndicator); setDetailOpen(false); }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    canUnlock && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs text-amber-600 hover:text-amber-700 px-2"
                        onClick={() => { handleUnlock(selectedIndicator.indicatorId); setDetailOpen(false); }}
                      >
                        <Unlock className="h-3 w-3 mr-1" />
                        Déverrouiller
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedIndicator && (
            <div className="space-y-3">
              {/* Projet source */}
              {(() => {
                const projectInfo = getProjectForIndicator(selectedIndicator.indicatorId);
                return projectInfo && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
                    <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Projet source</p>
                      <p className="text-xs font-medium truncate">{projectInfo.projectName}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Valeurs clés */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-md bg-muted/40 text-center">
                  <p className="text-[10px] text-muted-foreground">Unité</p>
                  <p className="text-xs font-semibold">{selectedIndicator.unit}</p>
                </div>
                <div className="p-2 rounded-md bg-muted/40 text-center">
                  <p className="text-[10px] text-muted-foreground">Référence</p>
                  <p className="text-xs font-semibold">{formatNumber(selectedIndicator.baselineValue)}</p>
                </div>
                <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-center">
                  <p className="text-[10px] text-muted-foreground">Cible {year}</p>
                  <p className="text-sm font-bold text-primary">{formatNumber(selectedIndicator.annualTarget)}</p>
                </div>
              </div>

              {/* Répartition trimestrielle */}
              <div className="p-2 rounded-md border">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium">Répartition trimestrielle</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "T1", value: selectedIndicator.targetT1, color: "bg-blue-500", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
                    { label: "T2", value: selectedIndicator.targetT2, color: "bg-emerald-500", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
                    { label: "T3", value: selectedIndicator.targetT3, color: "bg-amber-500", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
                    { label: "T4", value: selectedIndicator.targetT4, color: "bg-purple-500", bgLight: "bg-purple-50 dark:bg-purple-950/30" },
                  ].map((q) => (
                    <div key={q.label} className={`p-1.5 rounded text-center ${q.bgLight}`}>
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <span className={`w-2 h-2 rounded-full ${q.color}`}></span>
                        <span className="text-[10px] font-medium">{q.label}</span>
                      </div>
                      <p className="text-xs font-semibold">{formatNumber(q.value)}</p>
                    </div>
                  ))}
                </div>
                
                {/* Barre visuelle */}
                {selectedIndicator.annualTarget > 0 && (
                  <div className="mt-2">
                    <div className="h-3 rounded overflow-hidden flex bg-muted">
                      {[
                        { value: selectedIndicator.targetT1, color: "bg-blue-500", label: "T1" },
                        { value: selectedIndicator.targetT2, color: "bg-emerald-500", label: "T2" },
                        { value: selectedIndicator.targetT3, color: "bg-amber-500", label: "T3" },
                        { value: selectedIndicator.targetT4, color: "bg-purple-500", label: "T4" },
                      ].map((q) => {
                        const percentage = (q.value / selectedIndicator.annualTarget) * 100;
                        if (percentage === 0) return null;
                        return (
                          <div 
                            key={q.label}
                            className={`${q.color} flex items-center justify-center text-[8px] font-medium text-white`}
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage >= 20 && q.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {selectedIndicator.validationStatus === "valide" && selectedIndicator.validatedAt && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300">
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">
                    Validé le {new Date(selectedIndicator.validatedAt).toLocaleDateString('fr-FR')} par {selectedIndicator.validatedBy}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t mt-2">
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)} className="h-7 text-xs">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Indicator Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIndicator ? "Modifier la planification" : "Planifier un indicateur"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingIndicator && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Projet</label>
                  <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSelectedIndicatorId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsWithIndicators.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Indicateur</label>
                  <Select
                    value={selectedIndicatorId}
                    onValueChange={setSelectedIndicatorId}
                    disabled={!selectedProjectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedProjectId ? "Sélectionner un indicateur" : "Sélectionner d'abord un projet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIndicators.map((indicator) => (
                        <SelectItem key={indicator.id} value={indicator.id}>
                          {indicator.code} - {indicator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(selectedIndicatorData || editingIndicator) && (
              <>
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {editingIndicator?.indicatorName || selectedIndicatorData?.name}
                    </span>
                    <Badge variant="outline">
                      {editingIndicator?.unit || selectedIndicatorData?.unit}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valeur de référence: {formatNumber(editingIndicator?.baselineValue || selectedIndicatorData?.baselineValue || 0)}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Cible annuelle {year}</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoDistribute}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Répartir
                    </Button>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={annualTarget}
                    onChange={(e) => setAnnualTarget(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-blue-600">T1</label>
                    <Input
                      type="number"
                      min={0}
                      value={targetT1}
                      onChange={(e) => setTargetT1(parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-emerald-600">T2</label>
                    <Input
                      type="number"
                      min={0}
                      value={targetT2}
                      onChange={(e) => setTargetT2(parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-amber-600">T3</label>
                    <Input
                      type="number"
                      min={0}
                      value={targetT3}
                      onChange={(e) => setTargetT3(parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-purple-600">T4</label>
                    <Input
                      type="number"
                      min={0}
                      value={targetT4}
                      onChange={(e) => setTargetT4(parseInt(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                </div>

                {totalQuarterly !== annualTarget && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Total trimestriel ({formatNumber(totalQuarterly)}) ≠ Cible annuelle ({formatNumber(annualTarget)})
                  </p>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!selectedIndicatorData && !editingIndicator}>
              {editingIndicator ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PTAIndicatorPlanningComponent;