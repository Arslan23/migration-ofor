import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout';

export const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
        data: { title: 'Tableau de bord & Reporting', subtitle: "Vue d'ensemble des performances" },
      },
      {
        path: 'projets',
        loadComponent: () => import('./pages/projets').then((m) => m.ProjetsComponent),
        data: { title: 'Projets', subtitle: 'Gestion du portefeuille de projets' },
      },
      {
        path: 'projets/:id',
        loadComponent: () => import('./pages/projets/projet-detail').then((m) => m.ProjetDetailComponent),
        data: { title: 'Detail projet', subtitle: '' },
      },
      {
        path: 'planification',
        loadComponent: () =>
          import('./pages/planification/planification').then((m) => m.PlanificationComponent),
        data: { title: 'Planification PTA', subtitle: 'Plan de Travail Annuel' },
      },
      {
        path: 'suivi',
        loadComponent: () => import('./pages/suivi/suivi').then((m) => m.SuiviComponent),
        data: { title: 'Suivi des realisations', subtitle: 'Monitoring des activites' },
      },
      {
        path: 'contrat-performance',
        loadComponent: () =>
          import('./pages/contrat-performance/contrat-performance').then(
            (m) => m.ContratPerformanceComponent,
          ),
        data: { title: 'Contrat de Performance', subtitle: 'Suivi des indicateurs cles' },
      },
      {
        path: 'contrat-performance/:id',
        loadComponent: () => import('./pages/cdp-detail/cdp-detail').then((m) => m.CdpDetailComponent),
        data: { title: 'Detail CDP', subtitle: 'Contrat de performance' },
      },
      {
        path: 'cartographie',
        loadComponent: () => import('./pages/cartographie/cartographie').then((m) => m.CartographieComponent),
        data: { title: 'Cartographie', subtitle: 'Localisation des interventions' },
      },
      {
        path: 'referentiel/personnel',
        loadComponent: () =>
          import('./pages/referentiel/personnel/personnel').then((m) => m.PersonnelComponent),
        data: { title: 'Personnel', subtitle: 'Gestion des ressources humaines' },
      },
      {
        path: 'referentiel/entites',
        loadComponent: () => import('./pages/referentiel/entites/entites').then((m) => m.EntitesComponent),
        data: { title: 'Entites & Services', subtitle: 'Structure organisationnelle' },
      },
      {
        path: 'referentiel/operations',
        loadComponent: () =>
          import('./pages/referentiel/generic-referentiel').then((m) => m.GenericReferentielComponent),
        data: { title: 'Operations', subtitle: 'Catalogue des operations OFOR', refType: 'operations' },
      },
      {
        path: 'referentiel/unites',
        loadComponent: () => import('./pages/referentiel/unites/unites').then((m) => m.UnitesComponent),
        data: { title: 'Unites de mesure', subtitle: 'Unites utilisees dans les indicateurs' },
      },
      {
        path: 'referentiel/indicateurs',
        loadComponent: () => import('./pages/referentiel/indicateurs/indicateurs').then((m) => m.IndicateursComponent),
        data: { title: 'Indicateurs', subtitle: 'Referentiel des indicateurs de suivi' },
      },
      {
        path: 'referentiel/zones',
        loadComponent: () =>
          import('./pages/referentiel/generic-referentiel').then((m) => m.GenericReferentielComponent),
        data: { title: "Zones d'intervention", subtitle: 'Regions, departements et communes', refType: 'zones' },
      },
      {
        path: 'referentiel/bailleurs',
        loadComponent: () =>
          import('./pages/referentiel/generic-referentiel').then((m) => m.GenericReferentielComponent),
        data: { title: 'Bailleurs', subtitle: 'Partenaires financiers', refType: 'bailleurs' },
      },
      {
        path: 'referentiel/workflows',
        loadComponent: () =>
          import('./pages/referentiel/generic-referentiel').then((m) => m.GenericReferentielComponent),
        data: { title: 'Workflows', subtitle: 'Circuits de validation', refType: 'workflows' },
      },
      {
        path: 'referentiel/cdp',
        loadComponent: () =>
          import('./pages/referentiel/generic-referentiel').then((m) => m.GenericReferentielComponent),
        data: { title: 'Referentiel CDP', subtitle: 'Composantes et indicateurs de performance', refType: 'cdp' },
      },
      {
        path: 'administration',
        loadComponent: () =>
          import('./pages/administration/administration').then((m) => m.AdministrationComponent),
        data: { title: 'Administration', subtitle: 'Configuration du systeme' },
      },
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
        data: { title: 'Page introuvable', subtitle: 'La page demandée est introuvable' },
      },
    ],
  },
];
