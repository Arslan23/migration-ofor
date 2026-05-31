import { Component, Input, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../models/project.model';
import { LucideAngularModule, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-angular';
import { BadgeComponent } from '../../../shared/ui/badge';
import { cn } from '../../../lib/utils';

interface TimelineActivity {
  id: string;
  title: string;
  project: string;
  date: string;
  type: 'completed' | 'upcoming' | 'delayed';
}

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BadgeComponent],
  templateUrl: './activity-timeline.html',
  styleUrl: './activity-timeline.scss'
})
export class ActivityTimelineComponent implements OnChanges {
  @Input() projects: Project[] = [];
  @Input() filterProjectId: string = 'all';

  activities = signal<TimelineActivity[]>([]);

  readonly icons = {
    CheckCircle2,
    Clock,
    AlertTriangle,
    ArrowRight
  };

  readonly cn = cn;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['projects'] || changes['filterProjectId']) {
      this.updateActivities();
    }
  }

  private updateActivities() {
    const filteredProjects = this.filterProjectId === 'all'
      ? this.projects
      : this.projects.filter(p => p.id === this.filterProjectId);

    const allActivities: TimelineActivity[] = [];

    filteredProjects.forEach(project => {
      project.activities?.forEach(activity => {
        let type: 'completed' | 'upcoming' | 'delayed' = 'upcoming';
        let date = 'À venir';

        if (activity.status === 'termine') {
          type = 'completed';
          date = 'Terminé';
        } else if (activity.status === 'annule') {
          type = 'delayed';
          date = 'Annulé';
        } else if (activity.status === 'en_cours') {
          type = 'upcoming';
          date = 'En cours';
        } else if (activity.status === 'planifie') {
          type = 'upcoming';
          date = 'Planifié';
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

    // Sort: delayed first, then upcoming, then completed
    this.activities.set(
      allActivities
        .sort((a, b) => {
          const order = { delayed: 0, upcoming: 1, completed: 2 };
          return order[a.type] - order[b.type];
        })
        .slice(0, 6)
    );
  }

  getActivityIconClass(type: string) {
    switch (type) {
      case 'completed': return 'bg-secondary/20 text-secondary';
      case 'upcoming': return 'bg-primary/20 text-primary';
      case 'delayed': return 'bg-destructive/20 text-destructive';
      default: return '';
    }
  }
}
