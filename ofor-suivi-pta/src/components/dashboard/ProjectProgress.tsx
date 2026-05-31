import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { mockProjects } from "@/data/mockProjects";
import { Badge } from "@/components/ui/badge";

interface ProjectProgressProps {
  filterProjectId?: string;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    en_cours: "badge-status badge-info",
    termine: "badge-status badge-success",
    retard: "badge-status badge-danger",
    planifie: "badge-status bg-muted text-muted-foreground",
  };

  const labels: Record<string, string> = {
    en_cours: "En cours",
    termine: "Terminé",
    retard: "En retard",
    planifie: "Planifié",
  };

  return <span className={styles[status] || styles.en_cours}>{labels[status] || status}</span>;
};

const getProgressColor = (progress: number, status: string) => {
  if (status === "retard") return "bg-destructive";
  if (progress === 100) return "bg-secondary";
  return "bg-primary";
};

const formatBudget = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} Mds`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(0)} M`;
  }
  return amount.toLocaleString("fr-FR");
};

const ProjectProgress = ({ filterProjectId = "all" }: ProjectProgressProps) => {
  const filteredProjects = useMemo(() => {
    if (filterProjectId === "all") return mockProjects;
    return mockProjects.filter(p => p.id === filterProjectId);
  }, [filterProjectId]);

  // Calculer le progrès et budget pour chaque projet
  const projectsData = useMemo(() => {
    return filteredProjects.map(project => {
      const totalActivities = project.activities?.length || 0;
      const completedActivities = project.activities?.filter(a => a.status === "termine").length || 0;
      const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
      
      const budget = project.activities?.reduce((sum, a) => sum + (a.budget || 0), 0) || 0;
      const budgetUsed = Math.round(budget * (progress / 100));
      
      const hasDelayed = project.activities?.some(a => a.status === "annule");
      const status = progress === 100 ? "termine" : hasDelayed ? "retard" : "en_cours";

      return {
        id: project.id,
        name: project.name,
        region: project.region || "National",
        progress,
        budget,
        budgetUsed,
        status,
      };
    });
  }, [filteredProjects]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-base">Avancement des projets</h3>
            <p className="text-xs text-muted-foreground">Suivi des principaux projets en cours</p>
          </div>
          {filterProjectId !== "all" && (
            <Badge variant="outline" className="text-[10px]">Filtré</Badge>
          )}
        </div>
      </div>

      <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
        {projectsData.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            Aucun projet trouvé
          </div>
        ) : (
          projectsData.map((project) => (
            <div key={project.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate">{project.name}</h4>
                  <p className="text-xs text-muted-foreground">{project.region}</p>
                </div>
                {getStatusBadge(project.status)}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-semibold">{project.progress}%</span>
                </div>
                <div className="progress-bar h-1.5">
                  <div
                    className={cn("progress-fill", getProgressColor(project.progress, project.status))}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Budget: {formatBudget(project.budget)} FCFA</span>
                  <span>Consommé: {formatBudget(project.budgetUsed)} FCFA</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 bg-muted/30 border-t border-border">
        <button className="text-xs font-medium text-primary hover:underline">
          Voir tous les projets →
        </button>
      </div>
    </div>
  );
};

export default ProjectProgress;