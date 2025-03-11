// TODO : PAGE "CalendrierPage"
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import TicketCountByMonthYear from "../components/TicketCountByMonthYear";

import Header from "../components/Header";
import CalendarComponent from "../components/Calendar"
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";

export default function ClarilogMensuel() {

    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    
    let month = searchParams.get("month");
    let year = searchParams.get("year");
    
    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <CalendarComponent />
            <h2>Détails :</h2>
            <TicketCountByMonthYear 
                month={month}
                year={year}
            />
            <BarChart 
                month={month}
                year={year}
            />
            <PieChart 
                month={month}
                year={year}
            />
            {/* COMPOSANTS POUR LES NOMBRES DE TICKETS */}
            {/* COMPOSANT BARCHART */}
            {/* COMPOSANT PIECHART */}
        </>
    );
}