import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";
import TicketCount from "../components/TicketCount";

export default function Clarilog() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            {/* global */}
            <div>
                {/* div de gauche */}
                <div>
                    {/* div texte */}
                    <div>
                        <Link to="/clarilog_mensuel">
                            <button>GO TO CALENDRIER</button>
                        </Link>
                    </div>
                    {/* div tableau */}
                    <div>
                        <TicketCount />
                    </div>
                </div>
                {/* div de droite */}
                <div>
                    {/* div Cadre rouge performance (caché en version pc) */}
                    <div></div>
                    {/* div BarChart */}
                    <div></div>
                    {/* div PieChart */}
                    <div></div>
                </div>
                {/* div bouton revenir en haut (caché en version pc) */}
                <div>
                    <button></button>
                </div>
            </div>
        </>
    );
}