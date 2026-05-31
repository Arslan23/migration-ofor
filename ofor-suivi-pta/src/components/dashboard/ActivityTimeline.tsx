import { useMemo } from "react";
import { CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockProjects } from "@/data/mockProjects";
import { Badge } from "@/components/ui/badge";

interface ActivityTimelineProps {
  filterProjectId?: string;
}

const getActivityIcon = (type: "completed" | "upcoming" | "delayed") => {
  switch (type) {
    case "completed":
      return (
        <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
        </div>
      );
    case "upcoming":
      return (
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-primary" />
        </div>
      );
    case "delayed":
      return (
        <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        </div>
      );
  }
};

const ActivityTimeline = ({ filterProjectId = "all" }: ActivityTimelineProps) => {
  const activities = useMemo(() => {
    const filteredProjects = filterProjectId === "all" 
      ? mockProjects 
      : mockProjects.filter(p => p.id === filterProjectId);

    const allActivities: Array<{
      id: string;
      title: string;
      project: string;
      date: string;
      type: "completed" | "upcoming" | "delayed";
    }> = [];

    filteredProjects.forEach(project => {
      project.activities?.forEach(activity => {
        let type: "completed" | "upcoming" | "delayed" = "upcoming";
        let date = "À venir";

        if (activity.status === "termine") {
          type = "completed";
          date = "Terminé";
        } else if (activity.status === "annule") {
          type = "delayed";
          date = "Annulé";
        } else if (activity.status === "en_cours") {
          type = "upcoming";
          date = "En cours";
        } else if (activity.status === "planifie") {
          type = "upcoming";
          date = "Planifié";
        }

        allActivities.push({
          id: activity.id,
          title: activity.name,
          project: project.name,
          date,
          type,
        });
      });
    });

    // Trier: delayed en premier, puis en cours, puis terminé
    return allActivities
      .sort((a, b) => {
        const order = { delayed: 0, upcoming: 1, completed: 2 };
        return order[a.type] - order[b.type];
      })
      .slice(0, 6);
  }, [filterProjectId]);

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-base">Activités récentes</h3>
          <p className="text-xs text-muted-foreground">Dernières mises à jour</p>
        </div>
        <div className="flex items-center gap-2">
          {filterProjectId !== "all" && (
            <Badge variant="outline" className="text-[10px]">Filtré</Badge>
          )}
          <button className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[280px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-sm">
            Aucune activité trouvée
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-2.5 pb-3",
                index !== activities.length - 1 && "border-b border-border"
              )}
            >
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-xs truncate">{activity.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{activity.project}</p>
              </div>
              <span
                className={cn(
                  "text-[10px] whitespace-nowrap",
                  activity.type === "delayed" ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {activity.date}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;