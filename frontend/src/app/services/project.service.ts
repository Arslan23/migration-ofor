import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Project, ProjectStatus } from '../models/project.model';
import { PROJECTS } from '../data/project.data';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private projectsSignal = signal<Project[]>(
        PROJECTS.map(p => ({ ...p, workflowStatus: p.workflowStatus || 'valide' }))
    );

    getProjectsSignal() {
        return this.projectsSignal;
    }

    getProjects(): Observable<Project[]> {
        return of(this.projectsSignal());
    }

    getProject(id: string): Observable<Project | undefined> {
        const project = this.projectsSignal().find((p: Project) => p.id === id);
        return of(project);
    }

    getProjectsByStatus(status: ProjectStatus): Observable<Project[]> {
        const projects = this.projectsSignal().filter((p: Project) => p.status === status);
        return of(projects);
    }

    addProject(project: Project) {
        this.projectsSignal.update(projs => [project, ...projs]);
    }

    updateProject(id: string, updated: Partial<Project>) {
        this.projectsSignal.update(projs =>
            projs.map(p => p.id === id ? { ...p, ...updated, updatedAt: new Date().toISOString() } as Project : p)
        );
    }

    deleteProject(id: string) {
        this.projectsSignal.update(projs => projs.filter(p => p.id !== id));
    }
}
