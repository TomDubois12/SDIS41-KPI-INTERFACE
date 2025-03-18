import { useLocation, useNavigate } from "react-router-dom";

import { useTranslation } from "../hooks/useTranslation";

import styles from '../styles/pages/Clarilog.module.scss';

import Header from "../components/Header";
import TicketCount from "../components/TicketCount";
import Performance from "../components/Performance";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";


export default function Clarilog() {
    
    const { t } = useTranslation();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const selectedDate = searchParams.get('date');

    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <div className={styles.container}>
                <div className={styles.divTab}>
                    <TicketCount />
                </div>
                <div className={styles.divStats}>
                    <Performance 
                        date={selectedDate}
                    />
                    <BarChart 
                        date={selectedDate} 
                        title={t("Charts.TicketsAttributionDay")} 
                    />
                    <PieChart 
                        date={selectedDate}
                        title={t("Charts.TiketsTypesDay")} 
                    />
                </div>
            </div>
        </>
    );
}
