import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import TicketCountByYear from "../components/TicketCountByYear";
import Header from "../components/Header";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";
import YearPicker from "../components/YearPicker";

interface ClarilogAnnuelProps {
    // Définir les props ici si nécessaire
}

const ClarilogAnnuel: React.FC<ClarilogAnnuelProps> = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const [year, setYear] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const yearStr = searchParams.get("year");
        const yearNumber = yearStr ? parseInt(yearStr, 10) : undefined;
        setYear(yearNumber);
        setLoading(false);
    }, [location.search]); // Dépendance sur location.search

    if (loading) {
        return <p>Chargement...</p>;
    }

    if (year === undefined) {
        return <p>Erreur : Année non spécifiée</p>;
    }

    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <YearPicker initialYear={year} />
            <h2>Détails :</h2>
            <TicketCountByYear year={year} />
            <BarChart year={year} />
            <PieChart year={year} />
        </>
    );
};

export default ClarilogAnnuel;