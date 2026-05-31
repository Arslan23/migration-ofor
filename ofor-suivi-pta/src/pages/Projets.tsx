import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Plus, Filter, MoreHorizontal, Eye, Edit, Trash2, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { mockProjects } from "@/data/mockProjects";
import { Project, STATUS_LABELS, ProjectStatus } from "@/types/project";
import ProjectWizard, { ProjectStatus as WizardProjectStatus } from "@/components/projects/ProjectWizard";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import { formatZoneIntervention } from "@/data/geoData";
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
import { toast } from "sonner";
import ExportButtons from "@/components/ui/ExportButtons";
import { exportToCSV, exportToPDF, formatMontant } from "@/lib/exportUtils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

// Types étendus pour le workflow
type ProjectWorkflowStatus = "brouillon" | "en_validation" | "valide" | "rejete";

interface ProjectExtended extends Project {
  workflowStatus?: ProjectWorkflowStatus;
}

const getStatusBadge = (status: ProjectStatus) => {
  const styles: Record<ProjectStatus, string> = {
    en_cours: "badge-status badge-info",
    termine: "badge-status badge-success",
    retard: "badge-status badge-danger",
    planifie: "badge-status bg-muted text-muted-foreground",
    suspendu: "badge-status badge-warning",
  };

  return <span className={styles[status]}>{STATUS_LABELS[status]}</span>;
};

