import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/pages/ClarilogAnnuel.module.scss';

import TicketCountByYear from "../components/TicketCountByYear";
import Header from "../components/Header";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";
import YearPicker from "../components/YearPicker";
import Button from "../components/Button";

const ClarilogAnnuel: React.FC = () => {
    
    const { t } = useTranslation();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [year, setYear] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const yearStr = searchParams.get("year");
        const yearNumber = yearStr ? parseInt(yearStr, 10) : undefined;
        setYear(yearNumber);
        setLoading(false);
    }, [location.search]);

    if (loading) {
        return <p>{t("Global.Chargement")}</p>;
    }

    if (year === undefined) {
        return <p>Erreur : Année non spécifiée</p>;
    }

    const handleMonthRedirect = () => {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        navigate(`/clarilog_mensuel?year=${year}&month=${month}`);
    };

    return (
        <>
            <Header
                text={t("Titles.PerfClarilog")} 
            />
            <div className={styles.container}>
                <div className={styles.divCalendar}>
                    <YearPicker 
                        initialYear={year} 
                    />
                    <TicketCountByYear 
                        year={year} 
                    />
                    <Button
                        backgroundColor={"#2B3244"}
                        text={t("Calendar.GoToMonth")}
                        textColor={"white"}
                        onClick={handleMonthRedirect}
                    />
                </div>
                <div className={styles.divStats}>
                    <BarChart 
                        year={year} 
                        title={t("Charts.TicketsAttributionYear")} 
                        />
                    <PieChart 
                        year={year} 
                        title={t("Charts.TiketsTypesYear")} 
                        />
                </div>
            </div>
        </>
    );
};

export default ClarilogAnnuel;