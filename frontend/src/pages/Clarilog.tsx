import { Link, useLocation, useNavigate } from "react-router-dom"; // Add useNavigate here
import { useTranslation } from "../hooks/useTranslation";
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

    const navigate = useNavigate();  // Initialize the navigate function

    const goToCalendar = () => {
        const today = new Date();
        const month = (today.getMonth() + 1).toString(); // Mois 1-indexé
        const year = today.getFullYear().toString();

        navigate(`/clarilog_mensuel?month=${month}&year=${year}`);
    };

    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <div>
                <div>
                    <div>
                        <button onClick={goToCalendar}>GO TO CALENDRIER</button>
                        <TicketCount />
                    </div>
                </div>
                <div>
                    <div>
                        <Performance 
                            date={selectedDate}
                        />
                    </div>
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
