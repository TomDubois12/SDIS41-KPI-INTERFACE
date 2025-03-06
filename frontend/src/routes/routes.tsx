import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home.tsx"
import Hub from "../pages/Hub.tsx"
import Clarilog from "../pages/Clarilog.tsx"
import Statistiques from "../pages/Statistiques.tsx"
import Alertes from "../pages/Alertes.tsx"
import ClarilogMensuel from "../pages/ClarilogMensuel.tsx";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hub" element={<Hub />} />
            <Route path="/clarilog" element={<Clarilog />} />
            <Route path="/statistiques" element={<Statistiques />} />
            <Route path="/alertes" element={<Alertes />} />
            <Route path="clarilog_mensuel" element={<ClarilogMensuel />} />
        </Routes>
    );
}
