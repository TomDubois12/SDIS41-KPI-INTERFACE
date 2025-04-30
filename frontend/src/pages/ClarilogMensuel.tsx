import { useLocation } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import CalendarComponent from "../components/Calendar"
import TicketCountByMonthYear from "../components/TicketCountByMonthYear";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart";

import styles from '../styles/pages/ClarilogMensuel.module.scss';

export default function ClarilogMensuel() {
    const { t } = useTranslation();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    let month = searchParams.get("month");
    let year = searchParams.get("year");

    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <div className={styles.container}>
                <div className={styles.divCalendar}>
                    <CalendarComponent />
                </div>
                <div className={styles.divStats}>
                    <TicketCountByMonthYear
                        month={month}
                        year={year}
                    />
                    <BarChart
                        month={month}
                        year={year}
                        title={t("Charts.TicketsAttributionMonth")}
                    />
                    <PieChart
                        month={month}
                        year={year}
                        title={t("Charts.TiketsTypesMonth")}
                    />
                </div>
            </div>
        </>
    );
}