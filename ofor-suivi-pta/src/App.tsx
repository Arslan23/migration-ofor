import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./contexts/SettingsContext";
import { UnitesProvider } from "./contexts/UnitesContext";
import TableauDeBord from "./pages/TableauDeBord";
import Projets from "./pages/Projets";
import ProjetDetail from "./pages/ProjetDetail";
import Planification from "./pages/Planification";
import Suivi from "./pages/Suivi";
import Cartographie from "./pages/Cartographie";
import ContratPerformance from "./pages/ContratPerformance";
import CDPDetail from "./pages/CDPDetail";
import ReferentielUnites from "./pages/ReferentielUnites";
import ReferentielIndicateurs from "./pages/ReferentielIndicateurs";
import ReferentielPersonnel from "./pages/ReferentielPersonnel";
import ReferentielEntites from "./pages/ReferentielEntites";
import ReferentielZones from "./pages/ReferentielZones";
import ReferentielBailleurs from "./pages/ReferentielBailleurs";
import ReferentielWorkflows from "./pages/ReferentielWorkflows";
import ReferentielCDP from "./pages/ReferentielCDP";
import ReferentielOperations from "./pages/ReferentielOperations";
import Administration from "./pages/Administration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <UnitesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<TableauDeBord />} />
              <Route path="/projets" element={<Projets />} />
              <Route path="/projets/:id" element={<ProjetDetail />} />
              <Route path="/planification" element={<Planification />} />
              <Route path="/suivi" element={<Suivi />} />
              <Route path="/contrat-performance" element={<ContratPerformance />} />
              <Route path="/contrat-performance/:id" element={<CDPDetail />} />
              <Route path="/cartographie" element={<Cartographie />} />
              <Route path="/referentiel/unites" element={<ReferentielUnites />} />
              <Route path="/referentiel/indicateurs" element={<ReferentielIndicateurs />} />
              <Route path="/referentiel/personnel" element={<ReferentielPersonnel />} />
              <Route path="/referentiel/entites" element={<ReferentielEntites />} />
              <Route path="/referentiel/zones" element={<ReferentielZones />} />
              <Route path="/referentiel/bailleurs" element={<ReferentielBailleurs />} />
              <Route path="/referentiel/workflows" element={<ReferentielWorkflows />} />
              <Route path="/referentiel/cdp" element={<ReferentielCDP />} />
              <Route path="/referentiel/operations" element={<ReferentielOperations />} />
              <Route path="/administration" element={<Administration />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UnitesProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
