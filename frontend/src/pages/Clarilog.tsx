import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

import Header from "../components/Header";

export default function Clarilog() {

    const { t } = useTranslation();
    
    return (
        <>
            <Header text={t("Titles.PerfClarilog")} />
            <div> global
                <div> div de gauche
                    <div></div> div texte
                    <div></div> div tableau
                </div>
                <div> div de droite
                    <div></div> div Cadre rouge performance (caché en version pc) b
                    <div></div> div BarChart
                    <div></div> div PieChart
                </div>
                <div> div bouton revenir en haut (caché en version pc)
                    <button></button>
                </div>
            </div>
        </>
    );
}