import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  FolderKanban,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Settings,
  MapPin,
  Users,
  FileText,
  ChevronDown,
  LogOut,
  Ruler,
  Building2,
  Award,
  Target,
  Workflow,
} from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {
  readonly icons = {
    LayoutDashboard,
    FolderKanban,
    Calendar,
    ClipboardCheck,
    BarChart3,
    Settings,
    MapPin,
    Users,
    FileText,
    ChevronDown,
    LogOut,
    Ruler,
    Building2,
    Award,
    Target,
    Workflow,
  };

  referentielOpen = signal(false);

  mainNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord & Reporting' },
    { to: '/projets', icon: FolderKanban, label: 'Projets' },
    { to: '/planification', icon: Calendar, label: 'Planification PTA' },
    { to: '/suivi', icon: ClipboardCheck, label: 'Suivi des realisations' },
    { to: '/contrat-performance', icon: Award, label: 'Contrat de Performance' },
  ];

  referentielItems = [
    { to: '/referentiel/personnel', icon: Users, label: 'Personnel' },
    { to: '/referentiel/entites', icon: Building2, label: 'Entites & Services' },
    { to: '/referentiel/operations', icon: Workflow, label: 'Operations' },
    { to: '/referentiel/unites', icon: Ruler, label: 'Unites de mesure' },
    { to: '/referentiel/indicateurs', icon: Target, label: 'Indicateurs' },
    { to: '/referentiel/zones', icon: MapPin, label: "Zones d'intervention" },
    { to: '/referentiel/bailleurs', icon: FileText, label: 'Bailleurs' },
    { to: '/referentiel/workflows', icon: Settings, label: 'Workflows' },
    { to: '/referentiel/cdp', icon: Award, label: 'Referentiel CDP' },
  ];

  toggleReferentiel() {
    this.referentielOpen.update((v) => !v);
  }
}
