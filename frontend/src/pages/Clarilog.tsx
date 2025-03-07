import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import Header from "../components/Header";
import TicketCount from "../components/TicketCount";
import BarChart from "../components/BarChart";
import PieChart from "../components/PieChart"

export default function Clarilog() {
    const { t } = useTranslation();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const selectedDate = searchParams.get('date');

    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <div>
                <div>
                    <div>
                        <Link to="/clarilog_mensuel">
                            <button>GO TO CALENDRIER</button>
                        </Link>
                        <TicketCount />
                    </div>
                </div>
                <div>
                    <div></div>
                    <div>
                        <BarChart 
                            date={selectedDate} 
                            title={t("Charts.TicketsAttribution")} 
                        />
                    </div>
                    <div>
                        <PieChart 
                            date={selectedDate}
                            title={t("Charts.TiketsTypes")} 
                        />
                    </div>
                </div>
                {/* AFFICHER SEULEMENT SUR TELEPHONE */}
                <div>
                    <button>Revenir en haut de la page</button>
                </div>
            </div>
        </>
    );
}