const getWorkflowBadge = (status?: ProjectWorkflowStatus) => {
  if (!status || status === "valide") return null;
  
  const config: Record<ProjectWorkflowStatus, { label: string; className: string; icon: React.ReactNode }> = {
    brouillon: { label: "Brouillon", className: "bg-amber-100 text-amber-800 border-amber-200", icon: <Clock className="w-3 h-3" /> },
    en_validation: { label: "En validation", className: "bg-blue-100 text-blue-800 border-blue-200", icon: <AlertTriangle className="w-3 h-3" /> },
    valide: { label: "Validé", className: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="w-3 h-3" /> },
    rejete: { label: "Rejeté", className: "bg-red-100 text-red-800 border-red-200", icon: <AlertTriangle className="w-3 h-3" /> },
  };

  const cfg = config[status];
  return (
    <Badge variant="outline" className={cn("gap-1 text-xs", cfg.className)}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
};

const formatBudget = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Projets = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projects, setProjects] = useState<ProjectExtended[]>(
    mockProjects.map(p => ({ ...p, workflowStatus: "valide" as ProjectWorkflowStatus }))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [validateProjectId, setValidateProjectId] = useState<string | null>(null);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesWorkflow = workflowFilter === "all" || project.workflowStatus === workflowFilter;
    return matchesSearch && matchesStatus && matchesWorkflow;
  });

  const handleCreateProject = (data: any, workflowStatus: WizardProjectStatus) => {
    const newProject: ProjectExtended = {
      id: String(Date.now()),
      code: data.code,
      name: data.name,
      description: data.description,
      region: data.region || "",
      zonesIntervention: data.zonesIntervention || [],
      bailleur: data.bailleur || "",
      budget: data.budget || 0,
      currency: data.currency || "XOF",
      budgetFCFA: data.budgetFCFA || data.budget || 0,
      startDate: data.startDate ? data.startDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      endDate: data.endDate ? data.endDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      progress: 0,
      status: workflowStatus === "valide" ? "planifie" : "planifie",
      responsible: data.responsible || "",
      responsibleEmail: data.responsibleEmail,
      responsiblePhone: data.responsiblePhone,
      objectives: data.objectives,
      serviceResponsableId: data.serviceResponsableId,
      indicators: [],
      activities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workflowStatus: workflowStatus as ProjectWorkflowStatus,
    };
    setProjects([newProject, ...projects]);
  };

  const handleValidateProject = (id: string) => {
    setProjects(projects.map(p => 
      p.id === id ? { ...p, workflowStatus: "valide" as ProjectWorkflowStatus } : p
    ));
    toast.success("Projet validé avec succès");
    setValidateProjectId(null);
  };

  const handleRejectProject = (id: string) => {
    setProjects(projects.map(p => 
      p.id === id ? { ...p, workflowStatus: "rejete" as ProjectWorkflowStatus } : p
    ));
    toast.info("Projet rejeté");
    setValidateProjectId(null);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    toast.success("Projet supprimé");
    setDeleteId(null);
  };

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);

  // Export functions
  const handleExportCSV = () => {
    const columns = [
      { key: "code", header: "Code" },
      { key: "name", header: "Projet" },
      { key: "region", header: "Région" },
      { key: "bailleur", header: "Bailleur" },
      { key: "budget", header: "Budget (FCFA)" },
      { key: "startDate", header: "Début" },
      { key: "endDate", header: "Fin" },
      { key: "status", header: "Statut" },
      { key: "progress", header: "Avancement (%)" },
    ];
    const data = filteredProjects.map((p) => ({
      ...p,
      status: STATUS_LABELS[p.status],
      startDate: format(new Date(p.startDate), "dd/MM/yyyy"),
      endDate: format(new Date(p.endDate), "dd/MM/yyyy"),
    }));
    exportToCSV(data, columns, "projets");
    toast.success("Export CSV généré");
  };

  const handleExportPDF = () => {
    const columns = [
      { key: "code", header: "Code", width: "10%" },
      { key: "name", header: "Projet", width: "25%" },
      { key: "region", header: "Région", width: "12%" },
      { key: "bailleur", header: "Bailleur", width: "12%" },
      { key: "budget", header: "Budget (FCFA)", width: "15%" },
      { key: "periode", header: "Période", width: "14%" },
      { key: "status", header: "Statut", width: "12%" },
    ];
    const data = filteredProjects.map((p) => ({
      code: p.code,
      name: p.name,
      region: p.region,
      bailleur: p.bailleur,
      budget: p.budget,
      periode: `${format(new Date(p.startDate), "dd/MM/yy")} - ${format(new Date(p.endDate), "dd/MM/yy")}`,
      status: STATUS_LABELS[p.status],
    }));
    exportToPDF("Liste des Projets", data, columns, "projets", {
      subtitle: `${filteredProjects.length} projet(s)`,
      summary: [
        { label: "Total projets", value: String(filteredProjects.length) },
        { label: "Budget total", value: `${formatMontant(totalBudget)} FCFA` },
        { label: "Avancement moyen", value: `${avgProgress}%` },
      ],
    });
    toast.success("Export PDF généré");
  };

  return (
    <DashboardLayout
      title="Projets et Programmes"
      subtitle="Gestion et suivi des projets OFOR"
    >
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-between">
          <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                className="pl-10 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                <SelectTrigger className="w-full sm:w-32 h-9 text-sm">
                  <SelectValue placeholder="Workflow" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="brouillon">Brouillons</SelectItem>
                  <SelectItem value="en_validation">En validation</SelectItem>
                  <SelectItem value="valide">Validés</SelectItem>
                  <SelectItem value="rejete">Rejetés</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 h-9 text-sm">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="retard">En retard</SelectItem>
                  <SelectItem value="planifie">Planifié</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
            <Button onClick={() => setShowCreateForm(true)} size="sm" className="h-9">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nouveau projet</span>
            </Button>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <div className="bg-card rounded-lg sm:rounded-xl border border-border p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Total projets</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-heading font-bold text-foreground mt-0.5 sm:mt-1">{projects.length}</p>
          </div>
          <div className="bg-card rounded-lg sm:rounded-xl border border-border p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">En cours</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-heading font-bold text-primary mt-0.5 sm:mt-1">
              {projects.filter((p) => p.status === "en_cours").length}
            </p>
          </div>
          <div className="bg-card rounded-lg sm:rounded-xl border border-border p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Budget total</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-heading font-bold text-foreground mt-0.5 sm:mt-1">
              {(totalBudget / 1000000000).toFixed(1)} Mds
            </p>
          </div>
          <div className="bg-card rounded-lg sm:rounded-xl border border-border p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Taux moyen</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-heading font-bold text-secondary mt-0.5 sm:mt-1">{avgProgress}%</p>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header hover:bg-muted/50">
                  <TableHead className="w-24 lg:w-28 text-xs">Code</TableHead>
                  <TableHead className="text-xs">Projet</TableHead>
                  <TableHead className="text-xs">Bailleur</TableHead>
                  <TableHead className="text-right text-xs">Budget</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs">Période</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow 
                    key={project.id} 
                    className={cn(
                      "hover:bg-muted/30 cursor-pointer",
                      project.workflowStatus === "brouillon" && "bg-amber-50/50 dark:bg-amber-950/10",
                      project.workflowStatus === "en_validation" && "bg-blue-50/50 dark:bg-blue-950/10"
                    )}
                    onClick={() => project.workflowStatus === "valide" ? navigate(`/projets/${project.id}`) : null}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {project.code}
                    </TableCell>
                    <TableCell className="font-medium text-sm max-w-[220px] truncate">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{project.name}</span>
                        {getWorkflowBadge(project.workflowStatus)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{project.bailleur}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatBudget(project.budget)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      <div className="text-muted-foreground">
                        {formatDate(project.startDate)}
                      </div>
                      <div className="text-xs">{formatDate(project.endDate)}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                          }}>
                            <FileText className="w-4 h-4 mr-2" />
                            Fiche détaillée
                          </DropdownMenuItem>
                          {project.workflowStatus === "valide" && (
                            <DropdownMenuItem onClick={() => navigate(`/projets/${project.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir page
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigate(`/projets/${project.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {project.workflowStatus === "en_validation" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setValidateProjectId(project.id);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Valider / Rejeter
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(project.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Cards - Mobile */}
        <div className="md:hidden space-y-2">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-card rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => navigate(`/projets/${project.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-muted-foreground">{project.code}</p>
                  <h3 className="font-medium text-sm truncate">{project.name}</h3>
                </div>
                {getStatusBadge(project.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Région:</span> {project.region}
                </div>
                <div>
                  <span className="font-medium text-foreground">Budget:</span> {(project.budget / 1000000).toFixed(0)} M
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage de {filteredProjects.length} projet{filteredProjects.length > 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Précédent
            </Button>
            <Button variant="outline" size="sm">
              Suivant
            </Button>
          </div>
        </div>
      </div>

      {/* Create Project Wizard */}
      <ProjectWizard
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateProject}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le projet et toutes ses données seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDeleteProject(deleteId)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Validation Confirmation */}
      <AlertDialog open={!!validateProjectId} onOpenChange={() => setValidateProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider le projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le projet sera marqué comme validé et pourra démarrer son exécution.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={() => validateProjectId && handleRejectProject(validateProjectId)}
              className="text-destructive"
            >
              Rejeter
            </Button>
            <AlertDialogAction onClick={() => validateProjectId && handleValidateProject(validateProjectId)}>
              Valider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      />
    </DashboardLayout>
  );
};

export default Projets;
