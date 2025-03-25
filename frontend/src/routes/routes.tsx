import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home.tsx"
import Hub from "../pages/Hub.tsx"
import Clarilog from "../pages/Clarilog.tsx"
import StatistiquesMensuelles from "../pages/StatistiquesMensuelles.tsx"
import StatistiquesAnnuelles from "../pages/StatistiquesAnnuelles.tsx"
import Alertes from "../pages/Alertes.tsx"
import ClarilogMensuel from "../pages/ClarilogMensuel.tsx";
import ClarilogAnnuel from "../pages/ClarilogAnnuel.tsx";
import ClarilogTicketDetail from "../pages/ClarilogTicketDetail.tsx";
import Credits from "../pages/Credits.tsx";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hub" element={<Hub />} />
            <Route path="/clarilog" element={<Clarilog />} />
            <Route path="/statistiques_mensuelles" element={<StatistiquesMensuelles />} />
            <Route path="/statistiques_annuelles" element={<StatistiquesAnnuelles />} />
            <Route path="/alertes" element={<Alertes />} />
            <Route path="clarilog_mensuel" element={<ClarilogMensuel />} />
            <Route path="/clarilog_annuel" element={<ClarilogAnnuel />} />
            <Route path="/clarilog_detail" element={<ClarilogTicketDetail />} />
            <Route path="/credits" element={<Credits />} />
        </Routes>
    );
}
