import { Route, Routes } from "react-router-dom";

import Home from "../pages/Home";
import Hub from "../pages/Hub";
import Clarilog from "../pages/Clarilog";
import StatistiquesMensuelles from "../pages/StatistiquesMensuelles";
import StatistiquesAnnuelles from "../pages/StatistiquesAnnuelles";
import Alertes from "../pages/Alertes";
import AlertesOnduleurs from "../pages/AlertesOnduleurs";
import AlertesINPT from "../pages/AlertesINPT";
import ClarilogMensuel from "../pages/ClarilogMensuel";
import ClarilogAnnuel from "../pages/ClarilogAnnuel";
import ClarilogTicketDetail from "../pages/ClarilogTicketDetail";
import Credits from "../pages/Credits";
import HowToGetCSV from "../pages/HowToGetCSV";

/**
 * Composant React centralisant la définition des routes de l'application
 * à l'aide de `react-router-dom`. Chaque `Route` associe un chemin d'URL (`path`)
 * à un composant de page spécifique (`element`) qui sera rendu lorsque
 * l'utilisateur navigue vers ce chemin.
 *
 * @returns Le composant `Routes` contenant la configuration de toutes les routes de l'application.
 */
export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hub" element={<Hub />} />
            <Route path="/clarilog" element={<Clarilog />} />
            <Route path="/statistiques_mensuelles" element={<StatistiquesMensuelles />} />
            <Route path="/statistiques_annuelles" element={<StatistiquesAnnuelles />} />
            <Route path="/alertes" element={<Alertes />} />
            <Route path="/alertes_onduleurs" element={<AlertesOnduleurs />} />
            <Route path="/alertes_inpt" element={<AlertesINPT />} />
            <Route path="clarilog_mensuel" element={<ClarilogMensuel />} />
            <Route path="/clarilog_annuel" element={<ClarilogAnnuel />} />
            <Route path="/clarilog_detail" element={<ClarilogTicketDetail />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/howtogetcsv" element={<HowToGetCSV />} />
        </Routes>
    );
}