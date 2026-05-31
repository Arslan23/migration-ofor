## Objectif

Générer un fichier Excel `backlog.xlsx` exhaustif organisé par release (MVP → V3), couvrant l'existant, les améliorations identifiées dans la mémoire projet, l'activation Lovable Cloud (auth, base de données, RLS, multi-utilisateurs) et la roadmap future (notifications, BI, intégrations).

## Livrable

Un fichier `/mnt/documents/backlog.xlsx` téléchargeable contenant plusieurs feuilles, avec mise en forme professionnelle (en-têtes colorés, filtres auto, largeurs ajustées, formules de synthèse).

## Structure du classeur

1. **Synthèse** — KPI global (nb stories par release, par module, par priorité, charge totale en jours/homme), formules `COUNTIF`/`SUMIF`.
2. **Backlog** — feuille principale (≈ 180-220 lignes), colonnes :
   - ID (BL-001…)
   - Release (MVP / V1.0 / V1.1 / V2.0 / V3.0)
   - Module (Projets, Planification PTA, CDP, Suivi, Tableau de bord, Reporting/Exports, Référentiels, Administration, Cloud/Auth, Mobile/UX, Intégrations)
   - Epic
   - User Story (En tant que … je veux … afin de …)
   - Critères d'acceptation (Given/When/Then condensés)
   - Persona (Chef de service, Resp. PTA, Resp. CDP, Direction, Admin)
   - Priorité MoSCoW (Must / Should / Could / Won't)
   - Estimation (jours-homme)
   - Dépendances (IDs)
   - Statut (Fait / À faire / En cours)
   - Notes techniques
3. **Roadmap** — vue agrégée par release avec dates cibles indicatives et jalons.
4. **Personas** — description courte des 5 personas et leurs besoins clés.
5. **Glossaire** — PTA, CDP, T1-T4, Fiche de suivi, Hors-projet, Opération, etc.

## Contenu par release (aperçu du périmètre)

```text
MVP (déjà livré, statut « Fait »)
  Projets : CRUD, wizard multi-étapes, validation Brouillon→Validé,
            financements, zones, indicateurs, livrables, activités
  Planification PTA : PTA versionnés, activités service-first,
            rattachement projet XOR opération, livrables T1-T4,
            indicateurs annuels T1-T4, validation par item
  CDP : création, indicateurs hiérarchiques, workflow Brouillon→Actif,
            fiches de suivi historiques, commentaires + pièces jointes
  Suivi : fiches activités (workflow), fiches indicateurs (popup unitaire),
            synthèse, vue Pipeline avec filtres + drill-down
  Tableau de bord : Projets, Suivi PTA (filtres service→projet→opération,
            popup synthèse), Suivi CDP, filtre projet global
  Référentiels : Indicateurs, Unités, Zones, Bailleurs, Entités,
            Personnel, Opérations, Workflows, CDP
  Exports : PDF/Excel reproduisant filtres, boîtes de stats, branding admin
  Administration : org, branding, support, sécurité

V1.0 — Backend Lovable Cloud
  Activation Cloud, schéma DB, migration depuis mocks
  Auth email + Google, gestion sessions
  Table user_roles + enum app_role + has_role() SECURITY DEFINER
  RLS sur toutes les tables métier (lecture par service, écriture par rôle)
  Storage pour pièces jointes (fiches, CDP, projets)
  Edge functions : génération exports lourds, calculs consolidés
  Audit trail (qui a validé/modifié quoi)

V1.1 — Améliorations UX déjà identifiées
  Mobile : Sheet sidebar, accordéons, cartes au lieu de tableaux
  Modales adaptatives (accordéons sur mobile)
  Deep-linking par query params sur tous les onglets
  Optimisation densité tableaux (déjà règle projet)
  Cohérence séparateurs milliers PDF
  Affichage description livrable partout (déjà en cours)

V2.0 — Collaboration & notifications
  Notifications in-app + email (validation, retard, seuil dépassé)
  Commentaires temps-réel sur fiches
  Mentions @utilisateur
  Tâches / actions de suivi assignables
  Historique de versions visible (PTA, CDP, projets)
  Workflow d'approbation multi-niveaux configurable

V3.0 — BI, IA, intégrations
  Tableau de bord BI configurable (widgets drag&drop)
  Comparaison multi-années CDP (étendre l'existant)
  Alertes prédictives (retard probable) via Lovable AI
  Résumés automatiques de fiches via Lovable AI
  Export PowerPoint de synthèse
  API publique read-only + webhooks
  Connecteur SIG/cartographie avancé
  Intégration emails (envoi rapports planifiés)
  Module budgétaire avancé (engagements, décaissements réels)
```

Chaque ligne du backlog aura priorité, estimation (0,5 à 8 j/h), dépendances et critères d'acceptation. Les items « Fait » du MVP couvrent ~120 stories ; V1→V3 ajoutent ~80-100 stories nouvelles.

## Aspect technique de génération

- Script Python avec `openpyxl` :
  - styles : en-tête bleu foncé `#1E40AF` texte blanc gras, lignes alternées `#F3F4F6`
  - badges couleur sur Priorité (Must=rouge, Should=orange, Could=bleu, Won't=gris)
  - badges couleur sur Statut (Fait=vert, En cours=ambre, À faire=gris)
  - `freeze_panes` ligne 2, `auto_filter` sur la plage
  - largeurs colonnes ajustées au contenu (US Story large, IDs étroits)
  - feuille Synthèse avec `COUNTIFS` par release × priorité, `SUMIFS` charge
- Recalcul des formules via `recalculate_formulas.py`
- QA : ouvrir le xlsx, vérifier 0 erreur formule, vérifier nb lignes attendu
- Sortie : `/mnt/documents/backlog.xlsx` + tag `<lov-artifact>`

## Hors périmètre

- Pas de modification du code applicatif.
- Pas de création de tickets dans un outil externe (Jira, Linear).
- Estimations indicatives, à affiner avec l'équipe.