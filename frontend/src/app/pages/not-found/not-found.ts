import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlertTriangle, ArrowLeft, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div class="rounded-full bg-destructive/10 p-5 text-destructive">
        <lucide-icon [img]="icons.AlertTriangle" class="h-12 w-12"></lucide-icon>
      </div>
      <div>
        <h1 class="text-4xl font-bold">404</h1>
        <p class="mt-2 text-lg text-muted-foreground">Page introuvable</p>
        <p class="mt-4 max-w-md text-sm text-muted-foreground">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
      </div>
      <a
        routerLink="/"
        class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <lucide-icon [img]="icons.ArrowLeft" class="h-4 w-4"></lucide-icon>
        Retour à l'accueil
      </a>
    </div>
  `,
})
export class NotFoundComponent {
  readonly icons = { AlertTriangle, ArrowLeft };
}
